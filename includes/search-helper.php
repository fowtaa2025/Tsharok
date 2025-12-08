<?php
/**
 * Search Helper Class
 * Handles MySQL FULLTEXT search, filtering, and sorting
 * Tsharok LMS
 */

defined('TSHAROK_INIT') or die('Direct access not permitted');

class SearchHelper {
    private $db;
    
    public function __construct(PDO $db) {
        $this->db = $db;
    }
    
    /**
     * Perform FULLTEXT search on courses
     * 
     * @param string $searchQuery The search term
     * @param array $filters Associative array of filters
     * @param string $sortBy Sort method
     * @param int $page Page number
     * @param int $limit Results per page
     * @return array Search results with pagination
     */
    public function searchCourses($searchQuery, $filters = [], $sortBy = 'relevance', $page = 1, $limit = 12) {
        $offset = ($page - 1) * $limit;
        $params = [];
        $whereConditions = ['c.is_published = 1'];
        
        // Build SELECT fields
        $selectFields = $this->buildSelectFields($searchQuery, $params);
        
        // Add FULLTEXT search condition
        if (!empty($searchQuery)) {
            $whereConditions[] = 'MATCH(c.title, c.description) AGAINST(? IN NATURAL LANGUAGE MODE)';
            $params[] = $searchQuery;
        }
        
        // Apply filters
        $this->applyFilters($whereConditions, $params, $filters);
        
        // Build WHERE clause
        $whereClause = implode(' AND ', $whereConditions);
        
        // Get sort order
        $orderBy = $this->getSortOrder($sortBy, !empty($searchQuery));
        
        // Count total results
        $totalResults = $this->countResults($whereClause, $params);
        
        // Build main query
        $query = "
            SELECT 
                $selectFields,
                COUNT(DISTINCT e.enrollment_id) as enrollment_count,
                COALESCE(AVG(r.rating), 0) as average_rating,
                COUNT(DISTINCT r.rating_id) as rating_count
            FROM courses c
            LEFT JOIN enrollments e ON c.course_id = e.course_id AND e.status = 'active'
            LEFT JOIN ratings r ON c.course_id = r.course_id
            WHERE $whereClause
            GROUP BY c.course_id
        ";
        
        // Apply rating filter (HAVING clause)
        if (isset($filters['minRating']) && $filters['minRating'] > 0) {
            $query .= " HAVING average_rating >= ?";
            $params[] = floatval($filters['minRating']);
        }
        
        $query .= " ORDER BY $orderBy LIMIT ? OFFSET ?";
        $params[] = $limit + 1;
        $params[] = $offset;
        
        $stmt = $this->db->prepare($query);
        $stmt->execute($params);
        $courses = $stmt->fetchAll();
        
        // Check for more results
        $hasMore = count($courses) > $limit;
        if ($hasMore) {
            array_pop($courses);
        }
        
        return [
            'courses' => $this->formatCourses($courses),
            'pagination' => [
                'currentPage' => $page,
                'totalPages' => ceil($totalResults / $limit),
                'totalResults' => $totalResults,
                'hasMore' => $hasMore,
                'limit' => $limit
            ]
        ];
    }
    
    /**
     * Build SELECT fields including relevance score
     */
    private function buildSelectFields($searchQuery, &$params) {
        $fields = 'c.course_id, c.title, c.description, c.category, c.level, 
                   c.duration_weeks, c.thumbnail, c.start_date, c.end_date, 
                   c.semester, c.created_at';
        
        if (!empty($searchQuery)) {
            $fields .= ', MATCH(c.title, c.description) AGAINST(? IN NATURAL LANGUAGE MODE) as relevance';
            $params[] = $searchQuery;
        } else {
            $fields .= ', 0 as relevance';
        }
        
        return $fields;
    }
    
    /**
     * Apply filters to WHERE conditions
     */
    private function applyFilters(&$whereConditions, &$params, $filters) {
        // Category filter
        if (!empty($filters['category']) && $filters['category'] !== 'all') {
            $whereConditions[] = 'c.category = ?';
            $params[] = $filters['category'];
        }
        
        // Level filter
        if (!empty($filters['level']) && $filters['level'] !== 'all') {
            $whereConditions[] = 'c.level = ?';
            $params[] = $filters['level'];
        }
        
        // Semester filter
        if (!empty($filters['semester'])) {
            $whereConditions[] = 'c.semester = ?';
            $params[] = $filters['semester'];
        }
        
        // Date range filter
        if (!empty($filters['startDate'])) {
            $whereConditions[] = 'c.start_date >= ?';
            $params[] = $filters['startDate'];
        }
        
        if (!empty($filters['endDate'])) {
            $whereConditions[] = 'c.end_date <= ?';
            $params[] = $filters['endDate'];
        }
    }
    
    /**
     * Get SQL ORDER BY clause based on sort method
     */
    private function getSortOrder($sortBy, $hasSearchQuery) {
        switch ($sortBy) {
            case 'relevance':
                return $hasSearchQuery ? 'relevance DESC, c.created_at DESC' : 'c.created_at DESC';
            
            case 'date_newest':
            case 'newest':
                return 'c.created_at DESC';
            
            case 'date_oldest':
            case 'oldest':
                return 'c.created_at ASC';
            
            case 'title_asc':
                return 'c.title ASC';
            
            case 'title_desc':
                return 'c.title DESC';
            
            case 'rating_high':
                return 'average_rating DESC, c.created_at DESC';
            
            case 'rating_low':
                return 'average_rating ASC, c.created_at DESC';
            
            case 'popular':
                return 'enrollment_count DESC, c.created_at DESC';
            
            case 'duration_short':
                return 'c.duration_weeks ASC';
            
            case 'duration_long':
                return 'c.duration_weeks DESC';
            
            default:
                return 'c.created_at DESC';
        }
    }
    
    /**
     * Count total results
     */
    private function countResults($whereClause, $params) {
        $countQuery = "SELECT COUNT(DISTINCT c.course_id) as total FROM courses c WHERE $whereClause";
        $stmt = $this->db->prepare($countQuery);
        $stmt->execute($params);
        return intval($stmt->fetch()['total']);
    }
    
    /**
     * Format courses for API response
     */
    private function formatCourses($courses) {
        return array_map(function($course) {
            return [
                'courseId' => intval($course['course_id']),
                'title' => $course['title'],
                'description' => $this->truncateText($course['description'] ?? '', 150),
                'category' => $course['category'] ?? 'General',
                'level' => ucfirst($course['level']),
                'duration' => $course['duration_weeks'] ? $course['duration_weeks'] . ' weeks' : 'N/A',
                'thumbnail' => $course['thumbnail'] ?? '/assets/images/default-course.jpg',
                'enrollmentCount' => intval($course['enrollment_count']),
                'averageRating' => round(floatval($course['average_rating']), 1),
                'ratingCount' => intval($course['rating_count']),
                'startDate' => $course['start_date'],
                'endDate' => $course['end_date'],
                'semester' => $course['semester'],
                'relevance' => isset($course['relevance']) ? round(floatval($course['relevance']), 2) : 0,
                'createdAt' => $course['created_at']
            ];
        }, $courses);
    }
    
    /**
     * Truncate text to specified length
     */
    private function truncateText($text, $length = 150) {
        if (strlen($text) <= $length) {
            return $text;
        }
        return substr($text, 0, $length) . '...';
    }
    
    /**
     * Get available filter options
     */
    public function getFilterOptions() {
        // Get categories
        $categoriesStmt = $this->db->query("
            SELECT DISTINCT category 
            FROM courses 
            WHERE category IS NOT NULL AND is_published = 1
            ORDER BY category
        ");
        $categories = $categoriesStmt->fetchAll(PDO::FETCH_COLUMN);
        
        // Get levels
        $levelsStmt = $this->db->query("
            SELECT DISTINCT level 
            FROM courses 
            WHERE is_published = 1
            ORDER BY FIELD(level, 'beginner', 'intermediate', 'advanced')
        ");
        $levels = $levelsStmt->fetchAll(PDO::FETCH_COLUMN);
        
        // Get semesters
        $semestersStmt = $this->db->query("
            SELECT DISTINCT semester 
            FROM courses 
            WHERE semester IS NOT NULL AND is_published = 1
            ORDER BY semester DESC
        ");
        $semesters = $semestersStmt->fetchAll(PDO::FETCH_COLUMN);
        
        return [
            'categories' => $categories,
            'levels' => array_map('ucfirst', $levels),
            'semesters' => $semesters
        ];
    }
    
    /**
     * Get search suggestions (autocomplete)
     */
    public function getSearchSuggestions($query, $limit = 10) {
        if (strlen($query) < 2) {
            return [];
        }
        
        $stmt = $this->db->prepare("
            SELECT DISTINCT title
            FROM courses
            WHERE is_published = 1 
            AND (title LIKE ? OR description LIKE ?)
            ORDER BY 
                CASE 
                    WHEN title LIKE ? THEN 1
                    ELSE 2
                END,
                title ASC
            LIMIT ?
        ");
        
        $likeQuery = $query . '%';
        $likeQueryAnywhere = '%' . $query . '%';
        
        $stmt->execute([$likeQueryAnywhere, $likeQueryAnywhere, $likeQuery, $limit]);
        
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }
}
?>

