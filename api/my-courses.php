<?php
/**
 * Get User's Enrolled Courses API
 * Tsharok LMS
 */

define('TSHAROK_INIT', true);

session_start();

ini_set('display_errors', 0);
error_reporting(E_ALL);

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/session.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJsonResponse(false, 'Invalid request method.');
}

// Check authentication
if (!isset($_SESSION['user_id'])) {
    sendJsonResponse(false, 'Authentication required. Please login.');
}

try {
    $userId = $_SESSION['user_id'];
    $status = isset($_GET['status']) ? sanitizeInput($_GET['status']) : 'active';
    
    $db = getDB();
    
    // Get enrolled courses
    $stmt = $db->prepare("
        SELECT 
            e.enrollment_id,
            e.course_id,
            e.enrollment_date,
            e.status,
            e.progress,
            c.course_code,
            c.course_name,
            c.description,
            c.instructor_id,
            c.major_id,
            c.level,
            c.image_url,
            u.first_name AS instructor_first_name,
            u.last_name AS instructor_last_name,
            u.profile_image AS instructor_image,
            m.major_name,
            COUNT(DISTINCT cnt.content_id) AS total_materials,
            COUNT(DISTINCT e2.enrollment_id) AS total_students,
            AVG(r.rating) AS avg_rating
        FROM enrollments e
        INNER JOIN courses c ON e.course_id = c.course_id
        LEFT JOIN users u ON c.instructor_id = u.user_id
        LEFT JOIN majors m ON c.major_id = m.major_id
        LEFT JOIN content cnt ON c.course_id = cnt.course_id
        LEFT JOIN enrollments e2 ON c.course_id = e2.course_id
        LEFT JOIN ratings r ON c.course_id = r.course_id
        WHERE e.user_id = ? AND e.status = ?
        GROUP BY e.enrollment_id
        ORDER BY e.enrollment_date DESC
    ");
    
    $stmt->execute([$userId, $status]);
    $enrollments = $stmt->fetchAll();
    
    // Format enrollment data
    $formattedEnrollments = array_map(function($enrollment) {
        return [
            'enrollmentId' => $enrollment['enrollment_id'],
            'courseId' => $enrollment['course_id'],
            'courseCode' => $enrollment['course_code'],
            'courseName' => $enrollment['course_name'],
            'description' => $enrollment['description'],
            'instructorId' => $enrollment['instructor_id'],
            'instructorName' => $enrollment['instructor_first_name'] . ' ' . $enrollment['instructor_last_name'],
            'instructorImage' => $enrollment['instructor_image'],
            'majorId' => $enrollment['major_id'],
            'majorName' => $enrollment['major_name'],
            'level' => $enrollment['level'],
            'imageUrl' => $enrollment['image_url'] ?? '/assets/images/course-placeholder.jpg',
            'enrollmentDate' => $enrollment['enrollment_date'],
            'status' => $enrollment['status'],
            'progress' => floatval($enrollment['progress']),
            'totalMaterials' => intval($enrollment['total_materials']),
            'totalStudents' => intval($enrollment['total_students']),
            'avgRating' => $enrollment['avg_rating'] ? round(floatval($enrollment['avg_rating']), 1) : 0
        ];
    }, $enrollments);
    
    sendJsonResponse(true, 'Enrolled courses retrieved successfully.', [
        'courses' => $formattedEnrollments,
        'totalCount' => count($formattedEnrollments)
    ]);
    
} catch (Exception $e) {
    error_log("My Courses API Exception: " . $e->getMessage());
    sendJsonResponse(false, 'Failed to retrieve enrolled courses.');
}
?>
