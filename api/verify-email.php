<?php
/**
 * Email Verification API
 * Tsharok LMS
 */

// Define initialization constant
define('TSHAROK_INIT', true);

// Error reporting
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Include required files
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/email.php';

// Check if token is provided
if (!isset($_GET['token']) || empty($_GET['token'])) {
    redirectToVerificationPage('error', 'Invalid verification link.');
}

$token = sanitizeInput($_GET['token']);

try {
    // Get database connection
    $db = getDB();
    
    // Find verification record
    $stmt = $db->prepare("
        SELECT ev.*, u.email, u.first_name, u.is_active
        FROM email_verifications ev
        INNER JOIN users u ON ev.user_id = u.user_id
        WHERE ev.token = ? AND ev.verified = 0
        LIMIT 1
    ");
    
    $stmt->execute([$token]);
    $verification = $stmt->fetch();
    
    if (!$verification) {
        redirectToVerificationPage('error', 'Invalid or already used verification link.');
    }
    
    // Check if already verified
    if ($verification['is_active'] == 1) {
        redirectToVerificationPage('info', 'Your account is already verified. You can login now.');
    }
    
    // Check if token expired
    if (strtotime($verification['expires_at']) < time()) {
        redirectToVerificationPage('error', 'Verification link has expired. Please request a new one.');
    }
    
    // Begin transaction
    $db->beginTransaction();
    
    try {
        // Mark email as verified
        $stmt = $db->prepare("
            UPDATE email_verifications 
            SET verified = 1, verified_at = NOW()
            WHERE token = ?
        ");
        $stmt->execute([$token]);
        
        // Activate user account
        $stmt = $db->prepare("
            UPDATE users 
            SET is_active = 1, updated_at = NOW()
            WHERE user_id = ?
        ");
        $stmt->execute([$verification['user_id']]);
        
        // Commit transaction
        $db->commit();
        
        // Send welcome email
        sendWelcomeEmail($verification['email'], $verification['first_name']);
        
        // Log activity
        logActivity($verification['user_id'], 'verify_email', 'Email verified successfully', $db);
        
        // Redirect to success page
        redirectToVerificationPage('success', 'Email verified successfully! You can now login.');
        
    } catch (PDOException $e) {
        $db->rollBack();
        error_log("Email Verification Error: " . $e->getMessage());
        redirectToVerificationPage('error', 'Verification failed. Please try again.');
    }
    
} catch (Exception $e) {
    error_log("Verification Exception: " . $e->getMessage());
    redirectToVerificationPage('error', 'An unexpected error occurred.');
}

/**
 * Redirect to verification result page
 */
function redirectToVerificationPage($status, $message) {
    $baseUrl = getBaseUrl();
    $url = $baseUrl . "/verification-result.html?status=$status&message=" . urlencode($message);
    header("Location: $url");
    exit;
}
?>
