<?php
// Enhanced AWS SDK Autoloader with full GuzzleHttp support

// Load AWS functions
if (file_exists(__DIR__ . '/aws/Aws/functions.php')) {
    require __DIR__ . '/aws/Aws/functions.php';
}

// Load GuzzleHttp functions
if (file_exists(__DIR__ . '/guzzlehttp/src/functions.php')) {
    require __DIR__ . '/guzzlehttp/src/functions.php';
}

// Load GuzzleHttp Promises functions
if (file_exists(__DIR__ . '/guzzlehttp/promises/src/functions.php')) {
    require __DIR__ . '/guzzlehttp/promises/src/functions.php';
}

// Register autoloader for AWS, GuzzleHttp, and dependencies
spl_autoload_register(function($class) {
    // Handle Aws\ namespace
    if (strpos($class, 'Aws\\') === 0) {
        $file = __DIR__ . '/aws/' . str_replace('\\', '/', $class) . '.php';
        if (file_exists($file)) {
            require $file;
            return;
        }
    }
    
    // Handle GuzzleHttp\Promise\ namespace (promises package)
    if (strpos($class, 'GuzzleHttp\\Promise\\') === 0) {
        $file = __DIR__ . '/guzzlehttp/promises/src/' . str_replace('GuzzleHttp\\Promise\\', '', str_replace('\\', '/', $class)) . '.php';
        if (file_exists($file)) {
            require $file;
            return;
        }
    }
    
    // Handle GuzzleHttp\ namespace (main package)
    if (strpos($class, 'GuzzleHttp\\') === 0) {
        $file = __DIR__ . '/guzzlehttp/src/' . str_replace('GuzzleHttp\\', '', str_replace('\\', '/', $class)) . '.php';
        if (file_exists($file)) {
            require $file;
            return;
        }
    }
    
    // Handle Psr\Http\Message\ namespace (PSR-7)
    if (strpos($class, 'Psr\\Http\\Message\\') === 0) {
        $file = __DIR__ . '/guzzlehttp/src/Psr7/' . str_replace('Psr\\Http\\Message\\', '', str_replace('\\', '/', $class)) . '.php';
        if (file_exists($file)) {
            require $file;
            return;
        }
    }
});
