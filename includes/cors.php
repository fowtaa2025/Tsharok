<?php
/**
 * CORS Handler
 * Centralized Cross-Origin Resource Sharing configuration
 * Tsharok LMS
 */

// Prevent direct access
if (!defined('TSHAROK_INIT')) {
    http_response_code(403);
    exit('Direct access not permitted');
}

/**
 * Set CORS headers
 * @param array $allowedOrigins List of allowed origins
 * @param bool $allowCredentials Whether to allow credentials
 */
function setCorsHeaders($allowedOrigins = [], $allowCredentials = true) {
    // Get the origin
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
    
    // Check if origin is allowed
    if (empty($allowedOrigins)) {
        // Load from config
        if (defined('CORS_ALLOWED_ORIGINS')) {
            $allowedOrigins = CORS_ALLOWED_ORIGINS;
        } else {
            $allowedOrigins = ['http://localhost:8000'];
        }
    }
    
    // Validate origin
    if (in_array($origin, $allowedOrigins)) {
        header("Access-Control-Allow-Origin: $origin");
    } else {
        // For development, allow localhost variations
        if (defined('APP_DEBUG') && APP_DEBUG && strpos($origin, 'localhost') !== false) {
            header("Access-Control-Allow-Origin: $origin");
        } else {
            // Default to first allowed origin or deny
            if (!empty($allowedOrigins)) {
                header("Access-Control-Allow-Origin: " . $allowedOrigins[0]);
            }
        }
    }
    
    // Set other CORS headers
    if ($allowCredentials) {
        header('Access-Control-Allow-Credentials: true');
    }
    
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CSRF-Token');
    header('Access-Control-Max-Age: 86400'); // Cache preflight for 24 hours
    
    // Handle preflight requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit();
    }
}

/**
 * Set standard API headers
 */
function setApiHeaders() {
    header('Content-Type: application/json; charset=UTF-8');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('X-XSS-Protection: 1; mode=block');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    
    // Remove server information
    header_remove('X-Powered-By');
    header_remove('Server');
}

/**
 * Initialize CORS and API headers
 */
function initializeApiResponse() {
    setCorsHeaders();
    setApiHeaders();
}

