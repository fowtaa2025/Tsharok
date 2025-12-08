<?php
/**
 * Admin Authorization Functions
 * Tsharok LMS
 */

// Prevent direct access
defined('TSHAROK_INIT') or die('Direct access not permitted');

/**
 * Require admin authentication
 * Redirects to admin login if not authenticated or not admin
 */
function requireAdminAuth($db = null) {
    // Check if user is authenticated
    if (!isAuthenticated()) {
        sendJsonResponse(false, 'Unauthorized. Please login.', null, 401);
        exit;
    }
    
    // Check if user is admin
    if ($db && !hasRole('admin', $db)) {
        sendJsonResponse(false, 'Access denied. Admin privileges required.', null, 403);
        exit;
    }
    
    return true;
}

/**
 * Check if current user is admin
 */
function isAdmin($db) {
    if (!isAuthenticated()) {
        return false;
    }
    
    return hasRole('admin', $db);
}

/**
 * Log admin action to database
 */
function logAdminAction($adminId, $actionType, $targetType, $targetId, $description, $db) {
    try {
        $stmt = $db->prepare("
            INSERT INTO admin_actions (
                admin_id,
                action_type,
                target_type,
                target_id,
                description
            ) VALUES (?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $adminId,
            $actionType,
            $targetType,
            $targetId,
            $description
        ]);
        
        return true;
        
    } catch (PDOException $e) {
        error_log("Log Admin Action Error: " . $e->getMessage());
        return false;
    }
}

/**
 * Get admin statistics
 */
function getAdminStats($db) {
    try {
        $stats = [];
        
        // Total users by role
        $stmt = $db->prepare("
            SELECT role, COUNT(*) as count
            FROM users
            GROUP BY role
        ");
        $stmt->execute();
        $stats['usersByRole'] = $stmt->fetchAll();
        
        // Content statistics
        $stmt = $db->prepare("
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN is_approved = 0 THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN is_approved = 1 THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN is_approved = -1 THEN 1 ELSE 0 END) as rejected
            FROM content
        ");
        $stmt->execute();
        $stats['content'] = $stmt->fetch();
        
        // Recent admin actions
        $stmt = $db->prepare("
            SELECT COUNT(*) as count
            FROM admin_actions
            WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ");
        $stmt->execute();
        $stats['recentActions'] = $stmt->fetch()['count'];
        
        return $stats;
        
    } catch (PDOException $e) {
        error_log("Get Admin Stats Error: " . $e->getMessage());
        return null;
    }
}

/**
 * Check admin permission for specific action
 */
function hasAdminPermission($adminId, $action, $db) {
    // For now, all admins have all permissions
    // In future, you can implement role-based permissions
    return isAdmin($db);
}

/**
 * Get admin activity log
 */
function getAdminActivityLog($adminId, $db, $limit = 50) {
    try {
        $stmt = $db->prepare("
            SELECT 
                aa.*,
                u.username,
                u.first_name,
                u.last_name
            FROM admin_actions aa
            INNER JOIN users u ON aa.admin_id = u.user_id
            WHERE aa.admin_id = ?
            ORDER BY aa.timestamp DESC
            LIMIT ?
        ");
        
        $stmt->execute([$adminId, $limit]);
        return $stmt->fetchAll();
        
    } catch (PDOException $e) {
        error_log("Get Admin Activity Log Error: " . $e->getMessage());
        return [];
    }
}

/**
 * Verify admin session with extra security checks
 */
function verifyAdminSession($sessionToken, $db) {
    if (!validateUserSession($sessionToken, $db)) {
        return false;
    }
    
    // Double-check admin role
    if (!isset($_SESSION['user_id'])) {
        return false;
    }
    
    try {
        $stmt = $db->prepare("
            SELECT role 
            FROM users 
            WHERE user_id = ? AND role = 'admin' AND is_active = 1
        ");
        $stmt->execute([$_SESSION['user_id']]);
        $user = $stmt->fetch();
        
        return $user !== false;
        
    } catch (PDOException $e) {
        error_log("Verify Admin Session Error: " . $e->getMessage());
        return false;
    }
}
?>

