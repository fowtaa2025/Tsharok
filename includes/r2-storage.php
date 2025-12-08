<?php
/**
 * Cloudflare R2 Storage Handler
 * 
 * Handles file operations with Cloudflare R2 using AWS S3 SDK
 * Requires: aws/aws-sdk-php package
 * 
 * FEATURES:
 * - Upload files to R2
 * - Generate signed URLs for private files
 * - Delete files from R2
 * - List files in bucket
 * - Check file existence
 */

// Define initialization constant
if (!defined('TSHAROK_INIT')) {
    define('TSHAROK_INIT', true);
}

require_once __DIR__ . '/../config/r2-config.php';

// Check if AWS SDK is available
$awsSdkAvailable = false;
if (file_exists(__DIR__ . '/../vendor/autoload.php')) {
    require_once __DIR__ . '/../vendor/autoload.php';
    if (class_exists('Aws\S3\S3Client')) {
        $awsSdkAvailable = true;
    }
}

/**
 * R2 Storage Handler Class
 */
class R2Storage {
    private $s3Client = null;
    private $bucketName;
    private $publicUrl;
    private $enabled;
    
    /**
     * Constructor
     * 
     * @throws Exception if R2 is enabled but SDK is not available or config is invalid
     */
    public function __construct() {
        global $awsSdkAvailable;
        
        $this->enabled = R2Config::isEnabled();
        $this->bucketName = R2Config::getBucketName();
        $this->publicUrl = R2Config::getPublicUrl();
        
        // Only initialize if R2 is enabled
        if (!$this->enabled) {
            return;
        }
        
        // Validate configuration
        $validation = R2Config::validate();
        if (!$validation['valid']) {
            throw new Exception('R2 configuration invalid: ' . implode(', ', $validation['errors']));
        }
        
        // Check if AWS SDK is available
        if (!$awsSdkAvailable) {
            throw new Exception('AWS SDK for PHP is not installed. Run: composer require aws/aws-sdk-php');
        }
        
        // Initialize S3 client for R2
        try {
            $this->s3Client = new \Aws\S3\S3Client([
                'version' => 'latest',
                'region' => R2Config::getRegion(),
                'endpoint' => R2Config::getEndpoint(),
                'credentials' => [
                    'key' => R2Config::getAccessKeyId(),
                    'secret' => R2Config::getSecretAccessKey(),
                ],
                'use_path_style_endpoint' => false,
            ]);
        } catch (Exception $e) {
            error_log('R2Storage: Failed to initialize S3 client: ' . $e->getMessage());
            throw new Exception('Failed to initialize R2 storage: ' . $e->getMessage());
        }
    }
    
    /**
     * Check if R2 storage is enabled and initialized
     */
    public function isEnabled() {
        return $this->enabled && $this->s3Client !== null;
    }
    
    /**
     * Upload a file to R2
     * 
     * @param string $localPath Local file path
     * @param string $key Object key (path in bucket)
     * @param array $metadata Optional metadata
     * @return array Upload result with URL
     * @throws Exception on upload failure
     */
    public function uploadFile($localPath, $key, $metadata = []) {
        if (!$this->isEnabled()) {
            throw new Exception('R2 storage is not enabled');
        }
        
        if (!file_exists($localPath)) {
            throw new Exception('Local file does not exist: ' . $localPath);
        }
        
        try {
            // Determine content type
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $contentType = finfo_file($finfo, $localPath);
            finfo_close($finfo);
            
            // Prepare upload parameters
            $params = [
                'Bucket' => $this->bucketName,
                'Key' => $key,
                'SourceFile' => $localPath,
                'ContentType' => $contentType,
            ];
            
            // Add metadata if provided
            if (!empty($metadata)) {
                $params['Metadata'] = $metadata;
            }
            
            // Upload to R2
            $result = $this->s3Client->putObject($params);
            
            // Get file URL
            $url = $this->getFileUrl($key);
            
            return [
                'success' => true,
                'key' => $key,
                'url' => $url,
                'etag' => $result['ETag'] ?? null,
                'version_id' => $result['VersionId'] ?? null
            ];
            
        } catch (Exception $e) {
            error_log('R2Storage: Upload failed for ' . $key . ': ' . $e->getMessage());
            throw new Exception('Failed to upload file to R2: ' . $e->getMessage());
        }
    }
    
    /**
     * Get file URL (public or signed)
     * 
     * @param string $key Object key
     * @param int $expiresIn Expiration time in seconds (0 for public URL)
     * @return string File URL
     */
    public function getFileUrl($key, $expiresIn = 0) {
        if (!$this->isEnabled()) {
            return '';
        }
        
        // If public URL is configured, use it
        if (!empty($this->publicUrl) && $expiresIn === 0) {
            return rtrim($this->publicUrl, '/') . '/' . ltrim($key, '/');
        }
        
        // Generate signed URL
        try {
            if ($expiresIn > 0) {
                $cmd = $this->s3Client->getCommand('GetObject', [
                    'Bucket' => $this->bucketName,
                    'Key' => $key
                ]);
                
                $request = $this->s3Client->createPresignedRequest($cmd, "+{$expiresIn} seconds");
                return (string) $request->getUri();
            } else {
                // For permanent access, use object URL
                return $this->s3Client->getObjectUrl($this->bucketName, $key);
            }
        } catch (Exception $e) {
            error_log('R2Storage: Failed to generate URL for ' . $key . ': ' . $e->getMessage());
            return '';
        }
    }
    
    /**
     * Delete a file from R2
     * 
     * @param string $key Object key
     * @return bool Success status
     */
    public function deleteFile($key) {
        if (!$this->isEnabled()) {
            return false;
        }
        
        try {
            $this->s3Client->deleteObject([
                'Bucket' => $this->bucketName,
                'Key' => $key
            ]);
            
            return true;
        } catch (Exception $e) {
            error_log('R2Storage: Delete failed for ' . $key . ': ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Check if file exists in R2
     * 
     * @param string $key Object key
     * @return bool True if file exists
     */
    public function fileExists($key) {
        if (!$this->isEnabled()) {
            return false;
        }
        
        try {
            $this->s3Client->headObject([
                'Bucket' => $this->bucketName,
                'Key' => $key
            ]);
            
            return true;
        } catch (Exception $e) {
            return false;
        }
    }
    
    /**
     * List files in bucket with optional prefix
     * 
     * @param string $prefix Optional prefix to filter files
     * @param int $maxKeys Maximum number of keys to return
     * @return array List of file keys
     */
    public function listFiles($prefix = '', $maxKeys = 1000) {
        if (!$this->isEnabled()) {
            return [];
        }
        
        try {
            $params = [
                'Bucket' => $this->bucketName,
                'MaxKeys' => $maxKeys
            ];
            
            if (!empty($prefix)) {
                $params['Prefix'] = $prefix;
            }
            
            $result = $this->s3Client->listObjectsV2($params);
            
            $files = [];
            if (isset($result['Contents'])) {
                foreach ($result['Contents'] as $object) {
                    $files[] = [
                        'key' => $object['Key'],
                        'size' => $object['Size'],
                        'last_modified' => $object['LastModified'],
                        'etag' => $object['ETag']
                    ];
                }
            }
            
            return $files;
        } catch (Exception $e) {
            error_log('R2Storage: List failed: ' . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Test R2 connection
     * 
     * @return bool True if connection successful
     */
    public function testConnection() {
        if (!$this->isEnabled()) {
            return false;
        }
        
        try {
            // Try to list objects (with limit 1)
            $this->s3Client->listObjectsV2([
                'Bucket' => $this->bucketName,
                'MaxKeys' => 1
            ]);
            
            return true;
        } catch (Exception $e) {
            error_log('R2Storage: Connection test failed: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get file metadata
     * 
     * @param string $key Object key
     * @return array|null File metadata or null if not found
     */
    public function getFileMetadata($key) {
        if (!$this->isEnabled()) {
            return null;
        }
        
        try {
            $result = $this->s3Client->headObject([
                'Bucket' => $this->bucketName,
                'Key' => $key
            ]);
            
            return [
                'content_type' => $result['ContentType'] ?? null,
                'content_length' => $result['ContentLength'] ?? 0,
                'last_modified' => $result['LastModified'] ?? null,
                'etag' => $result['ETag'] ?? null,
                'metadata' => $result['Metadata'] ?? []
            ];
        } catch (Exception $e) {
            error_log('R2Storage: Failed to get metadata for ' . $key . ': ' . $e->getMessage());
            return null;
        }
    }
}

?>
