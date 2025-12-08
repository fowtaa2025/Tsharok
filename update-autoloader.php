<?php
// Enhanced AWS SDK Autoloader with GuzzleHttp support

// Load AWS functions
if (file_exists(__DIR__ . '/aws/Aws/functions.php')) {
    require __DIR__ . '/aws/Aws/functions.php';
}

// Register autoloader for AWS and GuzzleHttp
spl_autoload_register(function($class) {
    // Handle Aws\ namespace
    if (strpos($class, 'Aws\\') === 0) {
        $file = __DIR__ . '/aws/' . str_replace('\\', '/', $class) . '.php';
        if (file_exists($file)) {
            require $file;
            return;
        }
    }
    
    // Handle GuzzleHttp\ namespace (main package)
    if (strpos($class, 'GuzzleHttp\\') === 0) {
        // Try in guzzlehttp/src first
        $file = __DIR__ . '/guzzlehttp/src/' . str_replace('GuzzleHttp\\', '', str_replace('\\', '/', $class)) . '.php';
        if (file_exists($file)) {
            require $file;
            return;
        }
        
        // Try direct path
        $file = __DIR__ . '/guzzlehttp/' . str_replace('\\', '/', $class) . '.php';
        if (file_exists($file)) {
            require $file;
            return;
        }
    }
    
    // Handle Psr\Http\Message\ namespace (PSR-7)
    if (strpos($class, 'Psr\\Http\\Message\\') === 0) {
        // GuzzleHttp includes PSR-7 interfaces
        $file = __DIR__ . '/guzzlehttp/src/Psr7/' . str_replace('Psr\\Http\\Message\\', '', str_replace('\\', '/', $class)) . '.php';
        if (file_exists($file)) {
            require $file;
            return;
        }
    }
});

// Load GuzzleHttp functions if they exist
if (file_exists(__DIR__ . '/guzzlehttp/src/functions.php')) {
    require __DIR__ . '/guzzlehttp/src/functions.php';
}

// Load other dependencies if they exist
$dependencies = [
    __DIR__ . '/intervention/image/src/Intervention/Image/ImageServiceProvider.php',
    __DIR__ . '/phpmailer/phpmailer/src/PHPMailer.php',
    __DIR__ . '/league/commonmark/src/CommonMarkConverter.php'
];

foreach ($dependencies as $dep) {
    if (file_exists($dep)) {
        require_once $dep;
    }
}
