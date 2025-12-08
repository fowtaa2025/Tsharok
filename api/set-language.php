<?php
/**
 * Set Language API
 * Sets user's preferred language
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
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Include required files
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/i18n.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(false, 'Invalid request method. Only POST allowed.');
}

try {
    // Get POST data
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data || !isset($data['language'])) {
        sendJsonResponse(false, 'Language code is required.');
    }
    
    $language = $data['language'];
    
    // Validate language
    if (!in_array($language, SUPPORTED_LANGUAGES)) {
        sendJsonResponse(false, 'Invalid language code. Supported languages: ' . implode(', ', SUPPORTED_LANGUAGES));
    }
    
    // Get database connection
    $db = getDB();
    
    // Set language
    $success = setUserLanguage($language, $db);
    
    if ($success) {
        $languageInfo = getAvailableLanguages()[$language] ?? null;
        
        sendJsonResponse(true, 'Language preference updated successfully', [
            'language' => $language,
            'languageInfo' => $languageInfo
        ]);
    } else {
        sendJsonResponse(false, 'Failed to update language preference.');
    }
    
} catch (Exception $e) {
    error_log("Set Language Exception: " . $e->getMessage());
    sendJsonResponse(false, 'An error occurred while updating language preference.');
}
?>

