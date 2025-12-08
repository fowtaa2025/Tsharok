<?php
/**
 * Helper Functions
 * Tsharok LMS
 */

// Prevent direct access
defined('TSHAROK_INIT') or die('Direct access not permitted');

/**
 * Sanitize input data
 * WARNING: This is for display purposes only!
 * For SQL queries, ALWAYS use prepared statements with parameter binding
 */
function sanitizeInput($data) {
    if (is_array($data)) {
        return array_map('sanitizeInput', $data);
    }
    
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
    
    // Log if SQL injection pattern detected (for monitoring)
    if (detectSqlInjectionPattern($data)) {
        error_log("SECURITY: Potential SQL injection in input: " . substr($data, 0, 100));
    }
    
    return $data;
}

/**
 * Detect SQL injection patterns (for logging/monitoring only)
 * This is NOT a replacement for prepared statements!
 */
function detectSqlInjectionPattern($input) {
    $patterns = [
        '/(\bUNION\b.*\bSELECT\b)/i',
        '/(\bINSERT\b.*\bINTO\b)/i',
        '/(\bUPDATE\b.*\bSET\b)/i',
        '/(\bDELETE\b.*\bFROM\b)/i',
        '/(\bDROP\b.*\bTABLE\b)/i',
        '/--/',
        '/\/\*.*\*\//',
        '/;\s*\w+/'
    ];
    
    foreach ($patterns as $pattern) {
        if (preg_match($pattern, $input)) {
            return true;
        }
    }
    
    return false;
}

/**
 * Validate email address
 */
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

/**
 * Validate password strength
 * Minimum 8 characters, at least one uppercase letter and one number
 */
function validatePassword($password) {
    if (strlen($password) < 8) {
        return ['valid' => false, 'message' => 'Password must be at least 8 characters long'];
    }
    
    if (!preg_match('/[A-Z]/', $password)) {
        return ['valid' => false, 'message' => 'Password must contain at least one uppercase letter'];
    }
    
    if (!preg_match('/[0-9]/', $password)) {
        return ['valid' => false, 'message' => 'Password must contain at least one number'];
    }
    
    return ['valid' => true, 'message' => 'Password is valid'];
}

/**
 * Hash password securely
 */
function hashPassword($password) {
    return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
}

/**
 * Verify password
 */
function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

/**
 * Generate random token
 */
function generateToken($length = 32) {
    return bin2hex(random_bytes($length));
}

/**
 * Generate verification token
 */
function generateVerificationToken() {
    return generateToken(32);
}

/**
 * Validate username
 * Minimum 3 characters, alphanumeric and underscores only
 */
function validateUsername($username) {
    if (strlen($username) < 3) {
        return ['valid' => false, 'message' => 'Username must be at least 3 characters long'];
    }
    
    if (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
        return ['valid' => false, 'message' => 'Username can only contain letters, numbers, and underscores'];
    }
    
    return ['valid' => true, 'message' => 'Username is valid'];
}

/**
 * Check if username exists
 */
function usernameExists($username, $db) {
    try {
        $stmt = $db->prepare("SELECT user_id FROM users WHERE username = ? LIMIT 1");
        $stmt->execute([$username]);
        return $stmt->fetch() !== false;
    } catch (PDOException $e) {
        error_log("Database Error: " . $e->getMessage());
        return false;
    }
}

/**
 * Check if email exists
 */
function emailExists($email, $db) {
    try {
        $stmt = $db->prepare("SELECT user_id FROM users WHERE email = ? LIMIT 1");
        $stmt->execute([$email]);
        return $stmt->fetch() !== false;
    } catch (PDOException $e) {
        error_log("Database Error: " . $e->getMessage());
        return false;
    }
}

/**
 * Get client IP address
 */
function getClientIP() {
    $ipaddress = '';
    if (isset($_SERVER['HTTP_CLIENT_IP'])) {
        $ipaddress = $_SERVER['HTTP_CLIENT_IP'];
    } else if(isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ipaddress = $_SERVER['HTTP_X_FORWARDED_FOR'];
    } else if(isset($_SERVER['HTTP_X_FORWARDED'])) {
        $ipaddress = $_SERVER['HTTP_X_FORWARDED'];
    } else if(isset($_SERVER['HTTP_FORWARDED_FOR'])) {
        $ipaddress = $_SERVER['HTTP_FORWARDED_FOR'];
    } else if(isset($_SERVER['HTTP_FORWARDED'])) {
        $ipaddress = $_SERVER['HTTP_FORWARDED'];
    } else if(isset($_SERVER['REMOTE_ADDR'])) {
        $ipaddress = $_SERVER['REMOTE_ADDR'];
    } else {
        $ipaddress = 'UNKNOWN';
    }
    return $ipaddress;
}

/**
 * Log activity
 */
function logActivity($user_id, $action, $description, $db) {
    try {
        $stmt = $db->prepare("
            INSERT INTO activity_logs (user_id, action, description, ip_address, created_at) 
            VALUES (?, ?, ?, ?, NOW())
        ");
        $stmt->execute([$user_id, $action, $description, getClientIP()]);
        return true;
    } catch (PDOException $e) {
        error_log("Log Activity Error: " . $e->getMessage());
        return false;
    }
}

/**
 * Send JSON response
 */
function sendJsonResponse($success, $message, $data = null) {
    header('Content-Type: application/json');
    $response = [
        'success' => $success,
        'message' => $message
    ];
    
    if ($data !== null) {
        $response['data'] = $data;
    }
    
    echo json_encode($response);
    exit;
}

/**
 * Rate limiting check
 */
function checkRateLimit($identifier, $maxAttempts = 5, $timeWindow = 3600) {
    session_start();
    
    $key = 'rate_limit_' . $identifier;
    $now = time();
    
    if (!isset($_SESSION[$key])) {
        $_SESSION[$key] = [];
    }
    
    // Remove old attempts
    $_SESSION[$key] = array_filter($_SESSION[$key], function($timestamp) use ($now, $timeWindow) {
        return ($now - $timestamp) < $timeWindow;
    });
    
    // Check if limit exceeded
    if (count($_SESSION[$key]) >= $maxAttempts) {
        return false;
    }
    
    // Add current attempt
    $_SESSION[$key][] = $now;
    
    return true;
}

/**
 * Validate phone number
 */
function validatePhone($phone) {
    // Remove all non-numeric characters
    $phone = preg_replace('/[^0-9]/', '', $phone);
    
    // Check if it's a valid length (adjust based on your requirements)
    if (strlen($phone) >= 10 && strlen($phone) <= 15) {
        return ['valid' => true, 'message' => 'Phone number is valid'];
    }
    
    return ['valid' => false, 'message' => 'Phone number must be between 10 and 15 digits'];
}

/**
 * Create slug from string
 */
function createSlug($string) {
    $string = strtolower(trim($string));
    $string = preg_replace('/[^a-z0-9-]/', '-', $string);
    $string = preg_replace('/-+/', '-', $string);
    return $string;
}
?>
