<?php
/**
 * Resend Verification Email API
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
    if (!checkRateLimit('resend_' . $email, 3, 3600)) {
        sendJsonResponse(false, 'Too many requests. Please try again later.');
    }
    
    $db = getDB();
    
    // Check if user exists and is not verified
    $stmt = $db->prepare("
        SELECT user_id, first_name, is_active
        FROM users
        WHERE email = ?
        LIMIT 1
    ");
    
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if (!$user) {
        // Don't reveal if email exists or not for security
        sendJsonResponse(true, 'If your email is registered, you will receive a verification link.');
    }
    
    if ($user['is_active'] == 1) {
        sendJsonResponse(false, 'Your account is already verified.');
    }
    
    // Generate new token
    $newToken = generateVerificationToken();
    $tokenExpiry = date('Y-m-d H:i:s', strtotime('+24 hours'));
    
    // Invalidate old tokens and create new one
    $db->beginTransaction();
    
    try {
        // Mark old tokens as expired
        $stmt = $db->prepare("
            UPDATE email_verifications
            SET verified = 2
            WHERE user_id = ? AND verified = 0
        ");
        $stmt->execute([$user['user_id']]);
        
        // Insert new token
        $stmt = $db->prepare("
            INSERT INTO email_verifications (user_id, token, expires_at, created_at)
            VALUES (?, ?, ?, NOW())
        ");
        $stmt->execute([$user['user_id'], $newToken, $tokenExpiry]);
        
        $db->commit();
        
        // Send email
        $emailSent = sendVerificationEmail($email, $user['first_name'], $newToken);
        
        if ($emailSent) {
            sendJsonResponse(true, 'Verification email sent successfully. Please check your inbox.');
        } else {
            sendJsonResponse(false, 'Failed to send email. Please try again later.');
        }
        
    } catch (PDOException $e) {
        $db->rollBack();
        error_log("Resend Verification Error: " . $e->getMessage());
        sendJsonResponse(false, 'Failed to process request. Please try again.');
    }
    
} catch (Exception $e) {
    error_log("Resend Verification Exception: " . $e->getMessage());
    sendJsonResponse(false, 'An unexpected error occurred.');
}
?>
