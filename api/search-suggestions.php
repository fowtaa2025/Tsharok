<?php
/**
 * Search Suggestions API (Autocomplete)
 * Tsharok LMS
 */

define('TSHAROK_INIT', true);
session_start();

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/search-helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJsonResponse(false, 'Invalid request method.');
}

try {
    $query = isset($_GET['q']) ? trim($_GET['q']) : '';
    $limit = isset($_GET['limit']) ? min(20, max(1, intval($_GET['limit']))) : 10;
    
    if (strlen($query) < 2) {
        sendJsonResponse(true, 'Query too short.', ['suggestions' => []]);
    }
    
    $db = getDB();
    $searchHelper = new SearchHelper($db);
    
    $suggestions = $searchHelper->getSearchSuggestions($query, $limit);
    
    sendJsonResponse(true, 'Suggestions retrieved successfully.', [
        'suggestions' => $suggestions,
        'query' => $query
    ]);

} catch (Exception $e) {
    error_log("Search Suggestions Error: " . $e->getMessage());
    sendJsonResponse(false, 'Failed to get suggestions.');
}
?>

