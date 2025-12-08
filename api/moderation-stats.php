<?php
/**
 * Moderation Statistics API
 * Get statistics for content moderation
 * Tsharok LMS
 */

// Define initialization constant
define('TSHAROK_INIT', true);

// Start session
session_start();

// Error reporting
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Set headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Include required files
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/session.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJsonResponse(false, 'Invalid request method.');
}

try {
    // Get database connection
    $db = getDB();
    
    // Check authentication
    $sessionToken = $_SESSION['session_token'] ?? null;
    if (!$sessionToken || !validateUserSession($sessionToken, $db)) {
        sendJsonResponse(false, 'Unauthorized. Please login.', null, 401);
    }
    
    // Verify admin role
    if (!hasRole('admin', $db)) {
        sendJsonResponse(false, 'Access denied. Admin privileges required.', null, 403);
    }
    
    // Get content statistics
    $stmt = $db->prepare("
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN is_approved = 0 THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN is_approved = 1 THEN 1 ELSE 0 END) as approved,
            SUM(CASE WHEN is_approved = -1 THEN 1 ELSE 0 END) as rejected
        FROM content
    ");
    $stmt->execute();
    $contentStats = $stmt->fetch();
    
    // Get content by type
    $stmt = $db->prepare("
        SELECT 
            type,
            COUNT(*) as count,
            SUM(CASE WHEN is_approved = 0 THEN 1 ELSE 0 END) as pending_count
        FROM content
        GROUP BY type
    ");
    $stmt->execute();
    $contentByType = $stmt->fetchAll();
    
    // Get recent admin actions
    $stmt = $db->prepare("
        SELECT 
            aa.id,
            aa.action_type,
            aa.target_type,
            aa.target_id,
            aa.timestamp,
            aa.description,
            u.username as admin_username,
            u.first_name,
            u.last_name
        FROM admin_actions aa
        INNER JOIN users u ON aa.admin_id = u.user_id
        WHERE aa.action_type IN ('approve', 'reject')
        ORDER BY aa.timestamp DESC
        LIMIT 10
    ");
    $stmt->execute();
    $recentActions = $stmt->fetchAll();
    
    // Get pending content by course
    $stmt = $db->prepare("
        SELECT 
            co.course_id,
            co.title as course_title,
            co.course_code,
            COUNT(c.id) as pending_count
        FROM courses co
        LEFT JOIN content c ON co.course_id = c.course_id AND c.is_approved = 0
        GROUP BY co.course_id
        HAVING pending_count > 0
        ORDER BY pending_count DESC
        LIMIT 10
    ");
    $stmt->execute();
    $pendingByCourse = $stmt->fetchAll();
    
    // Get top uploaders (most content uploaded)
    $stmt = $db->prepare("
        SELECT 
            u.user_id,
            u.username,
            u.email,
            u.first_name,
            u.last_name,
            COUNT(c.id) as total_uploads,
            SUM(CASE WHEN c.is_approved = 0 THEN 1 ELSE 0 END) as pending_count,
            SUM(CASE WHEN c.is_approved = 1 THEN 1 ELSE 0 END) as approved_count
        FROM users u
        INNER JOIN content c ON u.user_id = c.uploader_id
        GROUP BY u.user_id
        ORDER BY total_uploads DESC
        LIMIT 10
    ");
    $stmt->execute();
    $topUploaders = $stmt->fetchAll();
    
    // Get moderation activity for last 7 days
    $stmt = $db->prepare("
        SELECT 
            DATE(timestamp) as date,
            SUM(CASE WHEN action_type = 'approve' THEN 1 ELSE 0 END) as approvals,
            SUM(CASE WHEN action_type = 'reject' THEN 1 ELSE 0 END) as rejections
        FROM admin_actions
        WHERE action_type IN ('approve', 'reject')
        AND timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DATE(timestamp)
        ORDER BY date ASC
    ");
    $stmt->execute();
    $activityLast7Days = $stmt->fetchAll();
    
    // Format recent actions
    $formattedActions = array_map(function($action) {
        return [
            'id' => $action['id'],
            'actionType' => $action['action_type'],
            'targetType' => $action['target_type'],
            'targetId' => $action['target_id'],
            'timestamp' => $action['timestamp'],
            'timestampFormatted' => date('Y-m-d H:i', strtotime($action['timestamp'])),
            'description' => $action['description'],
            'admin' => [
                'username' => $action['admin_username'],
                'fullName' => $action['first_name'] . ' ' . $action['last_name']
            ]
        ];
    }, $recentActions);
    
    sendJsonResponse(true, 'Statistics retrieved successfully', [
        'stats' => [
            'total' => (int)$contentStats['total'],
            'pending' => (int)$contentStats['pending'],
            'approved' => (int)$contentStats['approved'],
            'rejected' => (int)$contentStats['rejected']
        ],
        'contentByType' => $contentByType,
        'pendingByCourse' => $pendingByCourse,
        'topUploaders' => $topUploaders,
        'recentActions' => $formattedActions,
        'activityLast7Days' => $activityLast7Days
    ]);
    
} catch (Exception $e) {
    error_log("Moderation Stats Exception: " . $e->getMessage());
    sendJsonResponse(false, 'An error occurred while retrieving statistics.');
}
?>

