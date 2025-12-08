<?php
/**
 * Course Unenrollment API
 * Tsharok LMS
 */

define('TSHAROK_INIT', true);

session_start();

ini_set('display_errors', 0);
error_reporting(E_ALL);

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/session.php';

if (!in_array($_SERVER['REQUEST_METHOD'], ['POST', 'DELETE'])) {
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
    
    // Check if enrollment exists
    $stmt = $db->prepare("
        SELECT e.enrollment_id, c.course_name
        FROM enrollments e
        INNER JOIN courses c ON e.course_id = c.course_id
        WHERE e.user_id = ? AND e.course_id = ?
        LIMIT 1
    ");
    $stmt->execute([$userId, $courseId]);
    $enrollment = $stmt->fetch();
    
    if (!$enrollment) {
        sendJsonResponse(false, 'You are not enrolled in this course.');
    }
    
    // Start transaction
    $db->beginTransaction();
    
    try {
        // Soft delete or hard delete based on preference
        // Using status update (soft delete) for data integrity
        $stmt = $db->prepare("
            UPDATE enrollments 
            SET status = 'dropped', updated_at = NOW()
            WHERE enrollment_id = ?
        ");
        $stmt->execute([$enrollment['enrollment_id']]);
        
        // Alternatively, for hard delete:
        // $stmt = $db->prepare("DELETE FROM enrollments WHERE enrollment_id = ?");
        // $stmt->execute([$enrollment['enrollment_id']]);
        
        // Log activity
        logActivity(
            $userId, 
            'course_unenrollment', 
            "Unenrolled from course: {$enrollment['course_name']} (ID: $courseId)", 
            $db
        );
        
        $db->commit();
        
        sendJsonResponse(true, 'Successfully unenrolled from the course.', [
            'courseId' => $courseId,
            'courseName' => $enrollment['course_name']
        ]);
        
    } catch (PDOException $e) {
        $db->rollBack();
        error_log("Unenrollment Error: " . $e->getMessage());
        sendJsonResponse(false, 'Failed to unenroll from course. Please try again.');
    }
    
} catch (Exception $e) {
    error_log("Unenroll API Exception: " . $e->getMessage());
    sendJsonResponse(false, 'An unexpected error occurred.');
}
?>
