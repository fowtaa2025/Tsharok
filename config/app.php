<?php
/**
 * Application Configuration
 * Tsharok LMS - Central configuration file
 */

// Prevent direct access
if (!defined('TSHAROK_INIT')) {
    http_response_code(403);
    exit('Direct access not permitted');
}

// Environment configuration
define('APP_ENV', getenv('APP_ENV') ?: 'production'); // production, development, testing
define('APP_DEBUG', APP_ENV === 'development');
define('APP_NAME', 'Tsharok LMS');
define('APP_URL', getenv('APP_URL') ?: 'http://localhost:8000');

// Security configuration
define('APP_KEY', getenv('APP_KEY') ?: 'base64:your-secret-key-here-change-this');
define('SESSION_LIFETIME', 7200); // 2 hours in seconds
define('SESSION_SECURE', false); // Set to true for HTTPS only
define('SESSION_HTTPONLY', true);
define('SESSION_SAMESITE', 'Lax'); // Lax, Strict, or None

// CORS configuration
define('CORS_ALLOWED_ORIGINS', [
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    // Add your production domains here
]);
define('CORS_ALLOW_CREDENTIALS', true);

// Rate limiting configuration
define('RATE_LIMIT_LOGIN', 50); // Max attempts (increased for development)
define('RATE_LIMIT_LOGIN_WINDOW', 900); // 15 minutes
define('RATE_LIMIT_REGISTER', 30); // Increased for development
define('RATE_LIMIT_REGISTER_WINDOW', 3600); // 1 hour
define('RATE_LIMIT_API', 60); // General API calls per minute
define('RATE_LIMIT_API_WINDOW', 60);

// File upload configuration
define('MAX_FILE_SIZE', 10 * 1024 * 1024); // 10MB
define('ALLOWED_FILE_TYPES', [
    'pdf', 'doc', 'docx', 'ppt', 'pptx', 
    'xls', 'xlsx', 'txt', 'zip', 'rar',
    'jpg', 'jpeg', 'png', 'gif', 'mp4', 'avi'
]);
define('UPLOAD_PATH', __DIR__ . '/../uploads/');

// Email configuration
define('MAIL_FROM_ADDRESS', getenv('MAIL_FROM_ADDRESS') ?: 'noreply@tsharok.edu');
define('MAIL_FROM_NAME', getenv('MAIL_FROM_NAME') ?: 'Tsharok LMS');

// Pagination defaults
define('DEFAULT_PAGE_SIZE', 12);
define('MAX_PAGE_SIZE', 100);

// Logging configuration
define('LOG_PATH', __DIR__ . '/../logs/');
define('LOG_LEVEL', APP_DEBUG ? 'debug' : 'error'); // debug, info, warning, error

// Cache configuration
define('CACHE_ENABLED', true);
define('CACHE_TTL', 3600); // 1 hour

// Error display settings
if (APP_DEBUG) {
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', 0);
    ini_set('display_startup_errors', 0);
    error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED & ~E_STRICT);
}

// Timezone
date_default_timezone_set('Asia/Riyadh');

// Character encoding
mb_internal_encoding('UTF-8');
mb_http_output('UTF-8');

return [
    'app' => [
        'name' => APP_NAME,
        'env' => APP_ENV,
        'debug' => APP_DEBUG,
        'url' => APP_URL,
        'key' => APP_KEY,
    ],
    'security' => [
        'session_lifetime' => SESSION_LIFETIME,
        'session_secure' => SESSION_SECURE,
        'session_httponly' => SESSION_HTTPONLY,
        'session_samesite' => SESSION_SAMESITE,
        'cors_allowed_origins' => CORS_ALLOWED_ORIGINS,
        'cors_allow_credentials' => CORS_ALLOW_CREDENTIALS,
    ],
    'rate_limit' => [
        'login' => ['attempts' => RATE_LIMIT_LOGIN, 'window' => RATE_LIMIT_LOGIN_WINDOW],
        'register' => ['attempts' => RATE_LIMIT_REGISTER, 'window' => RATE_LIMIT_REGISTER_WINDOW],
        'api' => ['attempts' => RATE_LIMIT_API, 'window' => RATE_LIMIT_API_WINDOW],
    ],
    'upload' => [
        'max_size' => MAX_FILE_SIZE,
        'allowed_types' => ALLOWED_FILE_TYPES,
        'path' => UPLOAD_PATH,
    ],
    'mail' => [
        'from_address' => MAIL_FROM_ADDRESS,
        'from_name' => MAIL_FROM_NAME,
    ],
    'pagination' => [
        'default_size' => DEFAULT_PAGE_SIZE,
        'max_size' => MAX_PAGE_SIZE,
    ],
    'logging' => [
        'path' => LOG_PATH,
        'level' => LOG_LEVEL,
    ],
    'cache' => [
        'enabled' => CACHE_ENABLED,
        'ttl' => CACHE_TTL,
    ],
];

