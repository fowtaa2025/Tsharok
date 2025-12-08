<?php
/**
 * Get Comments/Reviews API
 * Returns paginated reviews with filtering, sorting, and Markdown rendering
 */

define('TSHAROK_INIT', true);
session_start();

// Load configurations
require_once __DIR__ . '/../config/app.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/rating-handler.php';
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/error-handler.php';

// Initialize API response with CORS and headers
initializeApiResponse();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJsonResponse(false, 'Invalid request method');
}

try {
    $courseId = isset($_GET['courseId']) ? intval($_GET['courseId']) : null;
    $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
    $filter = isset($_GET['filter']) ? $_GET['filter'] : 'all';
    $sort = isset($_GET['sort']) ? $_GET['sort'] : 'recent';
    
    if (!$courseId) {
        sendJsonResponse(false, 'Course ID is required');
    }
    
    $db = getDB();
    $userId = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
    $ratingHandler = new RatingHandler($db, $userId);
    
    // Get reviews with Markdown rendering
    $result = $ratingHandler->getReviews($courseId, $page, $limit, $filter, $sort);
    
    if ($result['success']) {
        sendJsonResponse(true, 'Reviews retrieved successfully', $result['data']);
    } else {
        sendJsonResponse(false, $result['message']);
    }
    
} catch (Exception $e) {
    handleApiError($e, 'Failed to retrieve reviews');
}
?>
