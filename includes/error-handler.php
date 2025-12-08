<?php
/**
 * Error Handler
 * Centralized error handling and logging
 * Tsharok LMS
 */

// Prevent direct access
if (!defined('TSHAROK_INIT')) {
    http_response_code(403);
    exit('Direct access not permitted');
}

/**
 * Log error to file
 * @param string $message Error message
 * @param string $level Error level (debug, info, warning, error)
 * @param array $context Additional context
 */
function logError($message, $level = 'error', $context = []) {
    if (!defined('LOG_PATH')) {
        error_log($message);
        return;
    }
    
    // Check if logging level is appropriate
    $logLevels = ['debug' => 0, 'info' => 1, 'warning' => 2, 'error' => 3];
    $currentLevel = defined('LOG_LEVEL') ? LOG_LEVEL : 'error';
    
    if ($logLevels[$level] < $logLevels[$currentLevel]) {
        return; // Don't log if below threshold
    }
    
    // Create logs directory if it doesn't exist
    if (!file_exists(LOG_PATH)) {
        mkdir(LOG_PATH, 0755, true);
    }
    
    // Prepare log entry
    $timestamp = date('Y-m-d H:i:s');
    $clientIp = getClientIP();
    $requestUri = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : 'CLI';
    
    $logEntry = sprintf(
        "[%s] [%s] [IP: %s] [URI: %s] %s",
        $timestamp,
        strtoupper($level),
        $clientIp,
        $requestUri,
        $message
    );
    
    if (!empty($context)) {
        $logEntry .= ' | Context: ' . json_encode($context, JSON_UNESCAPED_UNICODE);
    }
    
    $logEntry .= PHP_EOL;
    
    // Write to daily log file
    $logFile = LOG_PATH . date('Y-m-d') . '.log';
    file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
    
    // Also use PHP's error log for critical errors
    if ($level === 'error') {
        error_log($message);
    }
}

/**
 * Safe error response for API
 * @param Exception $e Exception object
 * @param string $userMessage User-friendly message
 */
function handleApiError($e, $userMessage = 'An error occurred. Please try again later.') {
    // Log the actual error
    logError(
        $e->getMessage() . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine(),
        'error',
        ['trace' => $e->getTraceAsString()]
    );
    
    // Send safe response to user
    if (defined('APP_DEBUG') && APP_DEBUG) {
        // In debug mode, show more details
        sendJsonResponse(false, $userMessage, [
            'debug' => [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]
        ]);
    } else {
        // In production, hide details
        sendJsonResponse(false, $userMessage);
    }
}

/**
 * Custom exception handler
 */
function customExceptionHandler($exception) {
    logError(
        'Uncaught Exception: ' . $exception->getMessage(),
        'error',
        [
            'file' => $exception->getFile(),
            'line' => $exception->getLine(),
            'trace' => $exception->getTraceAsString()
        ]
    );
    
    // Send generic error response
    if (!headers_sent()) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'message' => 'An unexpected error occurred. Please try again later.'
        ]);
    }
}

/**
 * Custom error handler
 */
function customErrorHandler($errno, $errstr, $errfile, $errline) {
    // Don't log suppressed errors (using @)
    if (!(error_reporting() & $errno)) {
        return false;
    }
    
    $errorTypes = [
        E_ERROR => 'ERROR',
        E_WARNING => 'WARNING',
        E_PARSE => 'PARSE',
        E_NOTICE => 'NOTICE',
        E_CORE_ERROR => 'CORE_ERROR',
        E_CORE_WARNING => 'CORE_WARNING',
        E_COMPILE_ERROR => 'COMPILE_ERROR',
        E_COMPILE_WARNING => 'COMPILE_WARNING',
        E_USER_ERROR => 'USER_ERROR',
        E_USER_WARNING => 'USER_WARNING',
        E_USER_NOTICE => 'USER_NOTICE',
        E_STRICT => 'STRICT',
        E_RECOVERABLE_ERROR => 'RECOVERABLE_ERROR',
        E_DEPRECATED => 'DEPRECATED',
        E_USER_DEPRECATED => 'USER_DEPRECATED',
    ];
    
    $errorType = isset($errorTypes[$errno]) ? $errorTypes[$errno] : 'UNKNOWN';
    
    logError(
        "PHP $errorType: $errstr",
        'error',
        ['file' => $errfile, 'line' => $errline]
    );
    
    // Don't execute PHP internal error handler
    return true;
}

/**
 * Register custom error handlers
 */
function registerErrorHandlers() {
    set_exception_handler('customExceptionHandler');
    set_error_handler('customErrorHandler');
    
    // Shutdown function to catch fatal errors
    register_shutdown_function(function() {
        $error = error_get_last();
        if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
            logError(
                'Fatal Error: ' . $error['message'],
                'error',
                ['file' => $error['file'], 'line' => $error['line']]
            );
        }
    });
}

// Auto-register handlers if not in CLI mode
if (php_sapi_name() !== 'cli' && defined('TSHAROK_INIT')) {
    registerErrorHandlers();
}

