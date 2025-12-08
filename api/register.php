<?php
/**
 * User Registration API
 * Tsharok LMS
 */

// Define initialization constant
define('TSHAROK_INIT', true);

// Load configurations
require_once __DIR__ . '/../config/app.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/email.php';
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/error-handler.php';

// Initialize API response with CORS and headers
initializeApiResponse();

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
    
    // Rate limiting - prevent spam registrations
    if (!checkRateLimit('register_' . getClientIP(), RATE_LIMIT_REGISTER, RATE_LIMIT_REGISTER_WINDOW)) {
        sendJsonResponse(false, 'Too many registration attempts. Please try again later.');
    }
    
    // Validate required fields
    $requiredFields = ['firstName', 'lastName', 'username', 'email', 'password', 'role'];
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || empty(trim($data[$field]))) {
            sendJsonResponse(false, "The field '$field' is required.");
        }
    }
    
    // Sanitize inputs
    $firstName = sanitizeInput($data['firstName']);
    $lastName = sanitizeInput($data['lastName']);
    $username = sanitizeInput($data['username']);
    $email = sanitizeInput($data['email']);
    $password = $data['password']; // Don't sanitize password
    $confirmPassword = isset($data['confirmPassword']) ? $data['confirmPassword'] : '';
    $role = sanitizeInput($data['role']);
    $phone = isset($data['phone']) ? sanitizeInput($data['phone']) : null;
    $majorId = isset($data['major']) && !empty($data['major']) ? intval($data['major']) : null;
    
    // Force role to student (no instructors allowed)
    $role = 'student';
    
    // Validate email
    if (!validateEmail($email)) {
        sendJsonResponse(false, 'Invalid email address format.');
    }
    
    // Validate username
    $usernameValidation = validateUsername($username);
    if (!$usernameValidation['valid']) {
        sendJsonResponse(false, $usernameValidation['message']);
    }
    
    // Validate password
    if ($password !== $confirmPassword) {
        sendJsonResponse(false, 'Passwords do not match.');
    }
    
    $passwordValidation = validatePassword($password);
    if (!$passwordValidation['valid']) {
        sendJsonResponse(false, $passwordValidation['message']);
    }
    
    // Validate phone if provided
    if ($phone && !empty($phone)) {
        $phoneValidation = validatePhone($phone);
        if (!$phoneValidation['valid']) {
            sendJsonResponse(false, $phoneValidation['message']);
        }
    }
    
    // Validate major for students
    if ($role === 'student' && !$majorId) {
        sendJsonResponse(false, 'Please select your major.');
    }
    
    // Get database connection
    $db = getDB();
    
    // Check if username already exists
    if (usernameExists($username, $db)) {
        sendJsonResponse(false, 'Username already taken. Please choose another one.');
    }
    
    // Check if email already exists
    if (emailExists($email, $db)) {
        sendJsonResponse(false, 'Email already registered. Please use another email or login.');
    }
    
    // Hash password
    $hashedPassword = hashPassword($password);
    
    // Generate verification token
    $verificationToken = generateVerificationToken();
    $tokenExpiry = date('Y-m-d H:i:s', strtotime('+24 hours'));
    
    // Begin transaction
    $db->beginTransaction();
    
    try {
        // Insert user into database
        $stmt = $db->prepare("
            INSERT INTO users (
                username, 
                email, 
                password_hash, 
                first_name, 
                last_name, 
                role, 
                major_id, 
                phone,
                is_active,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())
        ");
        
        $stmt->execute([
            $username,
            $email,
            $hashedPassword,
            $firstName,
            $lastName,
            $role,
            $majorId,
            $phone
        ]);
        
        $userId = $db->lastInsertId();
        
        // Store verification token
        $stmt = $db->prepare("
            INSERT INTO email_verifications (
                user_id,
                token,
                expires_at,
                created_at
            ) VALUES (?, ?, ?, NOW())
        ");
        
        $stmt->execute([
            $userId,
            $verificationToken,
            $tokenExpiry
        ]);
        
        // Commit transaction
        $db->commit();
        
        // Send verification email
        $emailSent = sendVerificationEmail($email, $firstName, $verificationToken);
        
        if (!$emailSent) {
            error_log("Verification email failed for user: $email");
            // Don't fail registration if email fails
        }
        
        // Log registration
        logActivity($userId, 'register', "User registered with email: $email", $db);
        
        // Success response
        sendJsonResponse(true, 'Registration successful! Please check your email to verify your account.', [
            'userId' => $userId,
            'email' => $email,
            'emailSent' => $emailSent
        ]);
        
    } catch (PDOException $e) {
        // Rollback transaction on error
        $db->rollBack();
        handleApiError($e, 'Registration failed. Please try again.');
    }
    
} catch (Exception $e) {
    handleApiError($e, 'Registration failed. Please try again later.');
}
?>
