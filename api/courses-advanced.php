<?php
/**
 * Advanced Courses API with Filtering and Sorting
 * Tsharok LMS
 */

define('TSHAROK_INIT', true);
session_start();

ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/security.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJsonResponse(false, 'Invalid request method.');
}

try {
    $db = getDB();
    
    // Get filter parameters (using security functions)
    $category = isset($_GET['category']) ? sanitizeInput($_GET['category']) : '';
    $level = isset($_GET['level']) ? validateEnum($_GET['level'], ['beginner', 'intermediate', 'advanced', 'all'], 'all') : 'all';
    $minRating = validateFloat($_GET['minRating'] ?? 0, 0, 5, 0);
    $maxRating = validateFloat($_GET['maxRating'] ?? 5, 0, 5, 5);
    $published = isset($_GET['published']) ? boolval($_GET['published']) : true;
    
    // Sorting parameters (whitelist validation)
    $allowedSortFields = ['newest', 'oldest', 'title_asc', 'title_desc', 'rating_high', 'rating_low', 'popular', 'duration_short', 'duration_long'];
    $sortBy = validateEnum($_GET['sortBy'] ?? 'newest', $allowedSortFields, 'newest');
    
    // Pagination (using security function)
    $pagination = validatePagination($_GET['page'] ?? 1, $_GET['limit'] ?? 12, 50);
    $page = $pagination['page'];
    $limit = $pagination['limit'];
    $offset = $pagination['offset'];
    
    // Build WHERE conditions
    $whereConditions = [];
    $params = [];
    
    // Published filter
    if ($published) {
        $whereConditions[] = 'c.is_published = 1';
    }
    
    // Category filter
    if (!empty($category) && $category !== 'all') {
        $whereConditions[] = 'c.category = ?';
        $params[] = $category;
    }
    
    // Level filter
    if (!empty($level) && $level !== 'all') {
        $whereConditions[] = 'c.level = ?';
        $params[] = $level;
    }
    
    $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
    
    // Determine sort order
    $orderByClause = '';
    switch ($sortBy) {
        case 'newest':
            $orderByClause = 'c.created_at DESC';
            break;
        case 'oldest':
            $orderByClause = 'c.created_at ASC';
            break;
        case 'title_asc':
            $orderByClause = 'c.title ASC';
            break;
        case 'title_desc':
            $orderByClause = 'c.title DESC';
            break;
        case 'rating_high':
            $orderByClause = 'average_rating DESC, c.created_at DESC';
            break;
        case 'rating_low':
            $orderByClause = 'average_rating ASC, c.created_at DESC';
            break;
        case 'popular':
            $orderByClause = 'enrollment_count DESC, c.created_at DESC';
            break;
        case 'duration_short':
            $orderByClause = 'c.duration_weeks ASC, c.created_at DESC';
            break;
        case 'duration_long':
            $orderByClause = 'c.duration_weeks DESC, c.created_at DESC';
            break;
        default:
            $orderByClause = 'c.created_at DESC';
    }
    
    // Get total count
    $countQuery = "
        SELECT COUNT(DISTINCT c.course_id) as total
        FROM courses c
        $whereClause
    ";
    
    $countStmt = $db->prepare($countQuery);
    $countStmt->execute($params);
    $totalResults = $countStmt->fetch()['total'];
    
    // Main query with aggregations
    $query = "
        SELECT 
            c.course_id,
            c.course_code,
            c.title,
            c.description,
            c.category,
            c.level,
            c.duration_weeks,
            c.max_students,
            c.thumbnail,
            c.start_date,
            c.end_date,
            c.semester,
            c.created_at,
            c.updated_at,
            COUNT(DISTINCT e.enrollment_id) as enrollment_count,
            COALESCE(AVG(COALESCE(r.rating, r.score)), 0) as average_rating,
            COUNT(DISTINCT r.id) as rating_count
        FROM courses c
        LEFT JOIN enrollments e ON c.course_id = e.course_id AND e.status = 'active'
        LEFT JOIN ratings r ON (c.course_id = r.course_id OR c.course_id = r.content_id)
        $whereClause
        GROUP BY c.course_id
    ";
    
    // Apply rating filter (after aggregation) - SECURE: Use prepared statement parameters
    $havingParts = [];
    if ($minRating > 0) {
        $havingParts[] = 'average_rating >= ?';
        $params[] = $minRating;
    }
    if ($maxRating < 5) {
        $havingParts[] = 'average_rating <= ?';
        $params[] = $maxRating;
    }
    
    if (!empty($havingParts)) {
        $query .= ' HAVING ' . implode(' AND ', $havingParts);
    }
    
    // Add sorting and pagination
    $query .= " ORDER BY $orderByClause LIMIT ? OFFSET ?";
    $params[] = $limit + 1; // Get one extra to check for more
    $params[] = $offset;
    
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $courses = $stmt->fetchAll();
    
    // Check if there are more results
    $hasMore = count($courses) > $limit;
    if ($hasMore) {
        array_pop($courses);
    }
    
    // Format courses
    $formattedCourses = array_map(function($course) {
        return [
            'courseId' => $course['course_id'],
            'courseCode' => $course['course_code'],
            'title' => $course['title'],
            'description' => substr($course['description'] ?? '', 0, 200) . '...',
            'category' => $course['category'] ?? 'General',
            'level' => ucfirst($course['level']),
            'duration' => $course['duration_weeks'] ? $course['duration_weeks'] . ' weeks' : 'N/A',
            'maxStudents' => intval($course['max_students']),
            'thumbnail' => $course['thumbnail'] ?? '/assets/images/default-course.jpg',
            'enrollmentCount' => intval($course['enrollment_count']),
            'averageRating' => round(floatval($course['average_rating']), 1),
            'ratingCount' => intval($course['rating_count']),
            'startDate' => $course['start_date'],
            'endDate' => $course['end_date'],
            'semester' => $course['semester'],
            'createdAt' => $course['created_at']
        ];
    }, $courses);
    
    // Get available categories and levels for filters
    $categoriesStmt = $db->query("SELECT DISTINCT category FROM courses WHERE category IS NOT NULL ORDER BY category");
    $categories = $categoriesStmt->fetchAll(PDO::FETCH_COLUMN);
    
    $levelsStmt = $db->query("SELECT DISTINCT level FROM courses ORDER BY FIELD(level, 'beginner', 'intermediate', 'advanced')");
    $levels = $levelsStmt->fetchAll(PDO::FETCH_COLUMN);
    
    // Calculate pagination
    $totalPages = ceil($totalResults / $limit);
    
    sendJsonResponse(true, 'Courses retrieved successfully.', [
        'courses' => $formattedCourses,
        'pagination' => [
            'currentPage' => $page,
            'totalPages' => $totalPages,
            'totalResults' => $totalResults,
            'hasMore' => $hasMore,
            'limit' => $limit
        ],
        'filters' => [
            'availableCategories' => $categories,
            'availableLevels' => $levels,
            'applied' => [
                'category' => $category,
                'level' => $level,
                'minRating' => $minRating,
                'maxRating' => $maxRating,
                'sortBy' => $sortBy
            ]
        ]
    ]);

} catch (Exception $e) {
    error_log("Courses Advanced API Error: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    sendJsonResponse(false, 'Failed to retrieve courses: ' . $e->getMessage());
}
?>

