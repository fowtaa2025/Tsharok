<?php
/**
 * Admin Login API
 * Tsharok LMS - Separate admin authentication with enhanced security
 */

// Define initialization constant
define('TSHAROK_INIT', true);

// Start session
session_start();

// Error reporting for development (disable in production)
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Set headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');

// Include required files
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/session.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(false, 'Invalid request method. Only POST requests are allowed.');
}

try {
    // Get POST data
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Check if data was received
    if (!$data) {
        sendJsonResponse(false, 'No data received. Please try again.');
    }
    
    // Stricter rate limiting for admin login - prevent brute force attacks
    if (!checkRateLimit('admin_login_' . getClientIP(), 3, 1800)) { // 3 attempts per 30 minutes
        // Log suspicious activity
        error_log("SECURITY ALERT: Multiple failed admin login attempts from IP: " . getClientIP());
        sendJsonResponse(false, 'Too many admin login attempts. Your IP has been flagged. Please try again in 30 minutes.');
    }
    
    // Validate required fields
    if (!isset($data['identifier']) || empty(trim($data['identifier']))) {
        sendJsonResponse(false, 'Admin email or username is required.');
    }
    
    if (!isset($data['password']) || empty($data['password'])) {
        sendJsonResponse(false, 'Password is required.');
    }
    
    // Sanitize inputs
    $identifier = sanitizeInput($data['identifier']);
    $password = $data['password']; // Don't sanitize password
    $remember = isset($data['remember']) && $data['remember'] === true;
    
    // Get database connection
    $db = getDB();
    
    // Find admin user by email or username - ONLY ADMIN ROLE
    $stmt = $db->prepare("
        SELECT 
            user_id, 
            username, 
            email, 
            password_hash, 
            first_name, 
            last_name, 
            role, 
            is_active,
            profile_image
        FROM users
        WHERE (email = ? OR username = ?) 
        AND role = 'admin'
        AND is_active = 1
        LIMIT 1
    ");
    
    $stmt->execute([$identifier, $identifier]);
    $user = $stmt->fetch();
    
    // Check if admin user exists
    if (!$user) {
        // Log failed admin login attempt
        error_log("SECURITY: Failed admin login attempt for identifier: {$identifier} from IP: " . getClientIP());
        logActivity(null, 'admin_login_failed', "Failed admin login attempt for: {$identifier} from IP: " . getClientIP(), $db);
        
        // Don't reveal if user exists or not for security
        sendJsonResponse(false, 'Invalid admin credentials. Access denied.');
    }
    
    // Verify password
    if (!verifyPassword($password, $user['password_hash'])) {
        // Log failed login attempt
        error_log("SECURITY: Failed admin password verification for user_id: {$user['user_id']} from IP: " . getClientIP());
        logActivity($user['user_id'], 'admin_login_failed', 'Failed admin password verification from IP: ' . getClientIP(), $db);
        sendJsonResponse(false, 'Invalid admin credentials. Access denied.');
    }
    
    // Double-check role (extra security layer)
    if ($user['role'] !== 'admin') {
        error_log("SECURITY ALERT: Non-admin user attempted admin login. User ID: {$user['user_id']}, IP: " . getClientIP());
        logActivity($user['user_id'], 'unauthorized_admin_attempt', 'Non-admin user attempted to access admin panel', $db);
        sendJsonResponse(false, 'Access denied. You do not have administrative privileges.');
    }
    
    // Check if account is active
    if ($user['is_active'] != 1) {
        sendJsonResponse(false, 'Your admin account has been deactivated. Contact system administrator.');
    }
    
    // Login successful - create admin session
    $sessionToken = createUserSession($user['user_id'], $db, $remember);
    
    if (!$sessionToken) {
        sendJsonResponse(false, 'Failed to create session. Please try again.');
    }
    
    // Update last login timestamp
    $stmt = $db->prepare("UPDATE users SET last_login = NOW() WHERE user_id = ?");
    $stmt->execute([$user['user_id']]);
    
    // Log successful admin login
    logActivity($user['user_id'], 'admin_login', 'Admin user logged in successfully from IP: ' . getClientIP(), $db);
    error_log("INFO: Successful admin login - User ID: {$user['user_id']}, IP: " . getClientIP());
    
    // Prepare admin user data for response
    $userData = [
        'userId' => $user['user_id'],
        'username' => $user['username'],
        'email' => $user['email'],
        'firstName' => $user['first_name'],
        'lastName' => $user['last_name'],
        'fullName' => $user['first_name'] . ' ' . $user['last_name'],
        'role' => $user['role'],
        'profileImage' => $user['profile_image'],
        'sessionToken' => $sessionToken,
        'isAdmin' => true
    ];
    
    // Success response
    sendJsonResponse(true, 'Admin authentication successful! Redirecting to admin panel...', [
        'user' => $userData,
        'redirectUrl' => '/dashboard/admin.html'
    ]);
    
} catch (Exception $e) {
    error_log("Admin Login Exception: " . $e->getMessage());
    sendJsonResponse(false, 'An unexpected error occurred during authentication. Please try again later.');
}
?>

