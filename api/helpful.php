<?php
/**
 * Mark Review as Helpful API
 */

define('TSHAROK_INIT', true);
session_start();

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/rating-handler.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(false, 'Invalid request method');
}

try {
    if (!isset($_SESSION['user_id'])) {
        sendJsonResponse(false, 'Authentication required');
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    $reviewId = isset($data['reviewId']) ? intval($data['reviewId']) : null;
    
    if (!$reviewId) {
        sendJsonResponse(false, 'Review ID is required');
    }
    
    $db = getDB();
    $userId = $_SESSION['user_id'];
    $ratingHandler = new RatingHandler($db, $userId);
    
    // Mark as helpful
    $result = $ratingHandler->markAsHelpful($reviewId);
    
    if ($result['success']) {
        sendJsonResponse(true, $result['message']);
    } else {
        sendJsonResponse(false, $result['message']);
    }
    
} catch (Exception $e) {
    error_log("Helpful Error: " . $e->getMessage());
    sendJsonResponse(false, 'Failed to mark as helpful');
}

