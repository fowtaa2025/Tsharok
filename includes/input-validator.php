<?php
/**
 * Input Validation Layer
 * Centralized validation for common input patterns
 * Tsharok LMS
 */

// Prevent direct access
defined('TSHAROK_INIT') or die('Direct access not permitted');

class InputValidator {
    
    /**
     * Validate course ID
     */
    public static function validateCourseId($courseId) {
        $courseId = filter_var($courseId, FILTER_VALIDATE_INT);
        if ($courseId === false || $courseId <= 0) {
            return ['valid' => false, 'error' => 'Invalid course ID', 'value' => null];
        }
        return ['valid' => true, 'error' => null, 'value' => $courseId];
    }
    
    /**
     * Validate user ID
     */
    public static function validateUserId($userId) {
        $userId = filter_var($userId, FILTER_VALIDATE_INT);
        if ($userId === false || $userId <= 0) {
            return ['valid' => false, 'error' => 'Invalid user ID', 'value' => null];
        }
        return ['valid' => true, 'error' => null, 'value' => $userId];
    }
    
    /**
     * Validate content ID
     */
    public static function validateContentId($contentId) {
        $contentId = filter_var($contentId, FILTER_VALIDATE_INT);
        if ($contentId === false || $contentId <= 0) {
            return ['valid' => false, 'error' => 'Invalid content ID', 'value' => null];
        }
        return ['valid' => true, 'error' => null, 'value' => $contentId];
    }
    
    /**
     * Validate content type
     */
    public static function validateContentType($type) {
        $allowedTypes = ['lecture', 'assignment', 'video', 'document', 'quiz', 'other', 'all'];
        $type = strtolower(trim($type));
        
        if (!in_array($type, $allowedTypes)) {
            return ['valid' => false, 'error' => 'Invalid content type', 'value' => 'all'];
        }
        return ['valid' => true, 'error' => null, 'value' => $type];
    }
    
    /**
     * Validate sort parameters
     */
    public static function validateSortParams($sortBy, $sortOrder, $allowedFields = []) {
        // Default allowed fields
        if (empty($allowedFields)) {
            $allowedFields = ['id', 'title', 'created_at', 'updated_at', 'upload_date'];
        }
        
        // Validate sort field
        $sortBy = strtolower(trim($sortBy));
        if (!in_array($sortBy, $allowedFields)) {
            $sortBy = $allowedFields[0]; // Use first as default
        }
        
        // Validate sort order
        $sortOrder = strtoupper(trim($sortOrder));
        if (!in_array($sortOrder, ['ASC', 'DESC'])) {
            $sortOrder = 'DESC';
        }
        
        return [
            'valid' => true,
            'error' => null,
            'sortBy' => $sortBy,
            'sortOrder' => $sortOrder
        ];
    }
    
    /**
     * Validate level (course difficulty)
     */
    public static function validateLevel($level) {
        $allowedLevels = ['beginner', 'intermediate', 'advanced', 'all'];
        $level = strtolower(trim($level));
        
        if (!in_array($level, $allowedLevels)) {
            return ['valid' => false, 'error' => 'Invalid level', 'value' => 'all'];
        }
        return ['valid' => true, 'error' => null, 'value' => $level];
    }
    
    /**
     * Validate role
     */
    public static function validateRole($role) {
        $allowedRoles = ['student', 'instructor', 'admin'];
        $role = strtolower(trim($role));
        
        if (!in_array($role, $allowedRoles)) {
            return ['valid' => false, 'error' => 'Invalid role', 'value' => null];
        }
        return ['valid' => true, 'error' => null, 'value' => $role];
    }
    
    /**
     * Validate rating
     */
    public static function validateRating($rating) {
        $rating = filter_var($rating, FILTER_VALIDATE_FLOAT);
        if ($rating === false || $rating < 0 || $rating > 5) {
            return ['valid' => false, 'error' => 'Rating must be between 0 and 5', 'value' => null];
        }
        return ['valid' => true, 'error' => null, 'value' => $rating];
    }
    
    /**
     * Validate status
     */
    public static function validateStatus($status) {
        $allowedStatuses = ['active', 'inactive', 'pending', 'completed', 'suspended', 'dropped'];
        $status = strtolower(trim($status));
        
        if (!in_array($status, $allowedStatuses)) {
            return ['valid' => false, 'error' => 'Invalid status', 'value' => 'active'];
        }
        return ['valid' => true, 'error' => null, 'value' => $status];
    }
    
    /**
     * Validate boolean
     */
    public static function validateBoolean($value) {
        if (is_bool($value)) {
            return ['valid' => true, 'error' => null, 'value' => $value];
        }
        
        $value = strtolower(trim((string)$value));
        $trueValues = ['1', 'true', 'yes', 'on'];
        $falseValues = ['0', 'false', 'no', 'off'];
        
        if (in_array($value, $trueValues)) {
            return ['valid' => true, 'error' => null, 'value' => true];
        } elseif (in_array($value, $falseValues)) {
            return ['valid' => true, 'error' => null, 'value' => false];
        }
        
        return ['valid' => false, 'error' => 'Invalid boolean value', 'value' => false];
    }
    
    /**
     * Validate approval status
     */
    public static function validateApprovalStatus($status) {
        $allowedStatuses = ['pending', 'approved', 'rejected', 'all'];
        $status = strtolower(trim($status));
        
        // Map numeric values
        $statusMap = [
            '0' => 'pending',
            '1' => 'approved',
            '-1' => 'rejected'
        ];
        
        if (isset($statusMap[$status])) {
            $status = $statusMap[$status];
        }
        
        if (!in_array($status, $allowedStatuses)) {
            return ['valid' => false, 'error' => 'Invalid approval status', 'value' => 'pending'];
        }
        return ['valid' => true, 'error' => null, 'value' => $status];
    }
    
    /**
     * Validate language code
     */
    public static function validateLanguage($lang) {
        $allowedLanguages = ['en', 'ar'];
        $lang = strtolower(trim($lang));
        
        if (!in_array($lang, $allowedLanguages)) {
            return ['valid' => false, 'error' => 'Invalid language code', 'value' => 'en'];
        }
        return ['valid' => true, 'error' => null, 'value' => $lang];
    }
    
    /**
     * Validate namespace
     */
    public static function validateNamespace($namespace) {
        $allowedNamespaces = ['common', 'auth', 'courses', 'admin'];
        $namespace = strtolower(trim($namespace));
        
        if (!in_array($namespace, $allowedNamespaces)) {
            return ['valid' => false, 'error' => 'Invalid namespace', 'value' => 'common'];
        }
        return ['valid' => true, 'error' => null, 'value' => $namespace];
    }
    
    /**
     * Sanitize and validate search query
     */
    public static function validateSearchQuery($query, $maxLength = 200) {
        $query = trim($query);
        
        if (empty($query)) {
            return ['valid' => true, 'error' => null, 'value' => ''];
        }
        
        // Remove dangerous characters
        $query = preg_replace('/[;\'"\\\\]/', '', $query);
        $query = preg_replace('/[\x00-\x1F\x7F]/u', '', $query);
        
        // Limit length
        $query = substr($query, 0, $maxLength);
        
        // Check for SQL injection patterns
        $sqlPatterns = [
            '/(\bUNION\b.*\bSELECT\b)/i',
            '/(\bINSERT\b.*\bINTO\b)/i',
            '/(\bUPDATE\b.*\bSET\b)/i',
            '/(\bDELETE\b.*\bFROM\b)/i',
            '/(\bDROP\b)/i',
            '/--/',
            '/\/\*/'
        ];
        
        foreach ($sqlPatterns as $pattern) {
            if (preg_match($pattern, $query)) {
                error_log("SECURITY: SQL injection pattern detected in search query");
                return ['valid' => false, 'error' => 'Invalid search query', 'value' => ''];
            }
        }
        
        return ['valid' => true, 'error' => null, 'value' => $query];
    }
    
    /**
     * Validate array of IDs
     */
    public static function validateIdArray($ids, $maxCount = 100) {
        if (!is_array($ids)) {
            // Try to convert from comma-separated string
            if (is_string($ids)) {
                $ids = explode(',', $ids);
            } else {
                return ['valid' => false, 'error' => 'Invalid ID array', 'value' => []];
            }
        }
        
        $validIds = [];
        foreach (array_slice($ids, 0, $maxCount) as $id) {
            $id = filter_var($id, FILTER_VALIDATE_INT);
            if ($id !== false && $id > 0) {
                $validIds[] = $id;
            }
        }
        
        return ['valid' => true, 'error' => null, 'value' => array_unique($validIds)];
    }
    
    /**
     * Validate all request parameters
     * Convenience method to validate multiple parameters at once
     */
    public static function validateRequest($params, $rules) {
        $validated = [];
        $errors = [];
        
        foreach ($rules as $field => $rule) {
            $value = $params[$field] ?? null;
            $method = $rule['method'] ?? null;
            $default = $rule['default'] ?? null;
            $required = $rule['required'] ?? false;
            
            // Handle required fields
            if ($required && ($value === null || $value === '')) {
                $errors[$field] = "Field '{$field}' is required";
                $validated[$field] = $default;
                continue;
            }
            
            // Skip optional null values
            if (!$required && ($value === null || $value === '')) {
                $validated[$field] = $default;
                continue;
            }
            
            // Validate using specified method
            if ($method && method_exists(self::class, $method)) {
                $result = self::$method($value);
                if ($result['valid']) {
                    $validated[$field] = $result['value'];
                } else {
                    $errors[$field] = $result['error'];
                    $validated[$field] = $default;
                }
            } else {
                $validated[$field] = $value;
            }
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'data' => $validated
        ];
    }
}
?>

