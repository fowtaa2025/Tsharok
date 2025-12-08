<?php
/**
 * Security Helper Functions
 * SQL Injection Prevention and Input Validation
 * Tsharok LMS
 */

// Prevent direct access
defined('TSHAROK_INIT') or die('Direct access not permitted');

/**
 * Validate and sanitize ORDER BY clause
 * Prevents SQL injection in dynamic ORDER BY clauses
 * 
 * @param string $sortBy User-provided sort field
 * @param array $allowedFields Whitelist of allowed sort fields
 * @param string $default Default sort field
 * @return string Safe ORDER BY clause
 */
function sanitizeOrderBy($sortBy, $allowedFields, $default = 'id') {
    if (empty($sortBy)) {
        return $default;
    }
    
    // Extract field and direction
    $parts = explode(' ', trim($sortBy));
    $field = $parts[0];
    $direction = isset($parts[1]) ? strtoupper($parts[1]) : 'ASC';
    
    // Validate field against whitelist
    if (!in_array($field, $allowedFields)) {
        error_log("Security: Invalid ORDER BY field attempted: " . $field);
        return $default;
    }
    
    // Validate direction
    if (!in_array($direction, ['ASC', 'DESC'])) {
        $direction = 'ASC';
    }
    
    return $field . ' ' . $direction;
}

/**
 * Validate and sanitize column names for dynamic queries
 * 
 * @param string $column User-provided column name
 * @param array $allowedColumns Whitelist of allowed columns
 * @param string $default Default column name
 * @return string Safe column name
 */
function sanitizeColumnName($column, $allowedColumns, $default = 'id') {
    if (empty($column) || !in_array($column, $allowedColumns)) {
        error_log("Security: Invalid column name attempted: " . $column);
        return $default;
    }
    return $column;
}

/**
 * Validate and sanitize table names for dynamic queries
 * 
 * @param string $table User-provided table name
 * @param array $allowedTables Whitelist of allowed tables
 * @param string $default Default table name
 * @return string Safe table name
 */
function sanitizeTableName($table, $allowedTables, $default = null) {
    if (empty($table) || !in_array($table, $allowedTables)) {
        error_log("Security: Invalid table name attempted: " . $table);
        return $default;
    }
    return $table;
}

/**
 * Validate integer input
 * 
 * @param mixed $value Input value
 * @param int $min Minimum allowed value
 * @param int $max Maximum allowed value
 * @param int $default Default value
 * @return int Validated integer
 */
function validateInteger($value, $min = null, $max = null, $default = 0) {
    if (!is_numeric($value)) {
        return $default;
    }
    
    $intValue = intval($value);
    
    if ($min !== null && $intValue < $min) {
        return $min;
    }
    
    if ($max !== null && $intValue > $max) {
        return $max;
    }
    
    return $intValue;
}

/**
 * Validate float input
 * 
 * @param mixed $value Input value
 * @param float $min Minimum allowed value
 * @param float $max Maximum allowed value
 * @param float $default Default value
 * @return float Validated float
 */
function validateFloat($value, $min = null, $max = null, $default = 0.0) {
    if (!is_numeric($value)) {
        return $default;
    }
    
    $floatValue = floatval($value);
    
    if ($min !== null && $floatValue < $min) {
        return $min;
    }
    
    if ($max !== null && $floatValue > $max) {
        return $max;
    }
    
    return $floatValue;
}

/**
 * Validate enum value
 * 
 * @param mixed $value Input value
 * @param array $allowedValues Whitelist of allowed values
 * @param mixed $default Default value
 * @return mixed Validated value
 */
function validateEnum($value, $allowedValues, $default = null) {
    if (!in_array($value, $allowedValues, true)) {
        error_log("Security: Invalid enum value attempted: " . $value);
        return $default;
    }
    return $value;
}

/**
 * Build safe WHERE clause with prepared statement parameters
 * 
 * @param array $conditions Array of conditions ['field' => 'value']
 * @param array $allowedFields Whitelist of allowed fields
 * @return array ['clause' => 'WHERE ...', 'params' => [...]]
 */
function buildSafeWhereClause($conditions, $allowedFields) {
    $whereParts = [];
    $params = [];
    
    foreach ($conditions as $field => $value) {
        // Validate field
        if (!in_array($field, $allowedFields)) {
            error_log("Security: Invalid WHERE field attempted: " . $field);
            continue;
        }
        
        // Skip null values
        if ($value === null || $value === '') {
            continue;
        }
        
        // Handle different operators
        if (is_array($value)) {
            // IN clause
            $placeholders = str_repeat('?,', count($value) - 1) . '?';
            $whereParts[] = "$field IN ($placeholders)";
            $params = array_merge($params, $value);
        } else {
            // Equality
            $whereParts[] = "$field = ?";
            $params[] = $value;
        }
    }
    
    $whereClause = !empty($whereParts) ? 'WHERE ' . implode(' AND ', $whereParts) : '';
    
    return [
        'clause' => $whereClause,
        'params' => $params
    ];
}

/**
 * Escape LIKE pattern
 * Prevents LIKE wildcard injection
 * 
 * @param string $pattern User input for LIKE pattern
 * @param string $position 'both', 'start', 'end', 'none'
 * @return string Escaped pattern with wildcards
 */
function escapeLikePattern($pattern, $position = 'both') {
    // Escape special LIKE characters
    $pattern = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $pattern);
    
    // Add wildcards
    switch ($position) {
        case 'both':
            return '%' . $pattern . '%';
        case 'start':
            return '%' . $pattern;
        case 'end':
            return $pattern . '%';
        case 'none':
        default:
            return $pattern;
    }
}

/**
 * Validate and sanitize pagination parameters
 * 
 * @param int $page Current page
 * @param int $limit Items per page
 * @param int $maxLimit Maximum allowed limit
 * @return array ['page' => int, 'limit' => int, 'offset' => int]
 */
function validatePagination($page, $limit, $maxLimit = 100) {
    $page = max(1, intval($page));
    $limit = min($maxLimit, max(1, intval($limit)));
    $offset = ($page - 1) * $limit;
    
    return [
        'page' => $page,
        'limit' => $limit,
        'offset' => $offset
    ];
}

/**
 * Validate array of IDs
 * Ensures all values are integers
 * 
 * @param array $ids Array of IDs
 * @param int $maxCount Maximum allowed count
 * @return array Validated integer IDs
 */
function validateIdsArray($ids, $maxCount = 100) {
    if (!is_array($ids)) {
        return [];
    }
    
    $ids = array_slice($ids, 0, $maxCount);
    $validIds = [];
    
    foreach ($ids as $id) {
        if (is_numeric($id) && $id > 0) {
            $validIds[] = intval($id);
        }
    }
    
    return array_unique($validIds);
}

/**
 * Sanitize search query
 * Removes dangerous characters while preserving search functionality
 * 
 * @param string $query Search query
 * @param int $maxLength Maximum length
 * @return string Sanitized query
 */
function sanitizeSearchQuery($query, $maxLength = 200) {
    $query = trim($query);
    $query = substr($query, 0, $maxLength);
    
    // Remove control characters and null bytes
    $query = preg_replace('/[\x00-\x1F\x7F]/u', '', $query);
    
    // Remove potential SQL injection patterns (but keep search-friendly characters)
    $query = preg_replace('/[;\'"\\\\]/', '', $query);
    
    return $query;
}

/**
 * Validate date format
 * 
 * @param string $date Date string
 * @param string $format Expected format (default: Y-m-d)
 * @return string|false Valid date string or false
 */
function validateDate($date, $format = 'Y-m-d') {
    $d = DateTime::createFromFormat($format, $date);
    return $d && $d->format($format) === $date ? $date : false;
}

/**
 * Validate JSON input
 * 
 * @param string $json JSON string
 * @param int $maxDepth Maximum nesting depth
 * @return array|false Decoded array or false
 */
function validateJson($json, $maxDepth = 512) {
    if (empty($json)) {
        return false;
    }
    
    $data = json_decode($json, true, $maxDepth);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log("JSON decode error: " . json_last_error_msg());
        return false;
    }
    
    return $data;
}

/**
 * Check for SQL injection patterns
 * WARNING: This is NOT a replacement for prepared statements!
 * Use only as an additional security layer for logging/monitoring
 * 
 * @param string $input User input
 * @return bool True if suspicious pattern detected
 */
function detectSqlInjection($input) {
    $patterns = [
        '/(\bUNION\b.*\bSELECT\b)/i',
        '/(\bSELECT\b.*\bFROM\b.*\bWHERE\b)/i',
        '/(\bINSERT\b.*\bINTO\b)/i',
        '/(\bUPDATE\b.*\bSET\b)/i',
        '/(\bDELETE\b.*\bFROM\b)/i',
        '/(\bDROP\b.*\bTABLE\b)/i',
        '/(\bEXEC\b|\bEXECUTE\b)/i',
        '/--/',
        '/\/\*.*\*\//',
        '/;\s*\w+/',
    ];
    
    foreach ($patterns as $pattern) {
        if (preg_match($pattern, $input)) {
            error_log("SECURITY ALERT: Potential SQL injection detected in input: " . substr($input, 0, 100));
            return true;
        }
    }
    
    return false;
}

/**
 * Log security event
 * 
 * @param string $event Event type
 * @param string $description Event description
 * @param array $context Additional context
 */
function logSecurityEvent($event, $description, $context = []) {
    $logEntry = [
        'timestamp' => date('Y-m-d H:i:s'),
        'event' => $event,
        'description' => $description,
        'ip' => getClientIP(),
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown',
        'user_id' => $_SESSION['user_id'] ?? null,
        'context' => $context
    ];
    
    error_log("SECURITY EVENT: " . json_encode($logEntry));
    
    // Optionally write to dedicated security log file
    $logFile = __DIR__ . '/../logs/security.log';
    if (is_writable(dirname($logFile))) {
        file_put_contents($logFile, json_encode($logEntry) . PHP_EOL, FILE_APPEND);
    }
}

/**
 * Validate file upload
 * 
 * @param array $file $_FILES array element
 * @param array $options Validation options
 * @return array ['valid' => bool, 'error' => string|null]
 */
function validateFileUpload($file, $options = []) {
    $defaults = [
        'maxSize' => 10 * 1024 * 1024, // 10MB
        'allowedTypes' => ['image/jpeg', 'image/png', 'application/pdf'],
        'allowedExtensions' => ['jpg', 'jpeg', 'png', 'pdf']
    ];
    
    $options = array_merge($defaults, $options);
    
    // Check if file was uploaded
    if (!isset($file['error']) || is_array($file['error'])) {
        return ['valid' => false, 'error' => 'Invalid file upload'];
    }
    
    // Check for upload errors
    if ($file['error'] !== UPLOAD_ERR_OK) {
        return ['valid' => false, 'error' => 'File upload error: ' . $file['error']];
    }
    
    // Check file size
    if ($file['size'] > $options['maxSize']) {
        return ['valid' => false, 'error' => 'File size exceeds maximum allowed'];
    }
    
    // Check MIME type
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    if (!in_array($mimeType, $options['allowedTypes'])) {
        return ['valid' => false, 'error' => 'File type not allowed'];
    }
    
    // Check extension
    $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($extension, $options['allowedExtensions'])) {
        return ['valid' => false, 'error' => 'File extension not allowed'];
    }
    
    return ['valid' => true, 'error' => null];
}

/**
 * Generate CSRF token
 * 
 * @return string CSRF token
 */
function generateCsrfToken() {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

/**
 * Validate CSRF token
 * 
 * @param string $token Token to validate
 * @return bool True if valid
 */
function validateCsrfToken($token) {
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

/**
 * Rate limiting check
 * 
 * @param string $key Unique key for rate limit (e.g., 'login_' . $ip)
 * @param int $maxAttempts Maximum attempts allowed
 * @param int $timeWindow Time window in seconds
 * @return bool True if within limits
 */
function checkRateLimit($key, $maxAttempts, $timeWindow) {
    $cacheFile = sys_get_temp_dir() . '/tsharok_ratelimit_' . md5($key) . '.json';
    
    $attempts = [];
    if (file_exists($cacheFile)) {
        $data = json_decode(file_get_contents($cacheFile), true);
        $attempts = $data['attempts'] ?? [];
    }
    
    // Remove old attempts
    $cutoff = time() - $timeWindow;
    $attempts = array_filter($attempts, function($timestamp) use ($cutoff) {
        return $timestamp > $cutoff;
    });
    
    // Check if limit exceeded
    if (count($attempts) >= $maxAttempts) {
        return false;
    }
    
    // Add current attempt
    $attempts[] = time();
    
    // Save
    file_put_contents($cacheFile, json_encode(['attempts' => $attempts]));
    
    return true;
}
?>

