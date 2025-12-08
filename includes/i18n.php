<?php
/**
 * Internationalization (i18n) Functions
 * Handles multilingual support for Tsharok LMS
 */

// Prevent direct access
defined('TSHAROK_INIT') or die('Direct access not permitted');

// Supported languages
define('SUPPORTED_LANGUAGES', ['en', 'ar']);
define('DEFAULT_LANGUAGE', 'en');
define('LANG_DIR', __DIR__ . '/../languages/');

/**
 * Get user's preferred language
 * Priority: User setting > Session > Browser > Default
 * 
 * @param PDO $db Database connection
 * @return string Language code
 */
function getUserLanguage($db = null) {
    // 1. Check if user is logged in and has language preference
    if ($db && isset($_SESSION['user_id'])) {
        try {
            $stmt = $db->prepare("SELECT language FROM users WHERE user_id = ?");
            $stmt->execute([$_SESSION['user_id']]);
            $user = $stmt->fetch();
            
            if ($user && !empty($user['language']) && in_array($user['language'], SUPPORTED_LANGUAGES)) {
                $_SESSION['language'] = $user['language'];
                return $user['language'];
            }
        } catch (PDOException $e) {
            error_log("Get User Language Error: " . $e->getMessage());
        }
    }
    
    // 2. Check session
    if (isset($_SESSION['language']) && in_array($_SESSION['language'], SUPPORTED_LANGUAGES)) {
        return $_SESSION['language'];
    }
    
    // 3. Check cookie
    if (isset($_COOKIE['language']) && in_array($_COOKIE['language'], SUPPORTED_LANGUAGES)) {
        $_SESSION['language'] = $_COOKIE['language'];
        return $_COOKIE['language'];
    }
    
    // 4. Check browser language
    $browserLang = getBrowserLanguage();
    if ($browserLang) {
        $_SESSION['language'] = $browserLang;
        return $browserLang;
    }
    
    // 5. Return default
    $_SESSION['language'] = DEFAULT_LANGUAGE;
    return DEFAULT_LANGUAGE;
}

/**
 * Get browser language preference
 * 
 * @return string|null Language code or null
 */
function getBrowserLanguage() {
    if (!isset($_SERVER['HTTP_ACCEPT_LANGUAGE'])) {
        return null;
    }
    
    $langs = explode(',', $_SERVER['HTTP_ACCEPT_LANGUAGE']);
    foreach ($langs as $lang) {
        $lang = substr($lang, 0, 2);
        if (in_array($lang, SUPPORTED_LANGUAGES)) {
            return $lang;
        }
    }
    
    return null;
}

/**
 * Set user's language preference
 * 
 * @param string $language Language code
 * @param PDO $db Database connection (optional)
 * @return bool Success status
 */
function setUserLanguage($language, $db = null) {
    if (!in_array($language, SUPPORTED_LANGUAGES)) {
        return false;
    }
    
    // Set session
    $_SESSION['language'] = $language;
    
    // Set cookie (30 days)
    setcookie('language', $language, time() + (30 * 24 * 60 * 60), '/', '', false, true);
    
    // Update database if user is logged in
    if ($db && isset($_SESSION['user_id'])) {
        try {
            $stmt = $db->prepare("UPDATE users SET language = ? WHERE user_id = ?");
            $stmt->execute([$language, $_SESSION['user_id']]);
            return true;
        } catch (PDOException $e) {
            error_log("Set User Language Error: " . $e->getMessage());
            return false;
        }
    }
    
    return true;
}

/**
 * Load translations for a specific language
 * 
 * @param string $language Language code
 * @param string $namespace Translation namespace (e.g., 'common', 'auth', 'admin')
 * @return array Translations array
 */
function loadTranslations($language, $namespace = 'common') {
    static $cache = [];
    
    $cacheKey = "{$language}_{$namespace}";
    
    // Check cache
    if (isset($cache[$cacheKey])) {
        return $cache[$cacheKey];
    }
    
    // Validate language
    if (!in_array($language, SUPPORTED_LANGUAGES)) {
        $language = DEFAULT_LANGUAGE;
    }
    
    // Load translation file
    $filePath = LANG_DIR . "{$language}/{$namespace}.json";
    
    if (!file_exists($filePath)) {
        error_log("Translation file not found: {$filePath}");
        return [];
    }
    
    $json = file_get_contents($filePath);
    $translations = json_decode($json, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log("Translation file parse error: " . json_last_error_msg());
        return [];
    }
    
    // Cache translations
    $cache[$cacheKey] = $translations;
    
    return $translations;
}

/**
 * Translate a key
 * Supports nested keys using dot notation (e.g., 'auth.login.title')
 * 
 * @param string $key Translation key
 * @param array $params Parameters for interpolation
 * @param string $language Language code (optional)
 * @param string $namespace Translation namespace (optional)
 * @return string Translated string
 */
function translate($key, $params = [], $language = null, $namespace = 'common') {
    global $db;
    
    // Get language
    if ($language === null) {
        $language = getUserLanguage($db ?? null);
    }
    
    // Load translations
    $translations = loadTranslations($language, $namespace);
    
    // Get nested value using dot notation
    $keys = explode('.', $key);
    $value = $translations;
    
    foreach ($keys as $k) {
        if (!isset($value[$k])) {
            // Try loading from 'common' namespace if not found
            if ($namespace !== 'common') {
                return translate($key, $params, $language, 'common');
            }
            return $key; // Return key if translation not found
        }
        $value = $value[$k];
    }
    
    // Interpolate parameters
    if (!empty($params)) {
        foreach ($params as $param => $val) {
            $value = str_replace("{{$param}}", $val, $value);
        }
    }
    
    return $value;
}

/**
 * Alias for translate function
 */
function __($key, $params = [], $language = null, $namespace = 'common') {
    return translate($key, $params, $language, $namespace);
}

/**
 * Get all translations for a namespace
 * 
 * @param string $namespace Translation namespace
 * @param string $language Language code (optional)
 * @return array All translations
 */
function getAllTranslations($namespace = 'common', $language = null) {
    global $db;
    
    if ($language === null) {
        $language = getUserLanguage($db ?? null);
    }
    
    return loadTranslations($language, $namespace);
}

/**
 * Get available languages with metadata
 * 
 * @return array Available languages
 */
function getAvailableLanguages() {
    return [
        'en' => [
            'code' => 'en',
            'name' => 'English',
            'nativeName' => 'English',
            'direction' => 'ltr',
            'icon' => '🇺🇸'
        ],
        'ar' => [
            'code' => 'ar',
            'name' => 'Arabic',
            'nativeName' => 'العربية',
            'direction' => 'rtl',
            'icon' => '🇸🇦'
        ]
    ];
}

/**
 * Check if language is RTL
 * 
 * @param string $language Language code
 * @return bool True if RTL
 */
function isRTL($language = null) {
    global $db;
    
    if ($language === null) {
        $language = getUserLanguage($db ?? null);
    }
    
    $rtlLanguages = ['ar', 'he', 'fa', 'ur'];
    return in_array($language, $rtlLanguages);
}

/**
 * Get direction for language
 * 
 * @param string $language Language code (optional)
 * @return string 'rtl' or 'ltr'
 */
function getDirection($language = null) {
    return isRTL($language) ? 'rtl' : 'ltr';
}

/**
 * Format date according to language
 * 
 * @param string $date Date string
 * @param string $format Format string
 * @param string $language Language code (optional)
 * @return string Formatted date
 */
function formatDate($date, $format = 'Y-m-d H:i', $language = null) {
    global $db;
    
    if ($language === null) {
        $language = getUserLanguage($db ?? null);
    }
    
    $timestamp = is_numeric($date) ? $date : strtotime($date);
    
    if ($language === 'ar') {
        // Use Arabic locale if available
        $oldLocale = setlocale(LC_TIME, 0);
        setlocale(LC_TIME, 'ar_SA.utf8', 'ar_SA', 'ar');
        $formatted = strftime($format, $timestamp);
        setlocale(LC_TIME, $oldLocale);
        return $formatted;
    }
    
    return date($format, $timestamp);
}

/**
 * Format number according to language
 * 
 * @param float $number Number to format
 * @param int $decimals Number of decimals
 * @param string $language Language code (optional)
 * @return string Formatted number
 */
function formatNumber($number, $decimals = 0, $language = null) {
    global $db;
    
    if ($language === null) {
        $language = getUserLanguage($db ?? null);
    }
    
    if ($language === 'ar') {
        // Arabic uses Arabic-Indic numerals in some contexts
        $western = ['0','1','2','3','4','5','6','7','8','9'];
        $arabic = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
        $formatted = number_format($number, $decimals, '.', ',');
        // Optionally convert to Arabic-Indic numerals
        // return str_replace($western, $arabic, $formatted);
        return $formatted;
    }
    
    return number_format($number, $decimals, '.', ',');
}

/**
 * Get plural form for a number
 * 
 * @param int $count Count
 * @param array $forms Plural forms ['zero', 'one', 'two', 'few', 'many', 'other']
 * @param string $language Language code (optional)
 * @return string Appropriate plural form
 */
function pluralize($count, $forms, $language = null) {
    global $db;
    
    if ($language === null) {
        $language = getUserLanguage($db ?? null);
    }
    
    if ($language === 'ar') {
        // Arabic has complex plural rules
        if ($count == 0) return $forms['zero'] ?? $forms['other'];
        if ($count == 1) return $forms['one'] ?? $forms['other'];
        if ($count == 2) return $forms['two'] ?? $forms['other'];
        if ($count >= 3 && $count <= 10) return $forms['few'] ?? $forms['other'];
        if ($count >= 11) return $forms['many'] ?? $forms['other'];
    } else {
        // English plural rules
        if ($count == 1) return $forms['one'] ?? $forms['other'];
        return $forms['other'];
    }
    
    return $forms['other'] ?? '';
}

/**
 * Translate and echo
 */
function _e($key, $params = [], $language = null, $namespace = 'common') {
    echo translate($key, $params, $language, $namespace);
}
?>

