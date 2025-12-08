<?php
/**
 * Forgot Password API
 * Tsharok LMS
 */

define('TSHAROK_INIT', true);

ini_set('display_errors', 0);
error_reporting(E_ALL);

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/email.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(false, 'Invalid request method.');
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['email']) || empty($data['email'])) {
        sendJsonResponse(false, 'Email is required.');
    }
    
    $email = sanitizeInput($data['email']);
    
    if (!validateEmail($email)) {
        sendJsonResponse(false, 'Invalid email address.');
    }
    
    // Rate limiting
    if (!checkRateLimit('reset_' . $email, 3, 3600)) {
        sendJsonResponse(false, 'Too many password reset requests. Please try again later.');
    }
    
    $db = getDB();
    
    // Check if user exists
    $stmt = $db->prepare("
        SELECT user_id, first_name, is_active
        FROM users
        WHERE email = ?
        LIMIT 1
    ");
    
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    // Always show success message for security (don't reveal if email exists)
    if (!$user) {
        sendJsonResponse(true, 'If your email is registered, you will receive a password reset link shortly.');
    }
    
    if ($user['is_active'] != 1) {
        sendJsonResponse(true, 'If your email is registered, you will receive a password reset link shortly.');
    }
    
    // Generate reset token
    $resetToken = generateToken(32);
    $tokenExpiry = date('Y-m-d H:i:s', strtotime('+1 hour'));
    
    // Store reset token
    $db->beginTransaction();
    
    try {
        // Invalidate old tokens
        $stmt = $db->prepare("
            UPDATE password_resets
            SET used = 2
            WHERE user_id = ? AND used = 0
        ");
        $stmt->execute([$user['user_id']]);
        
        // Insert new token
        $stmt = $db->prepare("
            INSERT INTO password_resets (user_id, token, expires_at, created_at)
            VALUES (?, ?, ?, NOW())
        ");
        $stmt->execute([$user['user_id'], $resetToken, $tokenExpiry]);
        
        $db->commit();
        
        // Send reset email
        $emailSent = sendPasswordResetEmail($email, $user['first_name'], $resetToken);
        
        logActivity($user['user_id'], 'password_reset_request', 'Password reset requested from IP: ' . getClientIP(), $db);
        
        sendJsonResponse(true, 'If your email is registered, you will receive a password reset link shortly.');
        
    } catch (PDOException $e) {
        $db->rollBack();
        error_log("Password Reset Error: " . $e->getMessage());
        sendJsonResponse(false, 'Failed to process request. Please try again.');
    }
    
} catch (Exception $e) {
    error_log("Forgot Password Exception: " . $e->getMessage());
    sendJsonResponse(false, 'An unexpected error occurred.');
}
?>
