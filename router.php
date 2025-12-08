<?php
/**
 * Router for PHP Built-in Server
 * This file routes requests to the appropriate directories
 */

// Get the requested URI
$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

// Log for debugging (optional)
// error_log("Request URI: " . $uri);

// Handle API requests - /api/*
if (strpos($uri, '/api/') === 0) {
    $file = __DIR__ . $uri;
    if (file_exists($file) && is_file($file)) {
        // Let PHP handle the API file
        return false;
    }
    // API endpoint not found
    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'API endpoint not found: ' . $uri]);
    exit;
}

// Handle root path - redirect to index.html in public
if ($uri === '/' || $uri === '') {
    $file = __DIR__ . '/public/index.html';
    if (file_exists($file)) {
        // Change working directory and serve the file
        chdir(__DIR__ . '/public');
        $_SERVER['SCRIPT_FILENAME'] = $file;
        include $file;
        exit;
    }
}

// Handle requests to public directory files
$publicFile = __DIR__ . '/public' . $uri;

// Check if file exists in public directory
if (file_exists($publicFile)) {
    if (is_file($publicFile)) {
        // Serve the static file - let PHP handle it naturally
        $extension = pathinfo($publicFile, PATHINFO_EXTENSION);
        
        // Set appropriate content type
        $contentTypes = [
            'html' => 'text/html',
            'css' => 'text/css',
            'js' => 'application/javascript',
            'json' => 'application/json',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'gif' => 'image/gif',
            'svg' => 'image/svg+xml',
            'ico' => 'image/x-icon',
        ];
        
        if (isset($contentTypes[$extension])) {
            header('Content-Type: ' . $contentTypes[$extension]);
        }
        
        readfile($publicFile);
        exit;
    }
    
    if (is_dir($publicFile)) {
        // Try to serve index.html from directory
        $indexFile = $publicFile . '/index.html';
        if (file_exists($indexFile)) {
            header('Content-Type: text/html');
            readfile($indexFile);
            exit;
        }
    }
}

// File not found - return 404
http_response_code(404);
$notFoundFile = __DIR__ . '/public/404.html';
if (file_exists($notFoundFile)) {
    include $notFoundFile;
} else {
    echo '<h1>404 - Page Not Found</h1>';
    echo '<p>The requested URL ' . htmlspecialchars($uri) . ' was not found on this server.</p>';
}
exit;

