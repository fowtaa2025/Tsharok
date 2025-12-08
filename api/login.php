<?php
/**
 * User Login API
 * Tsharok LMS
 */

// Define initialization constant
define('TSHAROK_INIT', true);

// Load configurations FIRST (before session_start)
require_once __DIR__ . '/../config/app.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/error-handler.php';

// Initialize API response with CORS and headers
initializeApiResponse();

// Start session AFTER loading config
session_start();

// Load session functions
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
    
    // Rate limiting - prevent brute force attacks
    if (!checkRateLimit('login_' . getClientIP(), RATE_LIMIT_LOGIN, RATE_LIMIT_LOGIN_WINDOW)) {
        sendJsonResponse(false, 'Too many login attempts. Please try again later.');
    }
    
    // Validate required fields
    if (!isset($data['identifier']) || empty(trim($data['identifier']))) {
        sendJsonResponse(false, 'Email or username is required.');
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
    
    // Find user by email or username
    $stmt = $db->prepare("
        SELECT 
            user_id, 
            username, 
            email, 
            password_hash, 
            first_name, 
            last_name, 
            role, 
            major_id,
            is_active,
            profile_image
        FROM users
        WHERE (email = ? OR username = ?) AND is_active = 1
        LIMIT 1
    ");
    
    $stmt->execute([$identifier, $identifier]);
    $user = $stmt->fetch();
    
    // Check if user exists
    if (!$user) {
        // Don't reveal if user exists or not for security
        sendJsonResponse(false, 'Invalid credentials. Please check your email/username and password.');
    }
    
    // Verify password
    if (!verifyPassword($password, $user['password_hash'])) {
        // Log failed login attempt
        logActivity($user['user_id'], 'login_failed', 'Failed login attempt from IP: ' . getClientIP(), $db);
        sendJsonResponse(false, 'Invalid credentials. Please check your email/username and password.');
    }
    
    // Check if account is active
    if ($user['is_active'] != 1) {
        sendJsonResponse(false, 'Your account is not verified. Please check your email for verification link.');
    }
    
    // Login successful - create session
    $sessionToken = createUserSession($user['user_id'], $db, $remember);
    
    // Update last login timestamp
    $stmt = $db->prepare("UPDATE users SET last_login = NOW() WHERE user_id = ?");
    $stmt->execute([$user['user_id']]);
    
    // Log successful login
    logActivity($user['user_id'], 'login', 'User logged in successfully', $db);
    
    // Prepare user data for response
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
        'sessionToken' => $sessionToken
    ];
    
    // Determine redirect URL based on role
    $redirectUrl = '/dashboard/student.html';
    if ($user['role'] === 'admin') {
        $redirectUrl = '/dashboard/admin.html';
    }
    
    // Success response
    sendJsonResponse(true, 'Login successful! Redirecting...', [
        'user' => $userData,
        'redirectUrl' => $redirectUrl
    ]);
    
} catch (Exception $e) {
    handleApiError($e, 'Login failed. Please try again later.');
}
?>
