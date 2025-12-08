<?php
/**
 * Cloudflare R2 Configuration
 * 
 * This file loads R2 credentials from environment variables or .env file
 * Credentials should NEVER be committed to version control
 */

// Define initialization constant
if (!defined('TSHAROK_INIT')) {
    define('TSHAROK_INIT', true);
}

/**
 * Load environment variables from .env file if it exists
 */
function loadEnvFile($filePath = __DIR__ . '/../.env') {
    if (!file_exists($filePath)) {
        return false;
    }
    
    $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        // Skip comments
        if (strpos(trim($line), '#') === 0) {
            continue;
        }
        
        // Parse KEY=VALUE
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);
            
            // Remove quotes if present
            $value = trim($value, '"\'');
            
            // Set environment variable if not already set
            if (!getenv($key)) {
                putenv("$key=$value");
                $_ENV[$key] = $value;
                $_SERVER[$key] = $value;
            }
        }
    }
    
    return true;
}

// Load .env file
loadEnvFile();

/**
 * R2 Configuration Class
 */
class R2Config {
    /**
     * Get R2 Account ID
     */
    public static function getAccountId() {
        return getenv('R2_ACCOUNT_ID') ?: '';
    }
    
    /**
     * Get R2 Access Key ID
     */
    public static function getAccessKeyId() {
        return getenv('R2_ACCESS_KEY_ID') ?: '';
    }
    
    /**
     * Get R2 Secret Access Key
     */
    public static function getSecretAccessKey() {
        return getenv('R2_SECRET_ACCESS_KEY') ?: '';
    }
    
    /**
     * Get R2 Bucket Name
     */
    public static function getBucketName() {
        return getenv('R2_BUCKET_NAME') ?: '';
    }
    
    /**
     * Get R2 Region (default: auto)
     */
    public static function getRegion() {
        return getenv('R2_REGION') ?: 'auto';
    }
    
    /**
     * Get R2 Endpoint URL
     */
    public static function getEndpoint() {
        $accountId = self::getAccountId();
        if (empty($accountId)) {
            return '';
        }
        return "https://{$accountId}.r2.cloudflarestorage.com";
    }
    
    /**
     * Get R2 Public URL (if configured)
     */
    public static function getPublicUrl() {
        return getenv('R2_PUBLIC_URL') ?: '';
    }
    
    /**
     * Check if R2 storage is enabled
     */
    public static function isEnabled() {
        $enabled = getenv('USE_R2_STORAGE');
        return $enabled === 'true' || $enabled === '1';
    }
    
    /**
     * Validate R2 configuration
     * 
     * @return array ['valid' => bool, 'errors' => array]
     */
    public static function validate() {
        $errors = [];
        
        if (empty(self::getAccountId())) {
            $errors[] = 'R2_ACCOUNT_ID is not set';
        }
        
        if (empty(self::getAccessKeyId())) {
            $errors[] = 'R2_ACCESS_KEY_ID is not set';
        }
        
        if (empty(self::getSecretAccessKey())) {
            $errors[] = 'R2_SECRET_ACCESS_KEY is not set';
        }
        
        if (empty(self::getBucketName())) {
            $errors[] = 'R2_BUCKET_NAME is not set';
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }
    
    /**
     * Get all configuration as array
     */
    public static function toArray() {
        return [
            'account_id' => self::getAccountId(),
            'access_key_id' => self::getAccessKeyId(),
            'secret_access_key' => '***' . substr(self::getSecretAccessKey(), -4), // Masked
            'bucket_name' => self::getBucketName(),
            'region' => self::getRegion(),
            'endpoint' => self::getEndpoint(),
            'public_url' => self::getPublicUrl(),
            'enabled' => self::isEnabled()
        ];
    }
}

?>
