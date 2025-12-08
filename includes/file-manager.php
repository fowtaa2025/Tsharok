<?php
/**
 * File Management Functions for Content Moderation
 * Handles staging, approval, and rejection of uploaded files
 * Tsharok LMS
 */

// Prevent direct access
defined('TSHAROK_INIT') or die('Direct access not permitted');

/**
 * Get the staging directory path
 */
function getStagingDir() {
    return __DIR__ . '/../uploads/staging/';
}

/**
 * Get the approved content directory path
 */
function getApprovedDir() {
    return __DIR__ . '/../uploads/content/';
}

/**
 * Get the rejected directory path
 */
function getRejectedDir() {
    return __DIR__ . '/../uploads/rejected/';
}

/**
 * Ensure required directories exist
 */
function ensureDirectoriesExist() {
    $dirs = [
        getStagingDir(),
        getApprovedDir(),
        getRejectedDir()
    ];
    
    foreach ($dirs as $dir) {
        if (!file_exists($dir)) {
            mkdir($dir, 0755, true);
        }
    }
}

/**
 * Move file from staging to approved
 * 
 * @param string $filename The filename to move
 * @return bool Success status
 */
function moveToApproved($filename) {
    ensureDirectoriesExist();
    
    $stagingPath = getStagingDir() . $filename;
    $approvedPath = getApprovedDir() . $filename;
    
    // Check if file exists in staging
    if (!file_exists($stagingPath)) {
        error_log("File not found in staging: {$stagingPath}");
        return false;
    }
    
    // If file already exists in approved, create unique name
    if (file_exists($approvedPath)) {
        $pathInfo = pathinfo($filename);
        $newFilename = $pathInfo['filename'] . '_' . time() . '.' . $pathInfo['extension'];
        $approvedPath = getApprovedDir() . $newFilename;
    }
    
    // Move the file
    if (rename($stagingPath, $approvedPath)) {
        error_log("File moved to approved: {$filename}");
        return true;
    }
    
    error_log("Failed to move file to approved: {$filename}");
    return false;
}

/**
 * Move file from staging to rejected
 * 
 * @param string $filename The filename to move
 * @return bool Success status
 */
function moveToRejected($filename) {
    ensureDirectoriesExist();
    
    $stagingPath = getStagingDir() . $filename;
    $rejectedPath = getRejectedDir() . $filename;
    
    // Check if file exists in staging
    if (!file_exists($stagingPath)) {
        error_log("File not found in staging: {$stagingPath}");
        return false;
    }
    
    // If file already exists in rejected, create unique name
    if (file_exists($rejectedPath)) {
        $pathInfo = pathinfo($filename);
        $newFilename = $pathInfo['filename'] . '_rejected_' . time() . '.' . $pathInfo['extension'];
        $rejectedPath = getRejectedDir() . $newFilename;
    }
    
    // Move the file
    if (rename($stagingPath, $rejectedPath)) {
        error_log("File moved to rejected: {$filename}");
        return true;
    }
    
    error_log("Failed to move file to rejected: {$filename}");
    return false;
}

/**
 * Delete file from staging (used after approval/rejection if needed)
 * 
 * @param string $filename The filename to delete
 * @return bool Success status
 */
function deleteFromStaging($filename) {
    $stagingPath = getStagingDir() . $filename;
    
    if (file_exists($stagingPath)) {
        if (unlink($stagingPath)) {
            error_log("File deleted from staging: {$filename}");
            return true;
        }
    }
    
    error_log("Failed to delete file from staging: {$filename}");
    return false;
}

/**
 * Get file information
 * 
 * @param string $filepath Full path to file
 * @return array File information
 */
function getFileInfo($filepath) {
    if (!file_exists($filepath)) {
        return null;
    }
    
    return [
        'exists' => true,
        'size' => filesize($filepath),
        'modified' => filemtime($filepath),
        'mime_type' => mime_content_type($filepath),
        'is_readable' => is_readable($filepath),
        'is_writable' => is_writable($filepath)
    ];
}

/**
 * Get file URL relative to uploads directory
 * 
 * @param string $filename The filename
 * @param string $directory Directory type: 'staging', 'approved', 'rejected'
 * @return string File URL
 */
function getFileUrl($filename, $directory = 'approved') {
    $baseUrl = '/uploads/';
    
    switch ($directory) {
        case 'staging':
            return $baseUrl . 'staging/' . $filename;
        case 'rejected':
            return $baseUrl . 'rejected/' . $filename;
        case 'approved':
        default:
            return $baseUrl . 'content/' . $filename;
    }
}

/**
 * Clean old rejected files (older than specified days)
 * 
 * @param int $days Number of days to keep rejected files
 * @return int Number of files deleted
 */
function cleanOldRejectedFiles($days = 30) {
    $rejectedDir = getRejectedDir();
    $deletedCount = 0;
    $cutoffTime = time() - ($days * 24 * 60 * 60);
    
    if (!is_dir($rejectedDir)) {
        return 0;
    }
    
    $files = scandir($rejectedDir);
    
    foreach ($files as $file) {
        if ($file === '.' || $file === '..') {
            continue;
        }
        
        $filepath = $rejectedDir . $file;
        
        if (is_file($filepath) && filemtime($filepath) < $cutoffTime) {
            if (unlink($filepath)) {
                $deletedCount++;
                error_log("Cleaned old rejected file: {$file}");
            }
        }
    }
    
    return $deletedCount;
}

/**
 * Validate file type and size
 * 
 * @param string $filepath Path to file
 * @param array $allowedTypes Allowed MIME types
 * @param int $maxSize Maximum file size in bytes
 * @return array Validation result
 */
function validateFile($filepath, $allowedTypes = [], $maxSize = 52428800) { // 50MB default
    if (!file_exists($filepath)) {
        return [
            'valid' => false,
            'error' => 'File does not exist'
        ];
    }
    
    $fileSize = filesize($filepath);
    $mimeType = mime_content_type($filepath);
    
    // Check file size
    if ($fileSize > $maxSize) {
        return [
            'valid' => false,
            'error' => 'File size exceeds maximum allowed size'
        ];
    }
    
    // Check MIME type if specified
    if (!empty($allowedTypes) && !in_array($mimeType, $allowedTypes)) {
        return [
            'valid' => false,
            'error' => 'File type not allowed'
        ];
    }
    
    return [
        'valid' => true,
        'size' => $fileSize,
        'mime_type' => $mimeType
    ];
}

/**
 * Generate secure filename
 * 
 * @param string $originalFilename Original filename
 * @param int $userId User ID of uploader
 * @return string Secure filename
 */
function generateSecureFilename($originalFilename, $userId = 0) {
    $pathInfo = pathinfo($originalFilename);
    $extension = isset($pathInfo['extension']) ? strtolower($pathInfo['extension']) : '';
    $basename = isset($pathInfo['filename']) ? $pathInfo['filename'] : 'file';
    
    // Remove special characters
    $basename = preg_replace('/[^a-zA-Z0-9_-]/', '_', $basename);
    $basename = substr($basename, 0, 50); // Limit length
    
    // Generate unique filename
    $uniqueId = uniqid();
    $timestamp = time();
    
    return "{$basename}_{$userId}_{$timestamp}_{$uniqueId}.{$extension}";
}

/**
 * Get storage statistics
 * 
 * @return array Storage statistics
 */
function getStorageStats() {
    $stats = [
        'staging' => [
            'count' => 0,
            'size' => 0,
            'path' => getStagingDir()
        ],
        'approved' => [
            'count' => 0,
            'size' => 0,
            'path' => getApprovedDir()
        ],
        'rejected' => [
            'count' => 0,
            'size' => 0,
            'path' => getRejectedDir()
        ]
    ];
    
    foreach ($stats as $key => $data) {
        if (is_dir($data['path'])) {
            $files = scandir($data['path']);
            foreach ($files as $file) {
                if ($file === '.' || $file === '..') continue;
                $filepath = $data['path'] . $file;
                if (is_file($filepath)) {
                    $stats[$key]['count']++;
                    $stats[$key]['size'] += filesize($filepath);
                }
            }
        }
    }
    
    return $stats;
}

/**
 * Copy file to backup location before moving
 * 
 * @param string $filename Filename
 * @param string $sourceDir Source directory
 * @return bool Success status
 */
function backupFile($filename, $sourceDir = 'staging') {
    $backupDir = __DIR__ . '/../uploads/backup/';
    
    if (!file_exists($backupDir)) {
        mkdir($backupDir, 0755, true);
    }
    
    $sourcePath = null;
    switch ($sourceDir) {
        case 'staging':
            $sourcePath = getStagingDir() . $filename;
            break;
        case 'approved':
            $sourcePath = getApprovedDir() . $filename;
            break;
        case 'rejected':
            $sourcePath = getRejectedDir() . $filename;
            break;
    }
    
    if (!$sourcePath || !file_exists($sourcePath)) {
        return false;
    }
    
    $backupPath = $backupDir . date('Y-m-d_His_') . $filename;
    
    return copy($sourcePath, $backupPath);
}
?>

