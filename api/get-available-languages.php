<?php
/**
 * Get Available Languages API
 * Returns list of supported languages with metadata
 * Tsharok LMS
 */

// Define initialization constant
define('TSHAROK_INIT', true);

// Start session
session_start();

// Error reporting
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Set headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Include required files
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/i18n.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJsonResponse(false, 'Invalid request method. Only GET allowed.');
}

try {
    // Get database connection
    $db = getDB();
    
    // Get current user language
    $currentLanguage = getUserLanguage($db);
    
    // Get available languages
    $languages = getAvailableLanguages();
    
    // Format response
    $languageList = array_values($languages);
    
    sendJsonResponse(true, 'Available languages retrieved successfully', [
        'languages' => $languageList,
        'currentLanguage' => $currentLanguage,
        'defaultLanguage' => DEFAULT_LANGUAGE,
        'supportedLanguages' => SUPPORTED_LANGUAGES
    ]);
    
} catch (Exception $e) {
    error_log("Get Available Languages Exception: " . $e->getMessage());
    sendJsonResponse(false, 'An error occurred while retrieving languages.');
}
?>

