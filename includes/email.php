<?php
/**
 * Email Functions using PHPMailer
 * Tsharok LMS
 */

// Prevent direct access
defined('TSHAROK_INIT') or die('Direct access not permitted');

// Check if PHPMailer is available
$phpmailerAvailable = file_exists(__DIR__ . '/../vendor/autoload.php');

if ($phpmailerAvailable) {
    require_once __DIR__ . '/../vendor/autoload.php';
}

/**
 * Email Configuration
 */
class EmailConfig {
    const SMTP_HOST = 'smtp.gmail.com';  // Change to your SMTP host
    const SMTP_PORT = 587;
    const SMTP_USERNAME = 'your-email@gmail.com';  // Change to your email
    const SMTP_PASSWORD = 'your-app-password';     // Change to your password
    const FROM_EMAIL = 'noreply@tsharok.com';
    const FROM_NAME = 'Tsharok LMS';
    const REPLY_TO = 'support@tsharok.com';
}

/**
 * Initialize PHPMailer
 */
function initMailer() {
    global $phpmailerAvailable;
    
    if (!$phpmailerAvailable) {
        return null;
    }
    
    $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
    
    try {
        // Server settings
        $mail->isSMTP();
        $mail->Host       = EmailConfig::SMTP_HOST;
        $mail->SMTPAuth   = true;
        $mail->Username   = EmailConfig::SMTP_USERNAME;
        $mail->Password   = EmailConfig::SMTP_PASSWORD;
        $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = EmailConfig::SMTP_PORT;
        
        // Sender info
        $mail->setFrom(EmailConfig::FROM_EMAIL, EmailConfig::FROM_NAME);
        $mail->addReplyTo(EmailConfig::REPLY_TO, EmailConfig::FROM_NAME);
        
        // Encoding
        $mail->CharSet = 'UTF-8';
        $mail->isHTML(true);
        
        return $mail;
        
    } catch (\Exception $e) {
        error_log("Mailer Init Error: " . $e->getMessage());
        return null;
    }
}

/**
 * Send verification email
 */
function sendVerificationEmail($email, $firstName, $token) {
    $mail = initMailer();
    
    if (!$mail) {
        // PHPMailer not available - log email instead
        $verificationUrl = getBaseUrl() . "/api/verify-email.php?token=" . $token;
        error_log("=== VERIFICATION EMAIL ===");
        error_log("To: $email ($firstName)");
        error_log("Verification URL: $verificationUrl");
        error_log("==========================");
        // Return true so registration continues
        return true;
    }
    
    try {
        // Recipient
        $mail->addAddress($email, $firstName);
        
        // Content
        $mail->Subject = 'Verify Your Tsharok Account';
        
        // Verification URL
        $verificationUrl = getBaseUrl() . "/api/verify-email.php?token=" . $token;
        
        // HTML body
        $mail->Body = getVerificationEmailTemplate($firstName, $verificationUrl);
        
        // Plain text alternative
        $mail->AltBody = "Hello $firstName,\n\n" .
                         "Thank you for registering with Tsharok!\n\n" .
                         "Please verify your email address by clicking the link below:\n" .
                         "$verificationUrl\n\n" .
                         "This link will expire in 24 hours.\n\n" .
                         "If you didn't create an account, please ignore this email.\n\n" .
                         "Best regards,\nThe Tsharok Team";
        
        $mail->send();
        return true;
        
    } catch (\Exception $e) {
        error_log("Email Send Error: " . $mail->ErrorInfo);
        return false;
    }
}

/**
 * Send welcome email
 */
function sendWelcomeEmail($email, $firstName) {
    $mail = initMailer();
    
    if (!$mail) {
        // PHPMailer not available - log email instead
        error_log("=== WELCOME EMAIL ===");
        error_log("To: $email ($firstName)");
        error_log("Login URL: " . getBaseUrl() . "/login.html");
        error_log("=====================");
        return true;
    }
    
    try {
        $mail->addAddress($email, $firstName);
        $mail->Subject = 'Welcome to Tsharok!';
        
        $mail->Body = getWelcomeEmailTemplate($firstName);
        
        $mail->AltBody = "Welcome to Tsharok, $firstName!\n\n" .
                         "Your account has been successfully verified.\n\n" .
                         "You can now log in and start exploring our courses.\n\n" .
                         "Visit: " . getBaseUrl() . "/login.html\n\n" .
                         "Best regards,\nThe Tsharok Team";
        
        $mail->send();
        return true;
        
    } catch (\Exception $e) {
        error_log("Welcome Email Error: " . $mail->ErrorInfo);
        return false;
    }
}

/**
 * Send password reset email
 */
function sendPasswordResetEmail($email, $firstName, $token) {
    $mail = initMailer();
    
    if (!$mail) {
        // PHPMailer not available - log email instead
        $resetUrl = getBaseUrl() . "/reset-password.html?token=" . $token;
        error_log("=== PASSWORD RESET EMAIL ===");
        error_log("To: $email ($firstName)");
        error_log("Reset URL: $resetUrl");
        error_log("============================");
        return true;
    }
    
    try {
        $mail->addAddress($email, $firstName);
        $mail->Subject = 'Reset Your Tsharok Password';
        
        $resetUrl = getBaseUrl() . "/reset-password.html?token=" . $token;
        
        $mail->Body = getPasswordResetEmailTemplate($firstName, $resetUrl);
        
        $mail->AltBody = "Hello $firstName,\n\n" .
                         "We received a request to reset your password.\n\n" .
                         "Click the link below to reset your password:\n" .
                         "$resetUrl\n\n" .
                         "This link will expire in 1 hour.\n\n" .
                         "If you didn't request this, please ignore this email.\n\n" .
                         "Best regards,\nThe Tsharok Team";
        
        $mail->send();
        return true;
        
    } catch (\Exception $e) {
        error_log("Password Reset Email Error: " . $mail->ErrorInfo);
        return false;
    }
}

/**
 * Get base URL
 */
function getBaseUrl() {
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    return $protocol . '://' . $host;
}

/**
 * Verification email template
 */
function getVerificationEmailTemplate($firstName, $verificationUrl) {
    return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
        .button { display: inline-block; background: #4F46E5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎓 Verify Your Email</h1>
        </div>
        <div class="content">
            <h2>Hello $firstName!</h2>
            <p>Thank you for registering with Tsharok Learning Management System.</p>
            <p>To complete your registration and activate your account, please verify your email address by clicking the button below:</p>
            <div style="text-align: center;">
                <a href="$verificationUrl" class="button">Verify Email Address</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #4F46E5;">$verificationUrl</p>
            <p><strong>This verification link will expire in 24 hours.</strong></p>
            <p>If you didn't create an account with Tsharok, please ignore this email.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 14px; color: #6b7280;">
                If you're having trouble clicking the button, copy and paste the URL above into your web browser.
            </p>
        </div>
        <div class="footer">
            <p>© 2025 Tsharok. All rights reserved.</p>
            <p>This is an automated email. Please do not reply to this message.</p>
        </div>
    </div>
</body>
</html>
HTML;
}

/**
 * Welcome email template
 */
function getWelcomeEmailTemplate($firstName) {
    $loginUrl = getBaseUrl() . "/login.html";
    $coursesUrl = getBaseUrl() . "/search-results.html";
    
    return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
        .button { display: inline-block; background: #4F46E5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
        .feature { padding: 15px; margin: 10px 0; background: #f9fafb; border-radius: 5px; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Welcome to Tsharok!</h1>
        </div>
        <div class="content">
            <h2>Hello $firstName!</h2>
            <p>Your account has been successfully verified. Welcome to the Tsharok Learning Management System!</p>
            
            <div class="feature">
                <h3>📚 What You Can Do:</h3>
                <ul>
                    <li>Browse and enroll in hundreds of courses</li>
                    <li>Track your learning progress</li>
                    <li>Earn certificates upon completion</li>
                    <li>Connect with instructors and fellow students</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="$loginUrl" class="button">Go to Dashboard</a>
                <a href="$coursesUrl" class="button" style="background: #7C3AED;">Browse Courses</a>
            </div>
            
            <p>If you have any questions or need assistance, our support team is here to help!</p>
            <p>Happy learning! 🚀</p>
        </div>
        <div class="footer">
            <p>© 2025 Tsharok. All rights reserved.</p>
            <p>Need help? Contact us at support@tsharok.com</p>
        </div>
    </div>
</body>
</html>
HTML;
}

/**
 * Password reset email template
 */
function getPasswordResetEmailTemplate($firstName, $resetUrl) {
    return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
        .button { display: inline-block; background: #4F46E5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔒 Password Reset Request</h1>
        </div>
        <div class="content">
            <h2>Hello $firstName!</h2>
            <p>We received a request to reset your password for your Tsharok account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center;">
                <a href="$resetUrl" class="button">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #4F46E5;">$resetUrl</p>
            
            <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul>
                    <li>This link will expire in 1 hour</li>
                    <li>If you didn't request this reset, please ignore this email</li>
                    <li>Your password will remain unchanged</li>
                </ul>
            </div>
            
            <p>For security reasons, we never ask for your password via email.</p>
        </div>
        <div class="footer">
            <p>© 2025 Tsharok. All rights reserved.</p>
            <p>This is an automated email. Please do not reply to this message.</p>
        </div>
    </div>
</body>
</html>
HTML;
}
?>
