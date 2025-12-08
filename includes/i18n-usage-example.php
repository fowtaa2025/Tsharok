<?php
/**
 * Multilingual Backend Usage Examples
 * This file demonstrates how to use the i18n functions
 * Tsharok LMS
 */

// Don't run this file directly - it's for reference only
if (basename(__FILE__) == basename($_SERVER['PHP_SELF'])) {
    die('This is a reference file. Do not execute directly.');
}

require_once __DIR__ . '/i18n.php';
require_once __DIR__ . '/../config/database.php';

// Example 1: Get user's preferred language
$db = getDB();
$userLanguage = getUserLanguage($db);
echo "User's preferred language: " . $userLanguage . "\n";

// Example 2: Load translations for a namespace
$commonTranslations = loadTranslations('en', 'common');
$authTranslations = loadTranslations('ar', 'auth');

// Example 3: Translate a key
$welcome = translate('app.name', [], 'en', 'common');
echo "English: " . $welcome . "\n";

$welcomeAr = translate('app.name', [], 'ar', 'common');
echo "Arabic: " . $welcomeAr . "\n";

// Example 4: Translate with parameters
$message = translate('messages.success', ['name' => 'Ahmad'], 'en', 'common');

// Example 5: Using the short alias
$loginTitle = __('auth.login.title', [], 'en', 'auth');
echo "Login Title: " . $loginTitle . "\n";

// Example 6: Set user's language preference
setUserLanguage('ar', $db);

// Example 7: Check if language is RTL
if (isRTL('ar')) {
    echo "Arabic is RTL\n";
}

// Example 8: Get direction
$direction = getDirection('ar'); // Returns 'rtl'
$direction = getDirection('en'); // Returns 'ltr'

// Example 9: Format date according to language
$formattedDate = formatDate('2025-11-19', 'Y-m-d H:i', 'ar');

// Example 10: Format number according to language
$formattedNumber = formatNumber(1234.56, 2, 'ar');

// Example 11: Get all available languages
$languages = getAvailableLanguages();
foreach ($languages as $code => $info) {
    echo "{$info['nativeName']} ({$code}) - Direction: {$info['direction']}\n";
}

// Example 12: Pluralize (Arabic has complex plural rules)
$forms = [
    'zero' => 'لا طلاب',
    'one' => 'طالب واحد',
    'two' => 'طالبان',
    'few' => '%d طلاب',
    'many' => '%d طالباً',
    'other' => '%d طالب'
];
$result = pluralize(5, $forms, 'ar'); // Returns 'طلاب'

// Example 13: In HTML/PHP templates
?>
<!DOCTYPE html>
<html lang="<?php echo getUserLanguage($db); ?>" dir="<?php echo getDirection(); ?>">
<head>
    <title><?php _e('app.name', [], null, 'common'); ?></title>
</head>
<body>
    <h1><?php echo __('auth.login.title', [], null, 'auth'); ?></h1>
    
    <form>
        <label><?php _e('auth.login.email', [], null, 'auth'); ?></label>
        <input type="email" placeholder="<?php echo __('auth.login.emailPlaceholder', [], null, 'auth'); ?>">
        
        <button><?php _e('auth.login.button', [], null, 'auth'); ?></button>
    </form>
</body>
</html>
<?php

// Example 14: In API endpoints
function sendLocalizedResponse($key, $params = [], $namespace = 'common') {
    global $db;
    $language = getUserLanguage($db);
    $message = translate($key, $params, $language, $namespace);
    
    return json_encode([
        'success' => true,
        'message' => $message,
        'language' => $language
    ]);
}

// Example 15: Switch language programmatically
// When user clicks language switcher
if (isset($_POST['change_language'])) {
    $newLanguage = $_POST['language'];
    if (in_array($newLanguage, ['en', 'ar'])) {
        setUserLanguage($newLanguage, $db);
        // Redirect or reload page
        header('Location: ' . $_SERVER['PHP_SELF']);
        exit;
    }
}

/**
 * COMMON USAGE PATTERNS
 */

// Pattern 1: Error messages
function showError($errorKey) {
    global $db;
    $message = __("messages.$errorKey", [], null, 'common');
    return ['error' => true, 'message' => $message];
}

// Pattern 2: Form validation messages
function getValidationMessage($field, $rule) {
    return __("validation.$rule", ['field' => $field], null, 'common');
}

// Pattern 3: Dynamic content with translation
function getCourseCard($course) {
    return [
        'title' => $course['title'],
        'level' => __("courses.catalog." . $course['level'], [], null, 'courses'),
        'enrollButton' => __('courses.details.enroll', [], null, 'courses')
    ];
}

// Pattern 4: Admin notifications
function getAdminNotification($action, $target) {
    $actionText = __("admin.moderation.$action", [], null, 'admin');
    return "$actionText: $target";
}

/**
 * BEST PRACTICES
 */

// 1. Always pass database connection when available
// 2. Use consistent key naming (namespace.section.key)
// 3. Store user language in database for persistence
// 4. Cache translations at application level
// 5. Use parameters for dynamic content
// 6. Test with both LTR and RTL languages
// 7. Keep translation keys organized by feature
// 8. Use descriptive key names (not generic like 'text1', 'text2')
// 9. Document translation keys when adding new features
// 10. Validate user language input to prevent injection

/**
 * TRANSLATION KEY STRUCTURE
 * 
 * namespace.category.specificKey
 * 
 * Examples:
 * - common.actions.submit
 * - auth.login.title
 * - courses.catalog.level
 * - admin.dashboard.totalUsers
 * 
 * Namespaces:
 * - common: UI strings used across the app
 * - auth: Authentication and authorization
 * - courses: Course-related strings
 * - admin: Admin panel strings
 */
?>

