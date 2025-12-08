<?php
/**
 * Session Management Functions
 * Tsharok LMS
 */

// Prevent direct access
defined('TSHAROK_INIT') or die('Direct access not permitted');

/**
 * Create user session
 */
function createUserSession($userId, $db, $remember = false) {
    // Generate session token
    $sessionToken = generateToken(32);
    $expiresAt = $remember ? date('Y-m-d H:i:s', strtotime('+30 days')) : date('Y-m-d H:i:s', strtotime('+24 hours'));
    
    // Store session in database
    try {
        $stmt = $db->prepare("
            INSERT INTO user_sessions (
                user_id,
                session_token,
                ip_address,
                user_agent,
                expires_at,
                created_at
            ) VALUES (?, ?, ?, ?, ?, NOW())
        ");
        
        $stmt->execute([
            $userId,
            $sessionToken,
            getClientIP(),
            $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown',
            $expiresAt
        ]);
        
        // Set PHP session variables
        $_SESSION['user_id'] = $userId;
        $_SESSION['session_token'] = $sessionToken;
        $_SESSION['login_time'] = time();
        
        // Set remember me cookie if requested
        if ($remember) {
            setcookie('remember_token', $sessionToken, strtotime('+30 days'), '/', '', false, true);
        }
        
        return $sessionToken;
        
    } catch (PDOException $e) {
        error_log("Session Creation Error: " . $e->getMessage());
        return false;
    }
}

/**
 * Validate user session
 */
function validateUserSession($sessionToken, $db) {
    try {
        $stmt = $db->prepare("
            SELECT us.*, u.is_active
            FROM user_sessions us
            INNER JOIN users u ON us.user_id = u.user_id
            WHERE us.session_token = ? 
            AND us.is_active = 1
            AND us.expires_at > NOW()
            AND u.is_active = 1
            LIMIT 1
        ");
        
        $stmt->execute([$sessionToken]);
        $session = $stmt->fetch();
        
        if (!$session) {
            return false;
        }
        
        // Update last activity
        $stmt = $db->prepare("
            UPDATE user_sessions 
            SET last_activity = NOW() 
            WHERE session_token = ?
        ");
        $stmt->execute([$sessionToken]);
        
        return true;
        
    } catch (PDOException $e) {
        error_log("Session Validation Error: " . $e->getMessage());
        return false;
    }
}

/**
 * Destroy user session
 */
function destroyUserSession($sessionToken, $db) {
    try {
        $stmt = $db->prepare("
            UPDATE user_sessions 
            SET is_active = 0, logout_at = NOW()
            WHERE session_token = ?
        ");
        $stmt->execute([$sessionToken]);
        return true;
        
    } catch (PDOException $e) {
        error_log("Session Destroy Error: " . $e->getMessage());
        return false;
    }
}

/**
 * Clean expired sessions
 */
function cleanExpiredSessions($db) {
    try {
        $stmt = $db->prepare("
            UPDATE user_sessions 
            SET is_active = 0
            WHERE expires_at < NOW() AND is_active = 1
        ");
        $stmt->execute();
        return true;
        
    } catch (PDOException $e) {
        error_log("Clean Sessions Error: " . $e->getMessage());
        return false;
    }
}

/**
 * Get user sessions
 */
function getUserSessions($userId, $db) {
    try {
        $stmt = $db->prepare("
            SELECT 
                session_token,
                ip_address,
                user_agent,
                created_at,
                last_activity,
                expires_at,
                is_active
            FROM user_sessions
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 10
        ");
        
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
        
    } catch (PDOException $e) {
        error_log("Get Sessions Error: " . $e->getMessage());
        return [];
    }
}

/**
 * Destroy all user sessions except current
 */
function destroyOtherSessions($userId, $currentToken, $db) {
    try {
        $stmt = $db->prepare("
            UPDATE user_sessions 
            SET is_active = 0, logout_at = NOW()
            WHERE user_id = ? AND session_token != ? AND is_active = 1
        ");
        $stmt->execute([$userId, $currentToken]);
        return true;
        
    } catch (PDOException $e) {
        error_log("Destroy Other Sessions Error: " . $e->getMessage());
        return false;
    }
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    return isset($_SESSION['user_id']) && isset($_SESSION['session_token']);
}

/**
 * Require authentication
 */
function requireAuth() {
    if (!isAuthenticated()) {
        header('Location: /login.html');
        exit;
    }
}

/**
 * Check user role
 */
function hasRole($requiredRole, $db) {
    if (!isAuthenticated()) {
        return false;
    }
    
    try {
        $stmt = $db->prepare("SELECT role FROM users WHERE user_id = ? LIMIT 1");
        $stmt->execute([$_SESSION['user_id']]);
        $user = $stmt->fetch();
        
        if (!$user) {
            return false;
        }
        
        if (is_array($requiredRole)) {
            return in_array($user['role'], $requiredRole);
        }
        
        return $user['role'] === $requiredRole;
        
    } catch (PDOException $e) {
        error_log("Role Check Error: " . $e->getMessage());
        return false;
    }
}
?>
