<?php
/**
 * Advanced Search API with FULLTEXT Search
 * Tsharok LMS - Search, Filter, and Sort Courses
 */

define('TSHAROK_INIT', true);
session_start();

// Load configurations
require_once __DIR__ . '/../config/app.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/error-handler.php';

// Initialize API response with CORS and headers
initializeApiResponse();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJsonResponse(false, 'Invalid request method.');
}

try {
    $db = getDB();
    
    // Get search parameters
    $searchQuery = isset($_GET['q']) ? trim($_GET['q']) : '';
    $category = isset($_GET['category']) ? sanitizeInput($_GET['category']) : '';
    $level = isset($_GET['level']) ? sanitizeInput($_GET['level']) : '';
    $minPrice = isset($_GET['minPrice']) ? floatval($_GET['minPrice']) : null;
    $maxPrice = isset($_GET['maxPrice']) ? floatval($_GET['maxPrice']) : null;
    $minRating = isset($_GET['minRating']) ? floatval($_GET['minRating']) : null;
    $sortBy = isset($_GET['sortBy']) ? sanitizeInput($_GET['sortBy']) : 'relevance';
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $limit = isset($_GET['limit']) ? min(50, max(1, intval($_GET['limit']))) : 12;
    $offset = ($page - 1) * $limit;
    
    // Build the query
    $params = [];
    $whereConditions = ['c.is_published = 1'];
    
    // FULLTEXT Search
    $selectFields = 'c.course_id, c.title, c.description, c.category, c.level, 
                     c.duration_weeks, c.thumbnail, c.start_date, c.end_date, c.created_at';
    
    $orderBy = 'c.created_at DESC'; // Default sort
    
    if (!empty($searchQuery)) {
        // Use FULLTEXT search
        $searchParam = $searchQuery;
        
        // Add relevance score
        $selectFields .= ', MATCH(c.title, c.description) AGAINST(? IN NATURAL LANGUAGE MODE) as relevance';
        $params[] = $searchParam;
        
        // Add WHERE condition for FULLTEXT
        $whereConditions[] = 'MATCH(c.title, c.description) AGAINST(? IN NATURAL LANGUAGE MODE)';
        $params[] = $searchParam;
        
        // Default sort by relevance for searches
        if ($sortBy === 'relevance') {
            $orderBy = 'relevance DESC, c.created_at DESC';
        }
    } else {
        // No search query - add dummy relevance for consistent structure
        $selectFields .= ', 0 as relevance';
    }
    
    // Filter by category
    if (!empty($category) && $category !== 'all') {
        $whereConditions[] = 'c.category = ?';
        $params[] = $category;
    }
    
    // Filter by level
    if (!empty($level) && $level !== 'all') {
        $whereConditions[] = 'c.level = ?';
        $params[] = $level;
    }
    
    // Filter by price (if price column exists - currently not in schema)
    // TODO: Add price column to courses table
    
    // Build WHERE clause
    $whereClause = implode(' AND ', $whereConditions);
    
    // Handle sorting
    switch ($sortBy) {
        case 'date_newest':
            $orderBy = 'c.created_at DESC';
            break;
        case 'date_oldest':
            $orderBy = 'c.created_at ASC';
            break;
        case 'title_asc':
            $orderBy = 'c.title ASC';
            break;
        case 'title_desc':
            $orderBy = 'c.title DESC';
            break;
        case 'duration_shortest':
            $orderBy = 'c.duration_weeks ASC';
            break;
        case 'duration_longest':
            $orderBy = 'c.duration_weeks DESC';
            break;
        case 'relevance':
        default:
            // Already set above
            break;
    }
    
    // Get total count (use only WHERE params, not relevance)
    $countParams = [];
    if (!empty($searchQuery)) {
        $countParams[] = $searchQuery; // For WHERE MATCH
    }
    if (!empty($category) && $category !== 'all') {
        $countParams[] = $category;
    }
    if (!empty($level) && $level !== 'all') {
        $countParams[] = $level;
    }
    
    $countQuery = "
        SELECT COUNT(*) as total
        FROM courses c
        WHERE $whereClause
    ";
    
    $countStmt = $db->prepare($countQuery);
    $countStmt->execute($countParams);
    $totalResults = $countStmt->fetch()['total'];
    
    // Build main query params in correct order
    $queryParams = [];
    
    // Add relevance params for SELECT (if search query)
    if (!empty($searchQuery)) {
        $queryParams[] = $searchQuery; // For SELECT relevance
    }
    
    // Add WHERE params
    if (!empty($searchQuery)) {
        $queryParams[] = $searchQuery; // For WHERE MATCH
    }
    if (!empty($category) && $category !== 'all') {
        $queryParams[] = $category;
    }
    if (!empty($level) && $level !== 'all') {
        $queryParams[] = $level;
    }
    
    // Get courses with enrollment count and average rating
    $query = "
        SELECT 
            $selectFields,
            COUNT(DISTINCT e.enrollment_id) as enrollment_count,
            COALESCE(AVG(COALESCE(r.rating, r.score)), 0) as average_rating,
            COUNT(DISTINCT r.id) as rating_count
        FROM courses c
        LEFT JOIN enrollments e ON c.course_id = e.course_id AND e.status = 'active'
        LEFT JOIN ratings r ON (c.course_id = r.course_id OR c.course_id = r.content_id)
        WHERE $whereClause
        GROUP BY c.course_id
    ";
    
    // Apply rating filter after aggregation
    if ($minRating !== null && $minRating > 0) {
        $query .= " HAVING average_rating >= ?";
        $queryParams[] = $minRating;
    }
    
    $query .= " ORDER BY $orderBy LIMIT ? OFFSET ?";
    $queryParams[] = $limit + 1; // Get one extra to check if there are more
    $queryParams[] = $offset;
    
    $stmt = $db->prepare($query);
    $stmt->execute($queryParams);
    $courses = $stmt->fetchAll();
    
    // Check if there are more results
    $hasMore = count($courses) > $limit;
    if ($hasMore) {
        array_pop($courses); // Remove the extra course
    }
    
    // Format courses
    $formattedCourses = array_map(function($course) {
        return [
            'courseId' => $course['course_id'],
            'title' => $course['title'],
            'description' => substr($course['description'] ?? '', 0, 150) . '...',
            'category' => $course['category'],
            'level' => ucfirst($course['level']),
            'duration' => $course['duration_weeks'] . ' weeks',
            'thumbnail' => $course['thumbnail'] ?? '/assets/images/default-course.jpg',
            'enrollmentCount' => intval($course['enrollment_count']),
            'averageRating' => round(floatval($course['average_rating']), 1),
            'ratingCount' => intval($course['rating_count']),
            'startDate' => $course['start_date'],
            'endDate' => $course['end_date'],
            'relevance' => isset($course['relevance']) ? floatval($course['relevance']) : 0
        ];
    }, $courses);
    
    // Calculate pagination info
    $totalPages = ceil($totalResults / $limit);
    
    sendJsonResponse(true, 'Search completed successfully.', [
        'courses' => $formattedCourses,
        'pagination' => [
            'currentPage' => $page,
            'totalPages' => $totalPages,
            'totalResults' => $totalResults,
            'hasMore' => $hasMore,
            'limit' => $limit
        ],
        'filters' => [
            'searchQuery' => $searchQuery,
            'category' => $category,
            'level' => $level,
            'minRating' => $minRating,
            'sortBy' => $sortBy
        ]
    ]);

} catch (Exception $e) {
    handleApiError($e, 'Failed to perform search. Please try again.');
}
?>

