<?php
/**
 * Delete Review API
 */

define('TSHAROK_INIT', true);
session_start();

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: DELETE');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/rating-handler.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    sendJsonResponse(false, 'Invalid request method');
}

try {
    if (!isset($_SESSION['user_id'])) {
        sendJsonResponse(false, 'Authentication required');
    }
    
    $userId = $_SESSION['user_id'];
    $data = json_decode(file_get_contents('php://input'), true);
    
    $reviewId = isset($data['reviewId']) ? intval($data['reviewId']) : null;
    $courseId = isset($data['courseId']) ? intval($data['courseId']) : null;
    
    if (!$reviewId || !$courseId) {
        sendJsonResponse(false, 'Review ID and Course ID are required');
    }
    
    $db = getDB();
    $ratingHandler = new RatingHandler($db, $userId);
    
    // Delete rating
    $result = $ratingHandler->deleteRating($reviewId, $courseId);
    
    if ($result['success']) {
        sendJsonResponse(true, $result['message']);
    } else {
        sendJsonResponse(false, $result['message']);
    }
    
} catch (Exception $e) {
    error_log("Delete Review Error: " . $e->getMessage());
    sendJsonResponse(false, 'Failed to delete review');
}

