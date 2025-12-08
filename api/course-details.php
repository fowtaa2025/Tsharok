<?php
/**
 * Get Course Details API
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

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJsonResponse(false, 'Invalid request method.');
}

try {
    if (!isset($_GET['courseId']) || empty($_GET['courseId'])) {
        sendJsonResponse(false, 'Course ID is required.');
    }
    
    $courseId = intval($_GET['courseId']);
    $db = getDB();
    
    // Get course details
    $stmt = $db->prepare("
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
            u.email AS instructor_email,
            m.major_name,
            COUNT(DISTINCT e.enrollment_id) AS enrollment_count,
            AVG(r.rating) AS avg_rating,
            COUNT(DISTINCT r.rating_id) AS rating_count,
            COUNT(DISTINCT cnt.content_id) AS materials_count
        FROM courses c
        LEFT JOIN users u ON c.instructor_id = u.user_id
        LEFT JOIN majors m ON c.major_id = m.major_id
        LEFT JOIN enrollments e ON c.course_id = e.course_id AND e.status = 'active'
        LEFT JOIN ratings r ON c.course_id = r.course_id
        LEFT JOIN content cnt ON c.course_id = cnt.course_id
        WHERE c.course_id = ?
        GROUP BY c.course_id
        LIMIT 1
    ");
    
    $stmt->execute([$courseId]);
    $course = $stmt->fetch();
    
    if (!$course) {
        sendJsonResponse(false, 'Course not found.');
    }
    
    // Check if current user is enrolled
    $isEnrolled = false;
    $enrollmentId = null;
    
    if (isset($_SESSION['user_id'])) {
        $stmt = $db->prepare("
            SELECT enrollment_id, progress 
            FROM enrollments 
            WHERE user_id = ? AND course_id = ? AND status = 'active'
            LIMIT 1
        ");
        $stmt->execute([$_SESSION['user_id'], $courseId]);
        $enrollment = $stmt->fetch();
        
        if ($enrollment) {
            $isEnrolled = true;
            $enrollmentId = $enrollment['enrollment_id'];
            $progress = $enrollment['progress'];
        }
    }
    
    // Get course materials
    $stmt = $db->prepare("
        SELECT 
            content_id,
            title,
            type,
            file_path,
            file_size,
            uploaded_date
        FROM content
        WHERE course_id = ?
        ORDER BY uploaded_date DESC
        LIMIT 10
    ");
    $stmt->execute([$courseId]);
    $materials = $stmt->fetchAll();
    
    // Get recent ratings/reviews
    $stmt = $db->prepare("
        SELECT 
            r.rating_id,
            r.rating,
            r.review,
            r.created_at,
            u.first_name,
            u.last_name,
            u.profile_image
        FROM ratings r
        INNER JOIN users u ON r.user_id = u.user_id
        WHERE r.course_id = ?
        ORDER BY r.created_at DESC
        LIMIT 5
    ");
    $stmt->execute([$courseId]);
    $reviews = $stmt->fetchAll();
    
    // Format course data
    $formattedCourse = [
        'courseId' => $course['course_id'],
        'courseCode' => $course['course_code'],
        'courseName' => $course['course_name'],
        'description' => $course['description'],
        'instructorId' => $course['instructor_id'],
        'instructorName' => $course['instructor_first_name'] . ' ' . $course['instructor_last_name'],
        'instructorImage' => $course['instructor_image'],
        'instructorEmail' => $course['instructor_email'],
        'majorId' => $course['major_id'],
        'majorName' => $course['major_name'],
        'level' => $course['level'],
        'imageUrl' => $course['image_url'] ?? '/assets/images/course-placeholder.jpg',
        'enrollmentCount' => intval($course['enrollment_count']),
        'avgRating' => $course['avg_rating'] ? round(floatval($course['avg_rating']), 1) : 0,
        'ratingCount' => intval($course['rating_count']),
        'materialsCount' => intval($course['materials_count']),
        'createdAt' => $course['created_at'],
        'updatedAt' => $course['updated_at'],
        'isEnrolled' => $isEnrolled,
        'enrollmentId' => $enrollmentId,
        'progress' => isset($progress) ? floatval($progress) : 0,
        'materials' => array_map(function($material) {
            return [
                'contentId' => $material['content_id'],
                'title' => $material['title'],
                'type' => $material['type'],
                'filePath' => $material['file_path'],
                'fileSize' => $material['file_size'],
                'uploadedDate' => $material['uploaded_date']
            ];
        }, $materials),
        'reviews' => array_map(function($review) {
            return [
                'ratingId' => $review['rating_id'],
                'rating' => intval($review['rating']),
                'review' => $review['review'],
                'userName' => $review['first_name'] . ' ' . $review['last_name'],
                'userImage' => $review['profile_image'],
                'createdAt' => $review['created_at']
            ];
        }, $reviews)
    ];
    
    sendJsonResponse(true, 'Course details retrieved successfully.', [
        'course' => $formattedCourse
    ]);
    
} catch (Exception $e) {
    error_log("Course Details API Exception: " . $e->getMessage());
    sendJsonResponse(false, 'Failed to retrieve course details.');
}
?>
