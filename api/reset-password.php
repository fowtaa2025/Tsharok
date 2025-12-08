<?php
/**
 * Reset Password API
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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(false, 'Invalid request method.');
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['token']) || empty($data['token'])) {
        sendJsonResponse(false, 'Reset token is required.');
    }
    
    if (!isset($data['password']) || empty($data['password'])) {
        sendJsonResponse(false, 'New password is required.');
    }
    
    if (!isset($data['confirmPassword']) || empty($data['confirmPassword'])) {
        sendJsonResponse(false, 'Password confirmation is required.');
    }
    
    $token = $data['token'];
    $password = $data['password'];
    $confirmPassword = $data['confirmPassword'];
    
    // Validate password match
    if ($password !== $confirmPassword) {
        sendJsonResponse(false, 'Passwords do not match.');
    }
    
    // Validate password strength
    $passwordValidation = validatePassword($password);
    if (!$passwordValidation['valid']) {
        sendJsonResponse(false, $passwordValidation['message']);
    }
    
    $db = getDB();
    
    // Verify token
    $stmt = $db->prepare("
        SELECT pr.*, u.email, u.first_name
        FROM password_resets pr
        INNER JOIN users u ON pr.user_id = u.user_id
        WHERE pr.token = ? 
        AND pr.used = 0 
        AND pr.expires_at > NOW()
        LIMIT 1
    ");
    
    $stmt->execute([$token]);
    $reset = $stmt->fetch();
    
    if (!$reset) {
        sendJsonResponse(false, 'Invalid or expired reset token. Please request a new password reset.');
    }
    
    // Start transaction
    $db->beginTransaction();
    
    try {
        // Hash new password
        $hashedPassword = hashPassword($password);
        
        // Update user password
        $stmt = $db->prepare("
            UPDATE users 
            SET password_hash = ?, 
                updated_at = NOW() 
            WHERE user_id = ?
        ");
        $stmt->execute([$hashedPassword, $reset['user_id']]);
        
        // Mark token as used
        $stmt = $db->prepare("
            UPDATE password_resets 
            SET used = 1, used_at = NOW() 
            WHERE token = ?
        ");
        $stmt->execute([$token]);
        
        // Invalidate all user sessions for security
        $stmt = $db->prepare("
            UPDATE user_sessions 
            SET is_active = 0, logout_at = NOW() 
            WHERE user_id = ? AND is_active = 1
        ");
        $stmt->execute([$reset['user_id']]);
        
        // Log activity
        logActivity($reset['user_id'], 'password_reset', 'Password was reset successfully', $db);
        
        $db->commit();
        
        sendJsonResponse(true, 'Password has been reset successfully. You can now login with your new password.');
        
    } catch (PDOException $e) {
        $db->rollBack();
        error_log("Password Reset Error: " . $e->getMessage());
        sendJsonResponse(false, 'Failed to reset password. Please try again.');
    }
    
} catch (Exception $e) {
    error_log("Reset Password Exception: " . $e->getMessage());
    sendJsonResponse(false, 'An unexpected error occurred.');
}
?>
