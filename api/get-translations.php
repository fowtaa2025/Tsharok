<?php
/**
 * Get Translations API
 * Retrieves translations for specified namespace and language
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
header('Access-Control-Allow-Methods: GET, POST');
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
    // Get parameters
    $language = $_GET['lang'] ?? $_GET['language'] ?? null;
    $namespace = $_GET['namespace'] ?? 'common';
    
    // Get database connection
    $db = getDB();
    
    // Get user's preferred language if not specified
    if (!$language) {
        $language = getUserLanguage($db);
    }
    
    // Validate language
    if (!in_array($language, SUPPORTED_LANGUAGES)) {
        $language = DEFAULT_LANGUAGE;
    }
    
    // Validate namespace
    $allowedNamespaces = ['common', 'auth', 'courses', 'admin'];
    if (!in_array($namespace, $allowedNamespaces)) {
        sendJsonResponse(false, 'Invalid namespace specified.');
    }
    
    // Load translations
    $translations = getAllTranslations($namespace, $language);
    
    if (empty($translations)) {
        sendJsonResponse(false, 'Translations not found for specified namespace.');
    }
    
    // Get language metadata
    $languageInfo = getAvailableLanguages()[$language] ?? null;
    
    sendJsonResponse(true, 'Translations retrieved successfully', [
        'translations' => $translations,
        'language' => $language,
        'namespace' => $namespace,
        'languageInfo' => $languageInfo
    ]);
    
} catch (Exception $e) {
    error_log("Get Translations Exception: " . $e->getMessage());
    sendJsonResponse(false, 'An error occurred while retrieving translations.');
}
?>

