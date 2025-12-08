<?php
/**
 * Get Filter Options API
 * Returns available categories, levels, semesters for filtering
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
    $db = getDB();
    $searchHelper = new SearchHelper($db);
    
    $options = $searchHelper->getFilterOptions();
    
    sendJsonResponse(true, 'Filter options retrieved successfully.', $options);

} catch (Exception $e) {
    error_log("Filter Options Error: " . $e->getMessage());
    sendJsonResponse(false, 'Failed to get filter options.');
}
?>

