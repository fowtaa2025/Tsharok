<?php
/**
 * Production Configuration Verification
 * Verifies all settings are production-ready
 * 
 * Usage: php deployment/verify-production-config.php
 */

define('TSHAROK_INIT', true);

require_once __DIR__ . '/../config/app.php';

$c = ['g' => "\033[32m", 'r' => "\033[31m", 'y' => "\033[33m", 'b' => "\033[34m", 'x' => "\033[0m"];

echo "\n";
echo "═══════════════════════════════════════════════════════════════\n";
echo "  PRODUCTION CONFIGURATION VERIFICATION\n";
echo "═══════════════════════════════════════════════════════════════\n\n";

$issues = [];
$warnings = [];
$passed = [];

// Check 1: Environment Setting
echo "Checking configuration settings...\n";
echo "─────────────────────────────────────────────────────────────\n\n";

echo "1. Environment Configuration\n";
if (APP_ENV !== 'production') {
    $issues[] = "APP_ENV is set to '" . APP_ENV . "' (should be 'production')";
    echo "   {$c['r']}✗ FAIL{$c['x']} - APP_ENV: " . APP_ENV . " (should be 'production')\n";
    echo "   Fix: Edit config/app.php and set: define('APP_ENV', 'production');\n";
} else {
    $passed[] = "APP_ENV is 'production'";
    echo "   {$c['g']}✓ PASS{$c['x']} - APP_ENV: production\n";
}

if (APP_DEBUG === true) {
    $issues[] = "APP_DEBUG is enabled (should be false in production)";
    echo "   {$c['r']}✗ FAIL{$c['x']} - APP_DEBUG: enabled (should be disabled)\n";
    echo "   Fix: Edit config/app.php and set: define('APP_DEBUG', false);\n";
} else {
    $passed[] = "APP_DEBUG is disabled";
    echo "   {$c['g']}✓ PASS{$c['x']} - APP_DEBUG: disabled\n";
}

echo "\n";

// Check 2: Security Settings
echo "2. Security Configuration\n";

if (APP_KEY === 'YOUR_VERY_STRONG_RANDOM_SECRET_KEY_HERE') {
    $issues[] = "APP_KEY is using default value";
    echo "   {$c['r']}✗ FAIL{$c['x']} - APP_KEY: using default value\n";
    echo "   Fix: Generate a secure random key (64+ characters)\n";
    echo "   Example: " . bin2hex(random_bytes(32)) . "\n";
} else {
    if (strlen(APP_KEY) < 32) {
        $warnings[] = "APP_KEY is too short (< 32 characters)";
        echo "   {$c['y']}⚠ WARNING{$c['x']} - APP_KEY: too short\n";
    } else {
        $passed[] = "APP_KEY is configured";
        echo "   {$c['g']}✓ PASS{$c['x']} - APP_KEY: configured\n";
    }
}

if (SESSION_COOKIE_SECURE === false) {
    $warnings[] = "SESSION_COOKIE_SECURE is disabled (should be true with HTTPS)";
    echo "   {$c['y']}⚠ WARNING{$c['x']} - SESSION_COOKIE_SECURE: disabled\n";
    echo "   Fix: Enable HTTPS and set SESSION_COOKIE_SECURE to true\n";
} else {
    $passed[] = "SESSION_COOKIE_SECURE is enabled";
    echo "   {$c['g']}✓ PASS{$c['x']} - SESSION_COOKIE_SECURE: enabled\n";
}

echo "\n";

// Check 3: Database Configuration
echo "3. Database Configuration\n";

if (DB_PASS === '') {
    $issues[] = "Database password is empty";
    echo "   {$c['r']}✗ FAIL{$c['x']} - DB_PASS: empty (use strong password)\n";
} else {
    if (strlen(DB_PASS) < 8) {
        $warnings[] = "Database password is weak";
        echo "   {$c['y']}⚠ WARNING{$c['x']} - DB_PASS: weak password\n";
    } else {
        $passed[] = "Database password is configured";
        echo "   {$c['g']}✓ PASS{$c['x']} - DB_PASS: configured\n";
    }
}

if (DB_HOST === 'localhost' && DB_PORT === 3307) {
    $warnings[] = "Using non-standard MySQL port (3307)";
    echo "   {$c['y']}⚠ WARNING{$c['x']} - DB_PORT: 3307 (verify this is correct)\n";
} else {
    echo "   {$c['g']}✓ PASS{$c['x']} - DB_HOST: " . DB_HOST . ", DB_PORT: " . DB_PORT . "\n";
}

echo "\n";

// Check 4: CORS Configuration
echo "4. CORS Configuration\n";

if (in_array('*', CORS_ALLOWED_ORIGINS)) {
    $warnings[] = "CORS allows all origins (*)";
    echo "   {$c['y']}⚠ WARNING{$c['x']} - CORS_ALLOWED_ORIGINS: allows all (*)\n";
    echo "   Fix: Specify exact domain(s) in production\n";
} else {
    $passed[] = "CORS is configured with specific origins";
    echo "   {$c['g']}✓ PASS{$c['x']} - CORS_ALLOWED_ORIGINS: " . implode(', ', CORS_ALLOWED_ORIGINS) . "\n";
}

echo "\n";

// Check 5: File Permissions
echo "5. File and Directory Permissions\n";

$checkDirs = [
    'uploads/staging' => true,
    'uploads/content' => true,
    'uploads/rejected' => true,
    'logs' => true
];

foreach ($checkDirs as $dir => $shouldBeWritable) {
    if (file_exists($dir)) {
        if (is_writable($dir) === $shouldBeWritable) {
            echo "   {$c['g']}✓ PASS{$c['x']} - $dir: " . ($shouldBeWritable ? "writable" : "read-only") . "\n";
        } else {
            $issues[] = "$dir has incorrect permissions";
            echo "   {$c['r']}✗ FAIL{$c['x']} - $dir: incorrect permissions\n";
        }
    } else {
        $warnings[] = "$dir does not exist";
        echo "   {$c['y']}⚠ WARNING{$c['x']} - $dir: does not exist\n";
    }
}

echo "\n";

// Check 6: PHP Configuration
echo "6. PHP Configuration\n";

$phpSettings = [
    'display_errors' => ['value' => ini_get('display_errors'), 'expected' => '0', 'critical' => true],
    'error_reporting' => ['value' => error_reporting(), 'expected' => E_ALL & ~E_DEPRECATED & ~E_STRICT, 'critical' => false],
    'session.cookie_httponly' => ['value' => ini_get('session.cookie_httponly'), 'expected' => '1', 'critical' => true],
    'session.use_only_cookies' => ['value' => ini_get('session.use_only_cookies'), 'expected' => '1', 'critical' => true],
];

foreach ($phpSettings as $setting => $config) {
    if ($setting === 'error_reporting') {
        // Just show current value
        echo "   {$c['g']}✓{$c['x']} - $setting: " . $config['value'] . "\n";
    } else {
        if ($config['value'] == $config['expected']) {
            echo "   {$c['g']}✓ PASS{$c['x']} - $setting: {$config['value']}\n";
        } else {
            if ($config['critical']) {
                $issues[] = "PHP $setting is '{$config['value']}' (should be '{$config['expected']}')";
                echo "   {$c['r']}✗ FAIL{$c['x']} - $setting: {$config['value']} (should be {$config['expected']})\n";
            } else {
                $warnings[] = "PHP $setting is '{$config['value']}' (recommended: '{$config['expected']}')";
                echo "   {$c['y']}⚠ WARNING{$c['x']} - $setting: {$config['value']}\n";
            }
        }
    }
}

echo "\n";

// Check 7: Required Files
echo "7. Required Files and Directories\n";

$requiredFiles = [
    'config/app.php',
    'config/database.php',
    'includes/functions.php',
    'includes/security.php',
    'includes/session.php',
    'api/login.php',
    'api/register.php',
    'public/index.html'
];

$allFilesExist = true;
foreach ($requiredFiles as $file) {
    if (file_exists($file)) {
        echo "   {$c['g']}✓{$c['x']} - $file\n";
    } else {
        $issues[] = "Missing required file: $file";
        echo "   {$c['r']}✗{$c['x']} - $file (MISSING)\n";
        $allFilesExist = false;
    }
}

if ($allFilesExist) {
    $passed[] = "All required files exist";
}

echo "\n";

// Check 8: Development Files Cleanup
echo "8. Development Files Cleanup\n";

$devFiles = [
    'tests/',
    'TESTING_COMPLETE.php',
    'AUDIT_COMPLETE.php',
    'QUICK-START-TESTING.bat',
    'includes/i18n-usage-example.php',
    'public/i18n-demo.html'
];

$devFilesRemaining = [];
foreach ($devFiles as $file) {
    if (file_exists($file)) {
        $devFilesRemaining[] = $file;
        echo "   {$c['y']}⚠ WARNING{$c['x']} - $file still exists\n";
    }
}

if (empty($devFilesRemaining)) {
    $passed[] = "All development files removed";
    echo "   {$c['g']}✓ PASS{$c['x']} - All development files removed\n";
} else {
    $warnings[] = count($devFilesRemaining) . " development file(s) remaining";
    echo "\n   Run: deployment\\cleanup-dev-files.bat\n";
}

echo "\n";

// Summary
echo "═══════════════════════════════════════════════════════════════\n";
echo "  VERIFICATION SUMMARY\n";
echo "═══════════════════════════════════════════════════════════════\n\n";

echo "Passed Checks: " . count($passed) . "\n";
echo "{$c['y']}Warnings: " . count($warnings) . "{$c['x']}\n";
echo "{$c['r']}Critical Issues: " . count($issues) . "{$c['x']}\n\n";

if (count($issues) > 0) {
    echo "{$c['r']}CRITICAL ISSUES FOUND:{$c['x']}\n";
    foreach ($issues as $i => $issue) {
        echo "  " . ($i + 1) . ". $issue\n";
    }
    echo "\n";
}

if (count($warnings) > 0) {
    echo "{$c['y']}WARNINGS:{$c['x']}\n";
    foreach ($warnings as $i => $warning) {
        echo "  " . ($i + 1) . ". $warning\n";
    }
    echo "\n";
}

if (count($issues) === 0 && count($warnings) === 0) {
    echo "{$c['g']}✓ ALL CHECKS PASSED!{$c['x']}\n";
    echo "Your configuration is production-ready!\n\n";
    echo "Next steps:\n";
    echo "  1. Create deployment package: deployment\\create-deployment-package.bat\n";
    echo "  2. Review deployment checklist: DEPLOYMENT_CHECKLIST.php\n";
    echo "  3. Create final backup: database\\create-final-backup.bat\n";
} elseif (count($issues) === 0) {
    echo "{$c['y']}⚠ WARNINGS DETECTED{$c['x']}\n";
    echo "No critical issues, but review warnings above.\n\n";
    echo "You may proceed with deployment, but address warnings if possible.\n";
} else {
    echo "{$c['r']}✗ CRITICAL ISSUES DETECTED{$c['x']}\n";
    echo "Fix all critical issues before deploying to production!\n";
}

echo "\n";

// Generate report
$report = [
    'timestamp' => date('Y-m-d H:i:s'),
    'passed' => count($passed),
    'warnings' => count($warnings),
    'issues' => count($issues),
    'status' => count($issues) === 0 ? 'ready' : 'not_ready',
    'details' => [
        'passed' => $passed,
        'warnings' => $warnings,
        'issues' => $issues
    ]
];

file_put_contents(__DIR__ . '/production-config-report.json', json_encode($report, JSON_PRETTY_PRINT));
echo "Configuration report saved to: deployment/production-config-report.json\n\n";

exit(count($issues) > 0 ? 1 : 0);

