<?php
/**
 * Get All Courses (Catalog) API
 * Tsharok LMS
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
    
    // Get filter parameters
    $search = isset($_GET['search']) ? sanitizeInput($_GET['search']) : '';
    $major = isset($_GET['major']) ? intval($_GET['major']) : 0;
    $level = isset($_GET['level']) ? intval($_GET['level']) : 0;
    $instructor = isset($_GET['instructor']) ? intval($_GET['instructor']) : 0;
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
    $offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;
    $sortBy = isset($_GET['sort']) ? $_GET['sort'] : 'created_at';
    $sortOrder = isset($_GET['order']) && strtoupper($_GET['order']) === 'ASC' ? 'ASC' : 'DESC';
    
    // Validate sort field
    $allowedSortFields = ['course_name', 'created_at', 'level', 'enrollment_count'];
    if (!in_array($sortBy, $allowedSortFields)) {
        $sortBy = 'created_at';
    }
    
    // Build query
    $query = "
        SELECT 
            c.course_id,
            c.course_code,
            c.course_name,
            c.description,
            c.instructor_id,
            c.major_id,
            c.level,
            c.image_url,
            c.created_at,
            c.updated_at,
            u.first_name AS instructor_first_name,
            u.last_name AS instructor_last_name,
            u.profile_image AS instructor_image,
            m.major_name,
            COUNT(DISTINCT e.enrollment_id) AS enrollment_count,
            AVG(r.rating) AS avg_rating,
            COUNT(DISTINCT r.rating_id) AS rating_count
        FROM courses c
        LEFT JOIN users u ON c.instructor_id = u.user_id
        LEFT JOIN majors m ON c.major_id = m.major_id
        LEFT JOIN enrollments e ON c.course_id = e.course_id
        LEFT JOIN ratings r ON c.course_id = r.course_id
        WHERE 1=1
    ";
    
    $params = [];
    
    // Add search filter
    if (!empty($search)) {
        $query .= " AND (c.course_name LIKE ? OR c.course_code LIKE ? OR c.description LIKE ?)";
        $searchParam = "%$search%";
        $params[] = $searchParam;
        $params[] = $searchParam;
        $params[] = $searchParam;
    }
    
    // Add major filter
    if ($major > 0) {
        $query .= " AND c.major_id = ?";
        $params[] = $major;
    }
    
    // Add level filter
    if ($level > 0) {
        $query .= " AND c.level = ?";
        $params[] = $level;
    }
    
    // Add instructor filter
    if ($instructor > 0) {
        $query .= " AND c.instructor_id = ?";
        $params[] = $instructor;
    }
    
    // Group by for aggregation
    $query .= " GROUP BY c.course_id";
    
    // Add sorting
    $query .= " ORDER BY $sortBy $sortOrder";
    
    // Add pagination
    $query .= " LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;
    
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $courses = $stmt->fetchAll();
    
    // Get total count for pagination
    $countQuery = "SELECT COUNT(DISTINCT c.course_id) as total FROM courses c WHERE 1=1";
    $countParams = [];
    
    if (!empty($search)) {
        $countQuery .= " AND (c.course_name LIKE ? OR c.course_code LIKE ? OR c.description LIKE ?)";
        $searchParam = "%$search%";
        $countParams[] = $searchParam;
        $countParams[] = $searchParam;
        $countParams[] = $searchParam;
    }
    
    if ($major > 0) {
        $countQuery .= " AND c.major_id = ?";
        $countParams[] = $major;
    }
    
    if ($level > 0) {
        $countQuery .= " AND c.level = ?";
        $countParams[] = $level;
    }
    
    if ($instructor > 0) {
        $countQuery .= " AND c.instructor_id = ?";
        $countParams[] = $instructor;
    }
    
    $countStmt = $db->prepare($countQuery);
    $countStmt->execute($countParams);
    $totalCount = $countStmt->fetch()['total'];
    
    // Format course data
    $formattedCourses = array_map(function($course) {
        return [
            'courseId' => $course['course_id'],
            'courseCode' => $course['course_code'],
            'courseName' => $course['course_name'],
            'description' => $course['description'],
            'instructorId' => $course['instructor_id'],
            'instructorName' => $course['instructor_first_name'] . ' ' . $course['instructor_last_name'],
            'instructorImage' => $course['instructor_image'],
            'majorId' => $course['major_id'],
            'majorName' => $course['major_name'],
            'level' => $course['level'],
            'imageUrl' => $course['image_url'] ?? '/assets/images/course-placeholder.jpg',
            'enrollmentCount' => intval($course['enrollment_count']),
            'avgRating' => $course['avg_rating'] ? round(floatval($course['avg_rating']), 1) : 0,
            'ratingCount' => intval($course['rating_count']),
            'createdAt' => $course['created_at'],
            'updatedAt' => $course['updated_at']
        ];
    }, $courses);
    
    sendJsonResponse(true, 'Courses retrieved successfully.', [
        'courses' => $formattedCourses,
        'pagination' => [
            'total' => intval($totalCount),
            'limit' => $limit,
            'offset' => $offset,
            'hasMore' => ($offset + $limit) < $totalCount
        ]
    ]);
    
} catch (Exception $e) {
    handleApiError($e, 'Failed to retrieve courses.');
}
?>
