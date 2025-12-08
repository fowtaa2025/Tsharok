<?php
/**
 * Get Single Review API
 */

define('TSHAROK_INIT', true);
session_start();

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/rating-handler.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJsonResponse(false, 'Invalid request method');
}

try {
    if (!isset($_SESSION['user_id'])) {
        sendJsonResponse(false, 'Authentication required');
    }
    
    $userId = $_SESSION['user_id'];
    $reviewId = isset($_GET['id']) ? intval($_GET['id']) : null;
    
    if (!$reviewId) {
        sendJsonResponse(false, 'Review ID is required');
    }
    
    $db = getDB();
    $ratingHandler = new RatingHandler($db, $userId);
    
    // Get review
    $result = $ratingHandler->getReview($reviewId);
    
    if ($result['success']) {
        sendJsonResponse(true, $result['message'], $result['data']);
    } else {
        sendJsonResponse(false, $result['message']);
    }
    
} catch (Exception $e) {
    error_log("Get Review Error: " . $e->getMessage());
    sendJsonResponse(false, 'Failed to retrieve review');
}

