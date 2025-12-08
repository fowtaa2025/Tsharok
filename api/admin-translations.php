<?php
/**
 * Admin Translation Management API
 * Manage translations and language files
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
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Include required files
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/session.php';
require_once __DIR__ . '/../includes/i18n.php';

// Check admin authentication
$db = getDB();
$sessionToken = $_SESSION['session_token'] ?? null;

if (!$sessionToken || !validateUserSession($sessionToken, $db)) {
    sendJsonResponse(false, 'Unauthorized. Please login.', null, 401);
}

if (!hasRole('admin', $db)) {
    sendJsonResponse(false, 'Access denied. Admin privileges required.', null, 403);
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            handleGet();
            break;
        
        case 'POST':
            handlePost();
            break;
        
        case 'PUT':
            handlePut();
            break;
        
        case 'DELETE':
            handleDelete();
            break;
        
        default:
            sendJsonResponse(false, 'Method not allowed');
    }
} catch (Exception $e) {
    error_log("Admin Translations Exception: " . $e->getMessage());
    sendJsonResponse(false, 'An error occurred: ' . $e->getMessage());
}

/**
 * Handle GET requests - Get translation info
 */
function handleGet() {
    $action = $_GET['action'] ?? 'list';
    
    switch ($action) {
        case 'list':
            // List all translation files
            $translations = [];
            $languages = ['en', 'ar'];
            $namespaces = ['common', 'auth', 'courses', 'admin'];
            
            foreach ($languages as $lang) {
                foreach ($namespaces as $namespace) {
                    $filePath = LANG_DIR . "{$lang}/{$namespace}.json";
                    if (file_exists($filePath)) {
                        $content = json_decode(file_get_contents($filePath), true);
                        $translations[] = [
                            'language' => $lang,
                            'namespace' => $namespace,
                            'file' => "{$lang}/{$namespace}.json",
                            'keys' => countKeys($content),
                            'size' => filesize($filePath),
                            'modified' => filemtime($filePath)
                        ];
                    }
                }
            }
            
            sendJsonResponse(true, 'Translation files retrieved', [
                'translations' => $translations,
                'languages' => getAvailableLanguages(),
                'namespaces' => $namespaces
            ]);
            break;
        
        case 'get':
            // Get specific translation file
            $language = $_GET['language'] ?? 'en';
            $namespace = $_GET['namespace'] ?? 'common';
            
            $translations = loadTranslations($language, $namespace);
            
            sendJsonResponse(true, 'Translations retrieved', [
                'language' => $language,
                'namespace' => $namespace,
                'translations' => $translations
            ]);
            break;
        
        case 'missing':
            // Find missing translations
            $missing = findMissingTranslations();
            sendJsonResponse(true, 'Missing translations found', [
                'missing' => $missing
            ]);
            break;
        
        default:
            sendJsonResponse(false, 'Invalid action');
    }
}

/**
 * Handle POST requests - Add new translations
 */
function handlePost() {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        sendJsonResponse(false, 'No data received');
    }
    
    $language = $data['language'] ?? null;
    $namespace = $data['namespace'] ?? null;
    $key = $data['key'] ?? null;
    $value = $data['value'] ?? null;
    
    if (!$language || !$namespace || !$key || !$value) {
        sendJsonResponse(false, 'Missing required fields');
    }
    
    // Load existing translations
    $translations = loadTranslations($language, $namespace);
    
    // Add new key-value
    $keys = explode('.', $key);
    $current = &$translations;
    
    foreach ($keys as $k) {
        if (!isset($current[$k])) {
            $current[$k] = [];
        }
        $current = &$current[$k];
    }
    
    $current = $value;
    
    // Save translations
    $filePath = LANG_DIR . "{$language}/{$namespace}.json";
    $json = json_encode($translations, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    
    if (file_put_contents($filePath, $json)) {
        sendJsonResponse(true, 'Translation added successfully');
    } else {
        sendJsonResponse(false, 'Failed to save translation');
    }
}

/**
 * Handle PUT requests - Update translations
 */
function handlePut() {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        sendJsonResponse(false, 'No data received');
    }
    
    $language = $data['language'] ?? null;
    $namespace = $data['namespace'] ?? null;
    $translations = $data['translations'] ?? null;
    
    if (!$language || !$namespace || !$translations) {
        sendJsonResponse(false, 'Missing required fields');
    }
    
    // Save translations
    $filePath = LANG_DIR . "{$language}/{$namespace}.json";
    
    // Create backup
    if (file_exists($filePath)) {
        $backupPath = LANG_DIR . "backups/{$language}_{$namespace}_" . date('Y-m-d_His') . ".json";
        $backupDir = dirname($backupPath);
        if (!file_exists($backupDir)) {
            mkdir($backupDir, 0755, true);
        }
        copy($filePath, $backupPath);
    }
    
    $json = json_encode($translations, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    
    if (file_put_contents($filePath, $json)) {
        sendJsonResponse(true, 'Translations updated successfully');
    } else {
        sendJsonResponse(false, 'Failed to update translations');
    }
}

/**
 * Handle DELETE requests - Delete translation key
 */
function handleDelete() {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        sendJsonResponse(false, 'No data received');
    }
    
    $language = $data['language'] ?? null;
    $namespace = $data['namespace'] ?? null;
    $key = $data['key'] ?? null;
    
    if (!$language || !$namespace || !$key) {
        sendJsonResponse(false, 'Missing required fields');
    }
    
    // Load existing translations
    $translations = loadTranslations($language, $namespace);
    
    // Delete key
    $keys = explode('.', $key);
    $current = &$translations;
    $last = array_pop($keys);
    
    foreach ($keys as $k) {
        if (!isset($current[$k])) {
            sendJsonResponse(false, 'Key not found');
        }
        $current = &$current[$k];
    }
    
    if (isset($current[$last])) {
        unset($current[$last]);
        
        // Save translations
        $filePath = LANG_DIR . "{$language}/{$namespace}.json";
        $json = json_encode($translations, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        
        if (file_put_contents($filePath, $json)) {
            sendJsonResponse(true, 'Translation deleted successfully');
        } else {
            sendJsonResponse(false, 'Failed to delete translation');
        }
    } else {
        sendJsonResponse(false, 'Key not found');
    }
}

/**
 * Count translation keys
 */
function countKeys($array, $count = 0) {
    foreach ($array as $value) {
        if (is_array($value)) {
            $count = countKeys($value, $count);
        } else {
            $count++;
        }
    }
    return $count;
}

/**
 * Find missing translations between languages
 */
function findMissingTranslations() {
    $missing = [];
    $namespaces = ['common', 'auth', 'courses', 'admin'];
    $languages = ['en', 'ar'];
    
    foreach ($namespaces as $namespace) {
        $enTranslations = loadTranslations('en', $namespace);
        $arTranslations = loadTranslations('ar', $namespace);
        
        // Find keys in EN but not in AR
        $missingInAr = findMissingKeys($enTranslations, $arTranslations);
        if (!empty($missingInAr)) {
            $missing[] = [
                'namespace' => $namespace,
                'language' => 'ar',
                'missingKeys' => $missingInAr
            ];
        }
        
        // Find keys in AR but not in EN
        $missingInEn = findMissingKeys($arTranslations, $enTranslations);
        if (!empty($missingInEn)) {
            $missing[] = [
                'namespace' => $namespace,
                'language' => 'en',
                'missingKeys' => $missingInEn
            ];
        }
    }
    
    return $missing;
}

/**
 * Find missing keys recursively
 */
function findMissingKeys($source, $target, $prefix = '') {
    $missing = [];
    
    foreach ($source as $key => $value) {
        $fullKey = $prefix ? $prefix . '.' . $key : $key;
        
        if (!isset($target[$key])) {
            $missing[] = $fullKey;
        } elseif (is_array($value)) {
            $nestedMissing = findMissingKeys($value, $target[$key], $fullKey);
            $missing = array_merge($missing, $nestedMissing);
        }
    }
    
    return $missing;
}
?>

