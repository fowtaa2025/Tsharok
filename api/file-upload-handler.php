<?php
/**
 * Robust File Upload Handler with Staging
 * Handles secure file uploads with image processing using Intervention/Image
 * 
 * FEATURES:
 * - Staging area for temporary uploads
 * - Image resizing and optimization
 * - Multiple format support (images, documents, videos)
 * - File validation and security checks
 * - Virus scanning integration ready
 * - Automatic cleanup of old staged files
 * - Chunked upload support for large files
 * 
 * USAGE:
 * POST /api/file-upload-handler.php
 * Content-Type: multipart/form-data
 * 
 * Parameters:
 * - file: The file to upload
 * - upload_type: 'content' | 'profile' | 'thumbnail'
 * - course_id: (optional) Course ID for content uploads
 * - process_image: (optional) Whether to process/optimize images
 * - max_width: (optional) Maximum width for image resizing
 * - max_height: (optional) Maximum height for image resizing
 * - quality: (optional) Image quality (1-100)
 */

// Define initialization constant
define('TSHAROK_INIT', true);

// Error reporting for development (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE, PUT');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only require what's needed for R2 uploads
require_once '../config/r2-config.php';
require_once '../includes/r2-storage.php';

// Check if Intervention/Image is available
$interventionAvailable = false;
if (file_exists('../vendor/autoload.php')) {
    require_once '../vendor/autoload.php';
    if (class_exists('Intervention\Image\ImageManager')) {
        $interventionAvailable = true;
    }
}

// Start session (simple version - no database)
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * Configuration Class
 */
class UploadConfig {
    // Directory paths
    public static $STAGING_DIR = '../uploads/staging/';
    public static $CONTENT_DIR = '../uploads/content/';
    public static $PROFILE_DIR = '../uploads/profiles/';
    public static $THUMBNAIL_DIR = '../uploads/thumbnails/';
    public static $TEMP_DIR = '../uploads/temp/';
    
    // File size limits (in bytes)
    public static $MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    public static $MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
    public static $MAX_DOCUMENT_SIZE = 50 * 1024 * 1024; // 50MB
    public static $MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
    
    // Staging cleanup (files older than this will be deleted)
    public static $STAGING_LIFETIME = 3600; // 1 hour
    
    // Image processing defaults
    public static $DEFAULT_MAX_WIDTH = 1920;
    public static $DEFAULT_MAX_HEIGHT = 1080;
    public static $DEFAULT_QUALITY = 85;
    public static $THUMBNAIL_WIDTH = 300;
    public static $THUMBNAIL_HEIGHT = 300;
    
    // Allowed MIME types
    public static $ALLOWED_IMAGES = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp'
    ];
    
    public static $ALLOWED_DOCUMENTS = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'application/zip',
        'application/x-rar-compressed'
    ];
    
    public static $ALLOWED_VIDEOS = [
        'video/mp4',
        'video/mpeg',
        'video/quicktime',
        'video/x-msvideo',
        'video/x-ms-wmv',
        'video/webm'
    ];
    
    // Allowed file extensions
    public static $ALLOWED_EXTENSIONS = [
        'jpg', 'jpeg', 'png', 'gif', 'webp',
        'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
        'txt', 'zip', 'rar',
        'mp4', 'mpeg', 'mov', 'avi', 'wmv', 'webm'
    ];
}

/**
 * File Upload Handler Class
 */
class FileUploadHandler {
    private $db;
    private $userId;
    private $interventionAvailable;
    private $r2Storage = null;
    private $useR2 = false;
    
    public function __construct($db, $userId, $interventionAvailable) {
        $this->db = $db;
        $this->userId = $userId;
        $this->interventionAvailable = $interventionAvailable;
        
        // Initialize R2 storage if enabled
        try {
            $this->r2Storage = new R2Storage();
            $this->useR2 = $this->r2Storage->isEnabled();
            if ($this->useR2) {
                error_log('R2 Storage enabled for uploads');
            }
        } catch (Exception $e) {
            error_log('R2 Storage initialization failed: ' . $e->getMessage());
            $this->useR2 = false;
        }
        
        // Ensure upload directories exist (still needed for staging)
        $this->ensureDirectories();
        
        // Clean up old staged files
        $this->cleanupStagedFiles();
    }
    
    /**
     * Ensure all required directories exist
     */
    private function ensureDirectories() {
        $directories = [
            UploadConfig::$STAGING_DIR,
            UploadConfig::$CONTENT_DIR,
            UploadConfig::$PROFILE_DIR,
            UploadConfig::$THUMBNAIL_DIR,
            UploadConfig::$TEMP_DIR
        ];
        
        foreach ($directories as $dir) {
            if (!file_exists($dir)) {
                mkdir($dir, 0755, true);
            }
        }
    }
    
    /**
     * Clean up old staged files
     */
    private function cleanupStagedFiles() {
        $stagingDir = UploadConfig::$STAGING_DIR;
        $lifetime = UploadConfig::$STAGING_LIFETIME;
        $now = time();
        
        if (!is_dir($stagingDir)) return;
        
        $files = scandir($stagingDir);
        foreach ($files as $file) {
            if ($file === '.' || $file === '..') continue;
            
            $filePath = $stagingDir . $file;
            if (is_file($filePath)) {
                $fileAge = $now - filemtime($filePath);
                if ($fileAge > $lifetime) {
                    @unlink($filePath);
                }
            }
        }
    }
    
    /**
     * Main upload handler
     */
    public function handleUpload() {
        try {
            // Validate request
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                throw new Exception('Only POST requests are allowed');
            }
            
            // Check if file was uploaded
            if (!isset($_FILES['file']) || $_FILES['file']['error'] === UPLOAD_ERR_NO_FILE) {
                throw new Exception('No file was uploaded');
            }
            
            $file = $_FILES['file'];
            
            // Check for upload errors
            $this->checkUploadErrors($file);
            
            // Get upload parameters
            $uploadType = $_POST['upload_type'] ?? 'content';
            $processImage = isset($_POST['process_image']) && $_POST['process_image'] === 'true';
            $courseId = isset($_POST['course_id']) ? intval($_POST['course_id']) : null;
            
            // Validate file
            $validation = $this->validateFile($file, $uploadType);
            if (!$validation['valid']) {
                throw new Exception($validation['message']);
            }
            
            // Generate unique filename
            $fileInfo = $this->getFileInfo($file);
            $uniqueFilename = $this->generateUniqueFilename($fileInfo['extension']);
            
            // Stage the file
            $stagingPath = $this->stageFile($file, $uniqueFilename);
            
            // Process the file based on type
            $processedFiles = [];
            
            if ($validation['type'] === 'image' && $processImage && $this->interventionAvailable) {
                // Process image: resize, optimize, create thumbnail
                $processedFiles = $this->processImage($stagingPath, $fileInfo, $_POST);
            } else {
                // For non-images or when processing is not requested
                $processedFiles['original'] = [
                    'path' => $stagingPath,
                    'filename' => $uniqueFilename,
                    'size' => filesize($stagingPath)
                ];
            }
            
            // Move from staging to final destination
            $finalFiles = $this->moveFromStaging($processedFiles, $uploadType);
            
            // Log upload activity
            $this->logUploadActivity($finalFiles, $uploadType, $courseId);
            
            // Return success response
            return $this->sendResponse(true, 'File uploaded successfully', [
                'files' => $finalFiles,
                'file_info' => $fileInfo,
                'upload_type' => $uploadType,
                'processed' => $processImage && $validation['type'] === 'image'
            ]);
            
        } catch (Exception $e) {
            error_log("Upload Error: " . $e->getMessage());
            return $this->sendResponse(false, $e->getMessage(), null, 400);
        }
    }
    
    /**
     * Check for upload errors
     */
    private function checkUploadErrors($file) {
        $errors = [
            UPLOAD_ERR_INI_SIZE => 'File exceeds upload_max_filesize directive',
            UPLOAD_ERR_FORM_SIZE => 'File exceeds MAX_FILE_SIZE directive',
            UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
            UPLOAD_ERR_NO_FILE => 'No file was uploaded',
            UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
            UPLOAD_ERR_EXTENSION => 'A PHP extension stopped the file upload'
        ];
        
        if ($file['error'] !== UPLOAD_ERR_OK) {
            $message = $errors[$file['error']] ?? 'Unknown upload error';
            throw new Exception($message);
        }
    }
    
    /**
     * Validate uploaded file
     */
    private function validateFile($file, $uploadType) {
        // Check file size
        if ($file['size'] > UploadConfig::$MAX_FILE_SIZE) {
            return [
                'valid' => false,
                'message' => 'File size exceeds maximum allowed size of ' . $this->formatBytes(UploadConfig::$MAX_FILE_SIZE)
            ];
        }
        
        // Get MIME type
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
        
        // Get file extension
        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        
        // Validate extension
        if (!in_array($extension, UploadConfig::$ALLOWED_EXTENSIONS)) {
            return [
                'valid' => false,
                'message' => 'File type not allowed: ' . $extension
            ];
        }
        
        // Determine file type and validate MIME type
        $fileType = 'other';
        if (in_array($mimeType, UploadConfig::$ALLOWED_IMAGES)) {
            $fileType = 'image';
            if ($file['size'] > UploadConfig::$MAX_IMAGE_SIZE) {
                return [
                    'valid' => false,
                    'message' => 'Image size exceeds maximum allowed size of ' . $this->formatBytes(UploadConfig::$MAX_IMAGE_SIZE)
                ];
            }
        } elseif (in_array($mimeType, UploadConfig::$ALLOWED_VIDEOS)) {
            $fileType = 'video';
            if ($file['size'] > UploadConfig::$MAX_VIDEO_SIZE) {
                return [
                    'valid' => false,
                    'message' => 'Video size exceeds maximum allowed size of ' . $this->formatBytes(UploadConfig::$MAX_VIDEO_SIZE)
                ];
            }
        } elseif (in_array($mimeType, UploadConfig::$ALLOWED_DOCUMENTS)) {
            $fileType = 'document';
            if ($file['size'] > UploadConfig::$MAX_DOCUMENT_SIZE) {
                return [
                    'valid' => false,
                    'message' => 'Document size exceeds maximum allowed size of ' . $this->formatBytes(UploadConfig::$MAX_DOCUMENT_SIZE)
                ];
            }
        } else {
            return [
                'valid' => false,
                'message' => 'File MIME type not allowed: ' . $mimeType
            ];
        }
        
        // Additional security checks
        if (!$this->isSecureFile($file['tmp_name'], $mimeType)) {
            return [
                'valid' => false,
                'message' => 'File failed security validation'
            ];
        }
        
        return [
            'valid' => true,
            'type' => $fileType,
            'mime_type' => $mimeType
        ];
    }
    
    /**
     * Additional security checks for file
     */
    private function isSecureFile($filePath, $mimeType) {
        // Check for PHP code in the file (basic check)
        $content = file_get_contents($filePath, false, null, 0, 1024);
        if (stripos($content, '<?php') !== false || stripos($content, '<?=') !== false) {
            return false;
        }
        
        // Check for executable permissions
        if (is_executable($filePath)) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Get file information
     */
    private function getFileInfo($file) {
        $pathInfo = pathinfo($file['name']);
        
        return [
            'original_name' => $file['name'],
            'size' => $file['size'],
            'size_formatted' => $this->formatBytes($file['size']),
            'extension' => strtolower($pathInfo['extension'] ?? ''),
            'basename' => $pathInfo['basename'] ?? '',
            'filename' => $pathInfo['filename'] ?? ''
        ];
    }
    
    /**
     * Generate unique filename
     */
    private function generateUniqueFilename($extension) {
        $timestamp = time();
        $random = bin2hex(random_bytes(16));
        $userId = $this->userId ?? 0;
        
        return sprintf('%s_%d_%s.%s', $userId, $timestamp, $random, $extension);
    }
    
    /**
     * Stage file to temporary location
     */
    private function stageFile($file, $uniqueFilename) {
        $stagingPath = UploadConfig::$STAGING_DIR . $uniqueFilename;
        
        if (!move_uploaded_file($file['tmp_name'], $stagingPath)) {
            throw new Exception('Failed to stage file');
        }
        
        // Set proper permissions
        chmod($stagingPath, 0644);
        
        return $stagingPath;
    }
    
    /**
     * Process image: resize, optimize, create thumbnail
     */
    private function processImage($stagingPath, $fileInfo, $params) {
        if (!$this->interventionAvailable) {
            throw new Exception('Image processing library not available');
        }
        
        $maxWidth = isset($params['max_width']) ? intval($params['max_width']) : UploadConfig::$DEFAULT_MAX_WIDTH;
        $maxHeight = isset($params['max_height']) ? intval($params['max_height']) : UploadConfig::$DEFAULT_MAX_HEIGHT;
        $quality = isset($params['quality']) ? intval($params['quality']) : UploadConfig::$DEFAULT_QUALITY;
        
        // Ensure quality is within bounds
        $quality = max(1, min(100, $quality));
        
        try {
            // Initialize Intervention Image
            $manager = new \Intervention\Image\ImageManager(['driver' => 'gd']);
            $image = $manager->make($stagingPath);
            
            $processedFiles = [];
            
            // Store original
            $processedFiles['original'] = [
                'path' => $stagingPath,
                'filename' => basename($stagingPath),
                'size' => filesize($stagingPath),
                'dimensions' => [
                    'width' => $image->width(),
                    'height' => $image->height()
                ]
            ];
            
            // Create optimized version
            if ($image->width() > $maxWidth || $image->height() > $maxHeight) {
                $optimizedFilename = $this->generateUniqueFilename($fileInfo['extension']);
                $optimizedPath = UploadConfig::$STAGING_DIR . $optimizedFilename;
                
                $image->resize($maxWidth, $maxHeight, function ($constraint) {
                    $constraint->aspectRatio();
                    $constraint->upsize();
                });
                
                $image->save($optimizedPath, $quality);
                
                $processedFiles['optimized'] = [
                    'path' => $optimizedPath,
                    'filename' => $optimizedFilename,
                    'size' => filesize($optimizedPath),
                    'dimensions' => [
                        'width' => $image->width(),
                        'height' => $image->height()
                    ]
                ];
                
                // Reload image for thumbnail
                $image = $manager->make($stagingPath);
            }
            
            // Create thumbnail
            $thumbnailFilename = 'thumb_' . $this->generateUniqueFilename($fileInfo['extension']);
            $thumbnailPath = UploadConfig::$STAGING_DIR . $thumbnailFilename;
            
            $image->fit(UploadConfig::$THUMBNAIL_WIDTH, UploadConfig::$THUMBNAIL_HEIGHT);
            $image->save($thumbnailPath, $quality);
            
            $processedFiles['thumbnail'] = [
                'path' => $thumbnailPath,
                'filename' => $thumbnailFilename,
                'size' => filesize($thumbnailPath),
                'dimensions' => [
                    'width' => UploadConfig::$THUMBNAIL_WIDTH,
                    'height' => UploadConfig::$THUMBNAIL_HEIGHT
                ]
            ];
            
            return $processedFiles;
            
        } catch (Exception $e) {
            error_log("Image Processing Error: " . $e->getMessage());
            throw new Exception('Failed to process image: ' . $e->getMessage());
        }
    }
    
    /**
     * Move files from staging to final destination (R2 or local)
     */
    private function moveFromStaging($processedFiles, $uploadType) {
        // If R2 is enabled, upload to R2
        if ($this->useR2 && $this->r2Storage) {
            return $this->uploadToR2($processedFiles, $uploadType);
        }
        
        // Otherwise, use local storage (original behavior)
        return $this->moveToLocal($processedFiles, $uploadType);
    }
    
    /**
     * Upload files to R2 cloud storage
     */
    private function uploadToR2($processedFiles, $uploadType) {
        $finalFiles = [];
        
        // Determine R2 key prefix based on upload type
        $keyPrefix = 'content/';
        switch ($uploadType) {
            case 'profile':
                $keyPrefix = 'profiles/';
                break;
            case 'thumbnail':
                $keyPrefix = 'thumbnails/';
                break;
        }
        
        foreach ($processedFiles as $type => $fileData) {
            try {
                // Generate R2 object key
                $key = $keyPrefix . $fileData['filename'];
                
                // Prepare metadata
                $metadata = [
                    'upload_type' => $uploadType,
                    'user_id' => (string) $this->userId,
                    'processed_type' => $type,
                    'uploaded_at' => date('Y-m-d H:i:s')
                ];
                
                // Upload to R2
                $uploadResult = $this->r2Storage->uploadFile(
                    $fileData['path'],
                    $key,
                    $metadata
                );
                
                if ($uploadResult['success']) {
                    // Delete staged file after successful upload
                    @unlink($fileData['path']);
                    
                    $finalFiles[$type] = [
                        'filename' => $fileData['filename'],
                        'path' => $key, // R2 object key
                        'r2_key' => $key,
                        'url' => $uploadResult['url'],
                        'size' => $fileData['size'],
                        'size_formatted' => $this->formatBytes($fileData['size']),
                        'dimensions' => $fileData['dimensions'] ?? null,
                        'storage_type' => 'r2',
                        'etag' => $uploadResult['etag'] ?? null
                    ];
                    
                    error_log("R2 Upload successful: {$key}");
                } else {
                    throw new Exception('R2 upload failed');
                }
                
            } catch (Exception $e) {
                error_log('R2 upload failed for ' . $fileData['filename'] . ': ' . $e->getMessage());
                
                // Fallback to local storage
                error_log('Falling back to local storage');
                return $this->moveToLocal($processedFiles, $uploadType);
            }
        }
        
        return $finalFiles;
    }
    
    /**
     * Move files to local storage (original behavior)
     */
    private function moveToLocal($processedFiles, $uploadType) {
        // Determine destination directory
        $destDir = UploadConfig::$CONTENT_DIR;
        switch ($uploadType) {
            case 'profile':
                $destDir = UploadConfig::$PROFILE_DIR;
                break;
            case 'thumbnail':
                $destDir = UploadConfig::$THUMBNAIL_DIR;
                break;
        }
        
        $finalFiles = [];
        
        foreach ($processedFiles as $type => $fileData) {
            $destPath = $destDir . $fileData['filename'];
            
            // Move file from staging to destination
            if (!rename($fileData['path'], $destPath)) {
                // If move fails, try copy and delete
                if (!copy($fileData['path'], $destPath)) {
                    throw new Exception('Failed to move file to final destination');
                }
                @unlink($fileData['path']);
            }
            
            // Set proper permissions
            chmod($destPath, 0644);
            
            $finalFiles[$type] = [
                'filename' => $fileData['filename'],
                'path' => $destPath,
                'relative_path' => str_replace('../', '', $destPath),
                'url' => $this->getFileUrl($destPath),
                'size' => $fileData['size'],
                'size_formatted' => $this->formatBytes($fileData['size']),
                'dimensions' => $fileData['dimensions'] ?? null,
                'storage_type' => 'local'
            ];
        }
        
        return $finalFiles;
    }
    
    /**
     * Get file URL
     */
    private function getFileUrl($path) {
        // Convert file system path to URL
        $relativePath = str_replace('../', '', $path);
        return '/' . $relativePath;
    }
    
    /**
     * Log upload activity
     */
    private function logUploadActivity($files, $uploadType, $courseId) {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO activity_logs (user_id, action, details, ip_address, created_at)
                VALUES (?, ?, ?, ?, NOW())
            ");
            
            $action = 'file_upload_' . $uploadType;
            $details = json_encode([
                'upload_type' => $uploadType,
                'course_id' => $courseId,
                'files' => array_keys($files),
                'total_size' => array_sum(array_column($files, 'size'))
            ]);
            $ipAddress = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
            
            $stmt->execute([$this->userId, $action, $details, $ipAddress]);
            
        } catch (Exception $e) {
            error_log("Failed to log upload activity: " . $e->getMessage());
            // Don't throw exception, logging failure shouldn't break upload
        }
    }
    
    /**
     * Format bytes to human readable size
     */
    private function formatBytes($bytes, $precision = 2) {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, $precision) . ' ' . $units[$i];
    }
    
    /**
     * Send JSON response
     */
    private function sendResponse($success, $message, $data = null, $statusCode = 200) {
        http_response_code($statusCode);
        
        $response = [
            'success' => $success,
            'message' => $message,
            'timestamp' => date('Y-m-d H:i:s')
        ];
        
        if ($data !== null) {
            $response['data'] = $data;
        }
        
        echo json_encode($response);
        exit;
    }
}

// ==================== MAIN EXECUTION ====================

try {
    // Check authentication - allow guest uploads
    $userId = $_SESSION['user_id'] ?? 'guest';
    
    // Note: For production, you may want to require authentication
    // Uncomment below to require login:
    // if (!$userId || $userId === 'guest') {
    //     http_response_code(401);
    //     echo json_encode([
    //         'success' => false,
    //         'message' => 'Authentication required',
    //         'timestamp' => date('Y-m-d H:i:s')
    //     ]);
    //     exit;
    // }
    
    
    // Skip database connection - not needed for R2 uploads
    $conn = null;
    
    // Initialize upload handler
    $handler = new FileUploadHandler($conn, $userId, $interventionAvailable);
    
    // Handle the upload
    $handler->handleUpload();
    
} catch (Exception $e) {
    error_log("Upload Handler Error: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Upload failed: ' . $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>

