<?php
/**
 * User Logout API
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
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Include required files
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/session.php';

try {
    // Check if user is logged in
    if (!isset($_SESSION['user_id'])) {
        sendJsonResponse(false, 'No active session found.');
    }
    
    $userId = $_SESSION['user_id'];
    $db = getDB();
    
    // Destroy session in database
    if (isset($_SESSION['session_token'])) {
        destroyUserSession($_SESSION['session_token'], $db);
    }
    
    // Log logout activity
    logActivity($userId, 'logout', 'User logged out', $db);
    
    // Destroy PHP session
    session_unset();
    session_destroy();
    
    // Clear session cookie
    if (isset($_COOKIE[session_name()])) {
        setcookie(session_name(), '', time() - 3600, '/');
    }
    
    // Clear remember me cookie if exists
    if (isset($_COOKIE['remember_token'])) {
        setcookie('remember_token', '', time() - 3600, '/', '', false, true);
    }
    
    sendJsonResponse(true, 'Logged out successfully.');
    
} catch (Exception $e) {
    error_log("Logout Exception: " . $e->getMessage());
    sendJsonResponse(false, 'An error occurred during logout.');
}
?>
