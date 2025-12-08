<?php
/**
 * Check Authentication Status API
 * Tsharok LMS
 */

// Define initialization constant
define('TSHAROK_INIT', true);

// Error reporting (set BEFORE session_start)
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Set headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Start session (AFTER ini_set)
session_start();

// Include required files
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/session.php';
require_once __DIR__ . '/../includes/i18n.php';

try {
    // Check if session exists
    if (!isset($_SESSION['user_id'])) {
        sendJsonResponse(false, 'Not authenticated.', ['authenticated' => false]);
    }
    
    $db = getDB();
    
    // Validate session
    $isValid = validateUserSession($_SESSION['session_token'], $db);
    
    if (!$isValid) {
        session_unset();
        session_destroy();
        sendJsonResponse(false, 'Session expired.', ['authenticated' => false]);
    }
    
    // Get user data
    $stmt = $db->prepare("
        SELECT 
            user_id, 
            username, 
            email, 
            first_name, 
            last_name, 
            role, 
            profile_image,
            major_id
        FROM users
        WHERE user_id = ? AND is_active = 1
        LIMIT 1
    ");
    
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch();
    
    if (!$user) {
        session_unset();
        session_destroy();
        sendJsonResponse(false, 'User not found.', ['authenticated' => false]);
    }
    
    // Get user's preferred language from session or default
    $userLanguage = $_SESSION['language'] ?? 'en';
    
    $userData = [
        'userId' => $user['user_id'],
        'username' => $user['username'],
        'email' => $user['email'],
        'firstName' => $user['first_name'],
        'lastName' => $user['last_name'],
        'fullName' => $user['first_name'] . ' ' . $user['last_name'],
        'role' => $user['role'],
        'majorId' => $user['major_id'],
        'profileImage' => $user['profile_image'],
        'language' => $userLanguage,
        'direction' => ($userLanguage === 'ar') ? 'rtl' : 'ltr'
    ];
    
    sendJsonResponse(true, 'Authenticated.', [
        'authenticated' => true,
        'user' => $userData
    ]);
    
} catch (Exception $e) {
    error_log("Check Auth Exception: " . $e->getMessage());
    sendJsonResponse(false, 'An error occurred.', ['authenticated' => false]);
}
?>
