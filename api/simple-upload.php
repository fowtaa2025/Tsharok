<?php
/**
 * Minimal R2 File Upload Handler
 * No database, no sessions, just R2 upload
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);

// CORS headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only handle POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

try {
    // Load R2 dependencies
    require_once __DIR__ . '/../config/r2-config.php';
    require_once __DIR__ . '/../includes/r2-storage.php';
    
    // Check if file was uploaded
    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('No file uploaded or upload error');
    }
    
    $file = $_FILES['file'];
    
    // Generate unique filename
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid() . '-' . time() . '.' . $extension;
    $key = 'content/' . $filename;
    
    // Initialize R2
    $r2 = new R2Storage();
    
    if (!$r2->isEnabled()) {
        throw new Exception('R2 storage is not enabled');
    }
    
    // Upload to R2
    $result = $r2->uploadFile($file['tmp_name'], $key, [
        'original_name' => $file['name'],
        'uploaded_at' => date('Y-m-d H:i:s')
    ]);
    
    // Success response
    echo json_encode([
        'success' => true,
        'message' => 'File uploaded successfully',
        'files' => [
            'original' => [
                'filename' => $filename,
                'r2_key' => $key,
                'url' => $result['url'],
                'size' => $file['size']
            ]
        ],
        'file_info' => [
            'original_name' => $file['name'],
            'size' => $file['size'],
            'type' => $file['type']
        ]
    ]);
    
} catch (Exception $e) {
    error_log('Upload error: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'error' => $e->getMessage()
    ]);
}
?>
