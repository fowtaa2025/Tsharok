<?php
/**
 * Course Enrollment API
 * Tsharok LMS
 */

define('TSHAROK_INIT', true);

session_start();

ini_set('display_errors', 0);
error_reporting(E_ALL);

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/session.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(false, 'Invalid request method.');
}

// Check authentication
if (!isset($_SESSION['user_id'])) {
    sendJsonResponse(false, 'Authentication required. Please login.');
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['courseId']) || empty($data['courseId'])) {
        sendJsonResponse(false, 'Course ID is required.');
    }
    
    $userId = $_SESSION['user_id'];
    $courseId = intval($data['courseId']);
    
    $db = getDB();
    
    // Check if course exists
    $stmt = $db->prepare("
        SELECT course_id, course_name, instructor_id 
        FROM courses 
        WHERE course_id = ?
        LIMIT 1
    ");
    $stmt->execute([$courseId]);
    $course = $stmt->fetch();
    
    if (!$course) {
        sendJsonResponse(false, 'Course not found.');
    }
    
    // Check if user is the instructor (instructors cannot enroll in their own courses)
    if ($course['instructor_id'] == $userId) {
        sendJsonResponse(false, 'Instructors cannot enroll in their own courses.');
    }
    
    // Check if already enrolled
    $stmt = $db->prepare("
        SELECT enrollment_id 
        FROM enrollments 
        WHERE user_id = ? AND course_id = ?
        LIMIT 1
    ");
    $stmt->execute([$userId, $courseId]);
    $existingEnrollment = $stmt->fetch();
    
    if ($existingEnrollment) {
        sendJsonResponse(false, 'You are already enrolled in this course.');
    }
    
    // Start transaction
    $db->beginTransaction();
    
    try {
        // Create enrollment
        $stmt = $db->prepare("
            INSERT INTO enrollments (user_id, course_id, enrollment_date, status)
            VALUES (?, ?, NOW(), 'active')
        ");
        $stmt->execute([$userId, $courseId]);
        
        $enrollmentId = $db->lastInsertId();
        
        // Log activity
        logActivity(
            $userId, 
            'course_enrollment', 
            "Enrolled in course: {$course['course_name']} (ID: $courseId)", 
            $db
        );
        
        $db->commit();
        
        sendJsonResponse(true, 'Successfully enrolled in the course!', [
            'enrollmentId' => $enrollmentId,
            'courseId' => $courseId,
            'courseName' => $course['course_name']
        ]);
        
    } catch (PDOException $e) {
        $db->rollBack();
        error_log("Enrollment Error: " . $e->getMessage());
        sendJsonResponse(false, 'Failed to enroll in course. Please try again.');
    }
    
} catch (Exception $e) {
    error_log("Enroll API Exception: " . $e->getMessage());
    sendJsonResponse(false, 'An unexpected error occurred.');
}
?>
