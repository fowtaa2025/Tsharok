<?php
/**
 * Database Cleanup and Maintenance Scripts
 * Tsharok LMS - Run these to clean up old data
 * 
 * Usage: php cleanup-scripts.php [action]
 * Actions: sessions, verifications, resets, logs, all
 */

define('TSHAROK_INIT', true);

// Load configurations
require_once __DIR__ . '/config/app.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/includes/error-handler.php';

// Check if running from CLI
if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    exit('This script can only be run from command line');
}

// Get action from command line
$action = isset($argv[1]) ? $argv[1] : 'help';

try {
    $db = getDB();
    
    switch ($action) {
        case 'sessions':
            cleanupExpiredSessions($db);
            break;
            
        case 'verifications':
            cleanupExpiredVerifications($db);
            break;
            
        case 'resets':
            cleanupExpiredPasswordResets($db);
            break;
            
        case 'logs':
            cleanupOldLogs();
            break;
            
        case 'inactive':
            cleanupInactiveUsers($db);
            break;
            
        case 'all':
            echo "Running all cleanup tasks...\n\n";
            cleanupExpiredSessions($db);
            cleanupExpiredVerifications($db);
            cleanupExpiredPasswordResets($db);
            cleanupOldLogs();
            cleanupInactiveUsers($db);
            echo "\n✓ All cleanup tasks completed!\n";
            break;
            
        case 'help':
        default:
            showHelp();
            break;
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}

/**
 * Clean up expired sessions
 */
function cleanupExpiredSessions($db) {
    echo "Cleaning up expired sessions...\n";
    
    $stmt = $db->prepare("
        DELETE FROM sessions 
        WHERE expires_at < NOW()
        OR (is_active = 0 AND updated_at < DATE_SUB(NOW(), INTERVAL 7 DAY))
    ");
    
    $stmt->execute();
    $count = $stmt->rowCount();
    
    echo "✓ Removed $count expired session(s)\n";
}

/**
 * Clean up expired email verifications
 */
function cleanupExpiredVerifications($db) {
    echo "Cleaning up expired email verifications...\n";
    
    $stmt = $db->prepare("
        DELETE FROM email_verifications 
        WHERE expires_at < NOW()
        AND verified_at IS NULL
    ");
    
    $stmt->execute();
    $count = $stmt->rowCount();
    
    echo "✓ Removed $count expired verification(s)\n";
}

/**
 * Clean up expired password resets
 */
function cleanupExpiredPasswordResets($db) {
    echo "Cleaning up expired password resets...\n";
    
    $stmt = $db->prepare("
        DELETE FROM password_resets 
        WHERE expires_at < NOW()
        OR used_at IS NOT NULL
    ");
    
    $stmt->execute();
    $count = $stmt->rowCount();
    
    echo "✓ Removed $count expired password reset(s)\n";
}

/**
 * Clean up old log files
 */
function cleanupOldLogs() {
    echo "Cleaning up old log files...\n";
    
    if (!defined('LOG_PATH') || !file_exists(LOG_PATH)) {
        echo "⚠ Log directory not found\n";
        return;
    }
    
    $files = glob(LOG_PATH . '*.log');
    $cutoff = strtotime('-30 days');
    $count = 0;
    
    foreach ($files as $file) {
        if (filemtime($file) < $cutoff) {
            unlink($file);
            $count++;
        }
    }
    
    echo "✓ Removed $count old log file(s)\n";
}

/**
 * Clean up inactive unverified users
 */
function cleanupInactiveUsers($db) {
    echo "Cleaning up inactive unverified users...\n";
    
    // Delete unverified accounts older than 30 days
    $stmt = $db->prepare("
        DELETE FROM users 
        WHERE is_active = 0
        AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
    ");
    
    $stmt->execute();
    $count = $stmt->rowCount();
    
    echo "✓ Removed $count inactive unverified user(s)\n";
}

/**
 * Show help message
 */
function showHelp() {
    echo "Tsharok LMS - Database Cleanup Scripts\n\n";
    echo "Usage: php cleanup-scripts.php [action]\n\n";
    echo "Available actions:\n";
    echo "  sessions       - Clean up expired sessions\n";
    echo "  verifications  - Clean up expired email verifications\n";
    echo "  resets         - Clean up expired password resets\n";
    echo "  logs           - Clean up old log files (older than 30 days)\n";
    echo "  inactive       - Clean up inactive unverified users (older than 30 days)\n";
    echo "  all            - Run all cleanup tasks\n";
    echo "  help           - Show this help message\n\n";
    echo "Examples:\n";
    echo "  php cleanup-scripts.php sessions\n";
    echo "  php cleanup-scripts.php all\n\n";
}

