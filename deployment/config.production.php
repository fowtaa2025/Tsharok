<?php
/**
 * Production Configuration Template
 * Copy this file to config/app.php and update with production values
 */

// Prevent direct access
defined('TSHAROK_INIT') or die('Direct access not permitted');

// ============================================================================
// ENVIRONMENT SETTINGS
// ============================================================================

define('APP_ENV', 'production');  // MUST be 'production'
define('APP_DEBUG', false);       // MUST be false in production
define('APP_URL', 'https://yourdomain.com');  // Update with your domain

// ============================================================================
// DATABASE CONFIGURATION
// ============================================================================

define('DB_HOST', 'localhost');        // Your database host
define('DB_PORT', 3306);               // Standard MySQL port
define('DB_NAME', 'tsharok');          // Your database name
define('DB_USER', 'tsharok_user');     // Database user (NOT root)
define('DB_PASS', 'CHANGE_THIS_PASSWORD');  // Strong password!

// ============================================================================
// SECURITY SETTINGS
// ============================================================================

// Application secret key (GENERATE A NEW ONE!)
// Generate using: bin2hex(random_bytes(32))
define('APP_KEY', 'GENERATE_A_SECURE_RANDOM_KEY_HERE_64_CHARS_MINIMUM');

// Password requirements
define('PASSWORD_MIN_LENGTH', 8);
define('PASSWORD_REQUIRE_UPPER', true);
define('PASSWORD_REQUIRE_LOWER', true);
define('PASSWORD_REQUIRE_NUMBER', true);
define('PASSWORD_REQUIRE_SPECIAL', true);

// CSRF Protection
define('CSRF_PROTECTION_ENABLED', true);

// File Uploads
define('UPLOAD_MAX_SIZE', 10 * 1024 * 1024); // 10MB
define('UPLOAD_ALLOWED_TYPES', [
    'image/jpeg',
    'image/png',
    'application/pdf',
    'video/mp4',
    'audio/mpeg'
]);
define('UPLOAD_ALLOWED_EXTENSIONS', ['jpg', 'jpeg', 'png', 'pdf', 'mp4', 'mp3']);

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

define('SESSION_LIFETIME_HOURS', 24);
define('SESSION_REMEMBER_ME_DAYS', 30);
define('SESSION_COOKIE_SECURE', true);   // MUST be true with HTTPS
define('SESSION_COOKIE_HTTPONLY', true);

// ============================================================================
// RATE LIMITING
// ============================================================================

define('RATE_LIMIT_LOGIN', 5);              // Max login attempts
define('RATE_LIMIT_LOGIN_WINDOW', 900);     // 15 minutes

define('RATE_LIMIT_REGISTER', 3);           // Max registration attempts
define('RATE_LIMIT_REGISTER_WINDOW', 3600); // 1 hour

define('RATE_LIMIT_PASSWORD_RESET', 3);
define('RATE_LIMIT_PASSWORD_RESET_WINDOW', 3600);

// ============================================================================
// CORS (Cross-Origin Resource Sharing)
// ============================================================================

// IMPORTANT: Replace with your actual domain(s)
define('CORS_ALLOWED_ORIGINS', [
    'https://yourdomain.com',
    'https://www.yourdomain.com'
]);

define('CORS_ALLOWED_METHODS', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']);
define('CORS_ALLOWED_HEADERS', ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token']);
define('CORS_EXPOSE_HEADERS', ['X-Total-Count', 'X-Pagination-Page']);
define('CORS_MAX_AGE', 600);

// ============================================================================
// EMAIL CONFIGURATION
// ============================================================================

define('EMAIL_FROM_ADDRESS', 'no-reply@yourdomain.com');
define('EMAIL_FROM_NAME', 'Tsharok LMS');

// SMTP Configuration (recommended for production)
define('SMTP_ENABLED', true);
define('SMTP_HOST', 'smtp.yourdomain.com');
define('SMTP_PORT', 587);
define('SMTP_USERNAME', 'your_smtp_username');
define('SMTP_PASSWORD', 'your_smtp_password');
define('SMTP_ENCRYPTION', 'tls'); // 'ssl' or 'tls'

// ============================================================================
// LOGGING
// ============================================================================

define('LOG_PATH', __DIR__ . '/../logs');
define('LOG_LEVEL', 'error'); // 'debug', 'info', 'warning', 'error'
define('LOG_MAX_FILES', 30);  // Keep logs for 30 days

// ============================================================================
// PAGINATION
// ============================================================================

define('DEFAULT_PAGINATION_LIMIT', 10);
define('MAX_PAGINATION_LIMIT', 100);

// ============================================================================
// CACHE SETTINGS
// ============================================================================

define('CACHE_ENABLED', true);
define('CACHE_DRIVER', 'file'); // 'file', 'redis', 'memcached'
define('CACHE_TTL', 3600);      // 1 hour default

// ============================================================================
// BACKUP SETTINGS
// ============================================================================

define('BACKUP_ENABLED', true);
define('BACKUP_SCHEDULE', 'daily'); // 'hourly', 'daily', 'weekly'
define('BACKUP_RETENTION_DAYS', 30);
define('BACKUP_PATH', __DIR__ . '/../backups');

// ============================================================================
// MAINTENANCE MODE
// ============================================================================

define('MAINTENANCE_MODE', false);
define('MAINTENANCE_MESSAGE', 'System is under maintenance. Please check back soon.');

// ============================================================================
// ADDITIONAL SECURITY
// ============================================================================

// Enable HTTPS enforcement
define('FORCE_HTTPS', true);

// Enable IP whitelisting for admin (optional)
define('ADMIN_IP_WHITELIST_ENABLED', false);
define('ADMIN_IP_WHITELIST', [
    // '192.168.1.100',
    // '10.0.0.50'
]);

// Brute force protection
define('MAX_LOGIN_ATTEMPTS', 5);
define('LOGIN_LOCKOUT_DURATION', 1800); // 30 minutes

// ============================================================================
// MONITORING & ANALYTICS
// ============================================================================

// Google Analytics (optional)
define('GA_TRACKING_ID', '');

// Error tracking service (optional - e.g., Sentry)
define('ERROR_TRACKING_ENABLED', false);
define('ERROR_TRACKING_DSN', '');

// ============================================================================
// PRODUCTION CHECKLIST
// ============================================================================

/*
BEFORE DEPLOYING, ENSURE:
□ APP_ENV is set to 'production'
□ APP_DEBUG is set to false
□ Generated secure APP_KEY
□ Updated database credentials
□ Configured CORS with actual domains
□ Enabled SESSION_COOKIE_SECURE (requires HTTPS)
□ Set up SMTP for email
□ Configured error logging
□ Set strong database password
□ Removed all test data
□ Created database backup
□ Tested all critical flows
□ Enabled HTTPS/SSL
□ Set up scheduled backups
□ Configured monitoring
*/

// ============================================================================
// END OF CONFIGURATION
// ============================================================================

