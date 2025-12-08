<?php
/**
 * Get Ratings Statistics API
 * Returns average rating and distribution
 */

define('TSHAROK_INIT', true);
session_start();

ini_set('display_errors', 1);
error_reporting(E_ALL);

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
    $courseId = isset($_GET['courseId']) ? intval($_GET['courseId']) : null;
    
    if (!$courseId) {
        sendJsonResponse(false, 'Course ID is required');
    }
    
    $db = getDB();
    $userId = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
    $ratingHandler = new RatingHandler($db, $userId);
    
    // Get ratings statistics
    $result = $ratingHandler->getCourseRatingsStats($courseId);
    
    if ($result['success']) {
        sendJsonResponse(true, 'Ratings retrieved successfully', $result['data']);
    } else {
        sendJsonResponse(false, $result['message']);
    }
    
} catch (Exception $e) {
    error_log("Get Ratings API Error: " . $e->getMessage());
    sendJsonResponse(false, 'Failed to retrieve ratings');
}

