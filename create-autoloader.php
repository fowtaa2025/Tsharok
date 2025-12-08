<?php
// Create vendor/autoload.php
$autoloaderContent = <<<'PHP'
<?php
// AWS SDK Autoloader
if (file_exists(__DIR__ . '/aws/Aws/functions.php')) {
    require __DIR__ . '/aws/Aws/functions.php';
}

spl_autoload_register(function($class) {
    if (strpos($class, 'Aws\\') === 0) {
        $file = __DIR__ . '/aws/' . str_replace('\\', '/', $class) . '.php';
        if (file_exists($file)) {
            require $file;
        }
    }
});
PHP;

file_put_contents('vendor/autoload.php', $autoloaderContent);
echo "✓ Created vendor/autoload.php\n";

// Test if it works
require 'vendor/autoload.php';
if (class_exists('Aws\S3\S3Client')) {
    echo "✓ AWS SDK loaded successfully!\n";
} else {
    echo "✗ AWS SDK not loaded\n";
}
?>
