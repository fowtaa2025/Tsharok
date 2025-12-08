<?php
/**
 * Reject Content API
 * Rejects pending content and moves file from staging to rejected
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
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Include required files
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/session.php';
require_once __DIR__ . '/../includes/file-manager.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(false, 'Invalid request method. Only POST allowed.');
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
    $adminId = $_SESSION['user_id'] ?? null;
    if (!$adminId || !hasRole('admin', $db)) {
        sendJsonResponse(false, 'Access denied. Admin privileges required.', null, 403);
    }
    
    // Get POST data
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        sendJsonResponse(false, 'No data received.');
    }
    
    // Validate content ID(s)
    $contentIds = [];
    if (isset($data['contentId'])) {
        $contentIds = [$data['contentId']];
    } elseif (isset($data['contentIds']) && is_array($data['contentIds'])) {
        $contentIds = $data['contentIds'];
    } else {
        sendJsonResponse(false, 'Content ID(s) required.');
    }
    
    // Get rejection reason and comments
    $reason = $data['reason'] ?? 'No reason provided';
    $comments = $data['comments'] ?? '';
    
    $successCount = 0;
    $failCount = 0;
    $errors = [];
    
    // Begin transaction
    $db->beginTransaction();
    
    try {
        foreach ($contentIds as $contentId) {
            // Get content details
            $stmt = $db->prepare("
                SELECT id, title, file_url, is_approved, uploader_id, course_id
                FROM content
                WHERE id = ?
            ");
            $stmt->execute([$contentId]);
            $content = $stmt->fetch();
            
            if (!$content) {
                $failCount++;
                $errors[] = "Content ID {$contentId} not found";
                continue;
            }
            
            if ($content['is_approved'] == -1) {
                $failCount++;
                $errors[] = "Content ID {$contentId} is already rejected";
                continue;
            }
            
            // Extract filename from file_url
            $filename = basename($content['file_url']);
            
            // Move file from staging to rejected (if file exists)
            if ($filename && $filename !== '') {
                $moved = moveToRejected($filename);
                
                if ($moved) {
                    // Update file URL to point to rejected directory
                    $newFileUrl = '/uploads/rejected/' . $filename;
                } else {
                    // File might not exist in staging, but continue with rejection
                    $newFileUrl = $content['file_url'];
                    error_log("Warning: Could not move file for content ID {$contentId}, but continuing with rejection");
                }
            } else {
                $newFileUrl = $content['file_url'];
            }
            
            // Update content status to rejected (-1)
            $updateStmt = $db->prepare("
                UPDATE content
                SET is_approved = -1,
                    file_url = ?,
                    updated_at = NOW()
                WHERE id = ?
            ");
            $updateStmt->execute([$newFileUrl, $contentId]);
            
            // Log admin action with rejection reason
            $description = "Rejected content: {$content['title']}. Reason: {$reason}";
            if ($comments) {
                $description .= ". Comments: {$comments}";
            }
            
            $actionStmt = $db->prepare("
                INSERT INTO admin_actions (
                    admin_id,
                    action_type,
                    target_type,
                    target_id,
                    description
                ) VALUES (?, 'reject', 'content', ?, ?)
            ");
            $actionStmt->execute([
                $adminId,
                $contentId,
                $description
            ]);
            
            // Log activity
            logActivity($adminId, 'content_rejected', "Admin rejected content ID: {$contentId} - {$content['title']}", $db);
            
            // Optionally notify uploader (you can implement email notification here)
            // notifyUploader($content['uploader_id'], $content['title'], $reason, $comments);
            
            $successCount++;
        }
        
        // Commit transaction
        $db->commit();
        
        $message = "Successfully rejected {$successCount} content item(s)";
        if ($failCount > 0) {
            $message .= " ({$failCount} failed)";
        }
        
        sendJsonResponse(true, $message, [
            'successCount' => $successCount,
            'failCount' => $failCount,
            'errors' => $errors
        ]);
        
    } catch (Exception $e) {
        // Rollback transaction on error
        $db->rollBack();
        throw $e;
    }
    
} catch (Exception $e) {
    error_log("Reject Content Exception: " . $e->getMessage());
    sendJsonResponse(false, 'An error occurred while rejecting content: ' . $e->getMessage());
}
?>

