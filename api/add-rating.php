<?php
/**
 * Add Rating and Review API
 * Allows users to rate and review courses with Markdown support
 */

define('TSHAROK_INIT', true);
session_start();

ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/rating-handler.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(false, 'Invalid request method');
}

try {
    // Check authentication
    if (!isset($_SESSION['user_id'])) {
        sendJsonResponse(false, 'Authentication required');
    }
    
    $userId = $_SESSION['user_id'];
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    if (!isset($data['courseId']) || !isset($data['rating']) || !isset($data['comment'])) {
        sendJsonResponse(false, 'Missing required fields');
    }
    
    $courseId = intval($data['courseId']);
    $rating = intval($data['rating']);
    $title = isset($data['title']) ? sanitizeInput($data['title']) : null;
    $comment = $data['comment']; // Don't sanitize yet - will be done in handler
    $wouldRecommend = isset($data['wouldRecommend']) ? (bool)$data['wouldRecommend'] : false;
    
    $db = getDB();
    $ratingHandler = new RatingHandler($db, $userId);
    
    // Add rating
    $result = $ratingHandler->addRating($courseId, $rating, $comment, $title, $wouldRecommend);
    
    if ($result['success']) {
        sendJsonResponse(true, $result['message'], $result['data']);
    } else {
        sendJsonResponse(false, $result['message']);
    }
    
} catch (Exception $e) {
    error_log("Add Rating API Error: " . $e->getMessage());
    sendJsonResponse(false, 'An unexpected error occurred');
}

