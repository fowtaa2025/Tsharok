<?php
/**
 * Test R2 Connection
 * 
 * This script tests the connection to Cloudflare R2
 * Run: php tests/test-r2-connection.php
 */

// Define initialization constant
define('TSHAROK_INIT', true);

require_once __DIR__ . '/../config/r2-config.php';
require_once __DIR__ . '/../includes/r2-storage.php';

echo "========================================\n";
echo "Cloudflare R2 Connection Test\n";
echo "========================================\n\n";

// Check if .env file exists
if (!file_exists(__DIR__ . '/../.env')) {
    echo "❌ ERROR: .env file not found!\n";
    echo "   Please run setup-r2.bat to create your .env file.\n\n";
    exit(1);
}

echo "✓ .env file found\n\n";

// Display configuration (masked)
echo "Configuration:\n";
echo "─────────────────────────────────────\n";
$config = R2Config::toArray();
foreach ($config as $key => $value) {
    if ($key === 'enabled') {
        $value = $value ? 'Yes' : 'No';
    }
    echo sprintf("  %-20s: %s\n", ucwords(str_replace('_', ' ', $key)), $value);
}
echo "\n";

// Validate configuration
echo "Validating configuration...\n";
$validation = R2Config::validate();

if (!$validation['valid']) {
    echo "❌ Configuration validation failed:\n";
    foreach ($validation['errors'] as $error) {
        echo "   - $error\n";
    }
    echo "\n";
    echo "Please check your .env file and ensure all required values are set.\n\n";
    exit(1);
}

echo "✓ Configuration is valid\n\n";

// Check if R2 is enabled
if (!R2Config::isEnabled()) {
    echo "⚠ WARNING: R2 storage is currently DISABLED\n";
    echo "   Set USE_R2_STORAGE=true in .env to enable R2 storage.\n\n";
    echo "Test completed (R2 disabled)\n";
    exit(0);
}

// Test R2 connection
echo "Testing R2 connection...\n";

try {
    $r2 = new R2Storage();
    
    if (!$r2->isEnabled()) {
        echo "❌ R2 storage failed to initialize\n\n";
        exit(1);
    }
    
    echo "✓ R2 storage initialized\n";
    
    // Test connection by listing objects
    echo "  Attempting to list objects in bucket...\n";
    
    if ($r2->testConnection()) {
        echo "✓ Connection successful!\n\n";
        
        // Try to list some files
        echo "Listing files in bucket (max 10)...\n";
        $files = $r2->listFiles('', 10);
        
        if (empty($files)) {
            echo "  (Bucket is empty or no files found)\n";
        } else {
            echo "  Found " . count($files) . " file(s):\n";
            foreach ($files as $file) {
                $size = round($file['size'] / 1024, 2);
                echo "  - {$file['key']} ({$size} KB)\n";
            }
        }
        
        echo "\n";
        echo "========================================\n";
        echo "✓ R2 Connection Test PASSED\n";
        echo "========================================\n";
        echo "\nYour R2 storage is configured correctly!\n";
        echo "You can now upload files to Cloudflare R2.\n\n";
        
        exit(0);
        
    } else {
        echo "❌ Connection test failed\n";
        echo "   Please check your credentials and bucket name.\n\n";
        exit(1);
    }
    
} catch (Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n\n";
    
    // Check if it's an SDK issue
    if (strpos($e->getMessage(), 'AWS SDK') !== false) {
        echo "The AWS SDK for PHP is not installed.\n";
        echo "Please run: composer require aws/aws-sdk-php\n\n";
    }
    
    exit(1);
}

?>
