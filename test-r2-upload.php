<?php
define('TSHAROK_INIT', true);
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "=== R2 Upload Test ===\n\n";

// Load dependencies
require 'vendor/autoload.php';
require 'config/r2-config.php';
require 'includes/r2-storage.php';

// Check if R2 is enabled
echo "1. Checking R2 configuration...\n";
echo "   R2 Enabled: " . (R2Config::isEnabled() ? 'YES' : 'NO') . "\n";
echo "   Account ID: " . R2Config::getAccountId() . "\n";
echo "   Bucket: " . R2Config::getBucketName() . "\n";
echo "   Public URL: " . R2Config::getPublicUrl() . "\n\n";

// Initialize R2 Storage
echo "2. Initializing R2 Storage...\n";
try {
    $r2 = new R2Storage();
    echo "   R2Storage created: YES\n";
    echo "   R2Storage enabled: " . ($r2->isEnabled() ? 'YES' : 'NO') . "\n\n";
    
    if ($r2->isEnabled()) {
        // Create test file
        echo "3. Creating test file...\n";
        $testFile = 'test-r2-upload.txt';
        file_put_contents($testFile, 'Hello from R2! Uploaded at ' . date('Y-m-d H:i:s'));
        echo "   Test file created: $testFile\n\n";
        
        // Upload to R2
        echo "4. Uploading to R2...\n";
        $result = $r2->uploadFile($testFile, 'test/upload-test.txt', [
            'test' => 'true',
            'timestamp' => time()
        ]);
        
        if ($result['success']) {
            echo "   ✓ Upload SUCCESS!\n";
            echo "   URL: " . $result['url'] . "\n";
            echo "   ETag: " . ($result['etag'] ?? 'N/A') . "\n\n";
            
            // List files
            echo "5. Listing files in bucket...\n";
            $files = $r2->listFiles('test/', 10);
            echo "   Found " . count($files) . " file(s)\n";
            foreach ($files as $file) {
                echo "   - " . $file['key'] . " (" . round($file['size']/1024, 2) . " KB)\n";
            }
        } else {
            echo "   ✗ Upload FAILED\n";
            echo "   Error: " . ($result['error'] ?? 'Unknown error') . "\n";
        }
        
        // Cleanup
        unlink($testFile);
        
    } else {
        echo "   R2 is NOT enabled - check .env file\n";
    }
    
} catch (Exception $e) {
    echo "   ERROR: " . $e->getMessage() . "\n";
    echo "   Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n=== Test Complete ===\n";
?>
