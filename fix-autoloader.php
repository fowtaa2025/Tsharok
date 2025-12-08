<?php
// Complete AWS SDK Autoloader with all GuzzleHttp dependencies

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

// Register comprehensive autoloader
spl_autoload_register(function($class) {
    // Handle Aws\ namespace
    if (strpos($class, 'Aws\\') === 0) {
        $file = __DIR__ . '/aws/' . str_replace('\\', '/', $class) . '.php';
        if (file_exists($file)) {
            require $file;
            return;
        }
    }
    
    // Handle GuzzleHttp\Promise\ namespace - THIS IS CRITICAL
    // The promises package uses this namespace
    if (strpos($class, 'GuzzleHttp\\Promise\\') === 0) {
        // Extract just the class name after GuzzleHttp\Promise\
        $className = str_replace('GuzzleHttp\\Promise\\', '', $class);
        $file = __DIR__ . '/guzzlehttp/promises/src/' . $className . '.php';
        if (file_exists($file)) {
            require $file;
            return;
        }
    }
    
    // Handle main GuzzleHttp\ namespace (but not Promise subnamespace)
    if (strpos($class, 'GuzzleHttp\\') === 0 && strpos($class, 'GuzzleHttp\\Promise\\') !== 0) {
        $className = str_replace('GuzzleHttp\\', '', $class);
        $file = __DIR__ . '/guzzlehttp/src/' . str_replace('\\', '/', $className) . '.php';
        if (file_exists($file)) {
            require $file;
            return;
        }
    }
    
    // Handle GuzzleHttp\Psr7\ namespace (PSR-7 package)
    if (strpos($class, 'GuzzleHttp\\Psr7\\') === 0) {
        $className = str_replace('GuzzleHttp\\Psr7\\', '', $class);
        $file = __DIR__ . '/guzzlehttp/psr7/src/' . $className . '.php';
        if (file_exists($file)) {
            require $file;
            return;
        }
    }

    
    // Handle Psr\Http\Message\ namespace
    if (strpos($class, 'Psr\\Http\\Message\\') === 0) {
        $className = str_replace('Psr\\Http\\Message\\', '', $class);
        $file = __DIR__ . '/guzzlehttp/src/Psr7/' . $className . '.php';
        if (file_exists($file)) {
            require $file;
            return;
        }
    }
});
