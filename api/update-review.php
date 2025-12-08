<?php
/**
 * Update Review API
 * Updates review with Markdown support
 */

define('TSHAROK_INIT', true);
session_start();

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: PUT');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/rating-handler.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
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
    $rating = isset($data['rating']) ? intval($data['rating']) : null;
    $title = isset($data['title']) ? sanitizeInput($data['title']) : null;
    $comment = $data['comment'] ?? null; // Don't sanitize yet
    $wouldRecommend = isset($data['wouldRecommend']) ? (bool)$data['wouldRecommend'] : false;
    
    if (!$reviewId || !$courseId || !$rating || !$comment) {
        sendJsonResponse(false, 'Missing required fields');
    }
    
    $db = getDB();
    $ratingHandler = new RatingHandler($db, $userId);
    
    // Update rating
    $result = $ratingHandler->updateRating($reviewId, $courseId, $rating, $comment, $title, $wouldRecommend);
    
    if ($result['success']) {
        sendJsonResponse(true, $result['message']);
    } else {
        sendJsonResponse(false, $result['message']);
    }
    
} catch (Exception $e) {
    error_log("Update Review Error: " . $e->getMessage());
    sendJsonResponse(false, 'Failed to update review');
}

