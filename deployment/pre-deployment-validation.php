<?php
/**
 * Pre-Deployment Validation Script
 * Comprehensive validation before going live
 * 
 * Usage: php deployment/pre-deployment-validation.php
 */

define('TSHAROK_INIT', true);

require_once __DIR__ . '/../config/app.php';
require_once __DIR__ . '/../config/database.php';

$c = ['g' => "\033[32m", 'r' => "\033[31m", 'y' => "\033[33m", 'b' => "\033[34m", 'x' => "\033[0m"];

echo "\n";
echo "═══════════════════════════════════════════════════════════════\n";
echo "  PRE-DEPLOYMENT VALIDATION\n";
echo "═══════════════════════════════════════════════════════════════\n\n";

$validationResults = [
    'critical' => [],
    'warnings' => [],
    'passed' => []
];

// TEST 1: Database Connection
echo "1. Testing Database Connection\n";
echo "─────────────────────────────────────────────────────────────\n";

try {
    $db = getDB();
    $stmt = $db->query("SELECT VERSION()");
    $version = $stmt->fetchColumn();
    
    echo "   {$c['g']}✓ PASS{$c['x']} - Database connection successful\n";
    echo "   MySQL Version: $version\n";
    $validationResults['passed'][] = "Database connection";
} catch (Exception $e) {
    echo "   {$c['r']}✗ FAIL{$c['x']} - Database connection failed\n";
    echo "   Error: " . $e->getMessage() . "\n";
    $validationResults['critical'][] = "Database connection failed: " . $e->getMessage();
}

echo "\n";

// TEST 2: Required Tables
echo "2. Verifying Database Schema\n";
echo "─────────────────────────────────────────────────────────────\n";

$requiredTables = ['users', 'courses', 'content', 'enrollments', 'ratings', 'admin_actions', 'user_sessions'];

try {
    $stmt = $db->query("SHOW TABLES");
    $existingTables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $missingTables = array_diff($requiredTables, $existingTables);
    
    if (empty($missingTables)) {
        echo "   {$c['g']}✓ PASS{$c['x']} - All required tables exist\n";
        echo "   Total tables: " . count($existingTables) . "\n";
        $validationResults['passed'][] = "Database schema complete";
    } else {
        echo "   {$c['r']}✗ FAIL{$c['x']} - Missing tables: " . implode(', ', $missingTables) . "\n";
        $validationResults['critical'][] = "Missing database tables: " . implode(', ', $missingTables);
    }
} catch (Exception $e) {
    echo "   {$c['r']}✗ FAIL{$c['x']} - Could not verify schema\n";
    $validationResults['critical'][] = "Schema verification failed";
}

echo "\n";

// TEST 3: Admin User Exists
echo "3. Verifying Admin User\n";
echo "─────────────────────────────────────────────────────────────\n";

try {
    $stmt = $db->query("SELECT COUNT(*) FROM users WHERE role = 'admin'");
    $adminCount = $stmt->fetchColumn();
    
    if ($adminCount > 0) {
        echo "   {$c['g']}✓ PASS{$c['x']} - Admin user(s) exist ($adminCount)\n";
        $validationResults['passed'][] = "Admin user configured";
    } else {
        echo "   {$c['r']}✗ FAIL{$c['x']} - No admin users found\n";
        echo "   Create admin: Run database/create_admin_user.sql\n";
        $validationResults['critical'][] = "No admin users found";
    }
} catch (Exception $e) {
    echo "   {$c['y']}⚠ WARNING{$c['x']} - Could not verify admin user\n";
    $validationResults['warnings'][] = "Admin user verification failed";
}

echo "\n";

// TEST 4: File Permissions
echo "4. Checking File Permissions\n";
echo "─────────────────────────────────────────────────────────────\n";

$writableDirs = ['uploads/staging', 'uploads/content', 'uploads/rejected', 'logs'];

foreach ($writableDirs as $dir) {
    if (file_exists($dir)) {
        if (is_writable($dir)) {
            echo "   {$c['g']}✓{$c['x']} - $dir is writable\n";
        } else {
            echo "   {$c['r']}✗{$c['x']} - $dir is NOT writable\n";
            $validationResults['critical'][] = "$dir is not writable";
        }
    } else {
        echo "   {$c['y']}⚠{$c['x']} - $dir does not exist\n";
        $validationResults['warnings'][] = "$dir does not exist";
    }
}

echo "\n";

// TEST 5: Critical API Endpoints
echo "5. Testing Critical API Endpoints\n";
echo "─────────────────────────────────────────────────────────────\n";

$endpoints = [
    'api/login.php' => 'Login',
    'api/register.php' => 'Registration',
    'api/courses.php' => 'Courses',
    'api/check-auth.php' => 'Authentication Check'
];

foreach ($endpoints as $file => $name) {
    if (file_exists($file)) {
        echo "   {$c['g']}✓{$c['x']} - $name endpoint exists\n";
    } else {
        echo "   {$c['r']}✗{$c['x']} - $name endpoint missing\n";
        $validationResults['critical'][] = "$name endpoint missing";
    }
}

echo "\n";

// TEST 6: Security Configuration
echo "6. Security Configuration Check\n";
echo "─────────────────────────────────────────────────────────────\n";

$securityChecks = [
    ['name' => 'APP_ENV', 'value' => APP_ENV, 'expected' => 'production'],
    ['name' => 'APP_DEBUG', 'value' => APP_DEBUG, 'expected' => false],
    ['name' => 'CSRF_PROTECTION_ENABLED', 'value' => CSRF_PROTECTION_ENABLED, 'expected' => true],
];

foreach ($securityChecks as $check) {
    if ($check['value'] === $check['expected']) {
        echo "   {$c['g']}✓{$c['x']} - {$check['name']}: " . var_export($check['value'], true) . "\n";
    } else {
        echo "   {$c['y']}⚠{$c['x']} - {$check['name']}: " . var_export($check['value'], true);
        echo " (expected: " . var_export($check['expected'], true) . ")\n";
        $validationResults['warnings'][] = "{$check['name']} is not set to recommended value";
    }
}

echo "\n";

// TEST 7: Language Files
echo "7. Verifying Language Files\n";
echo "─────────────────────────────────────────────────────────────\n";

$languages = ['en', 'ar'];
$namespaces = ['common', 'auth', 'courses', 'admin'];

$missingLangFiles = [];
foreach ($languages as $lang) {
    foreach ($namespaces as $namespace) {
        $file = "languages/$lang/$namespace.json";
        if (!file_exists($file)) {
            $missingLangFiles[] = $file;
        }
    }
}

if (empty($missingLangFiles)) {
    echo "   {$c['g']}✓ PASS{$c['x']} - All language files exist\n";
    $validationResults['passed'][] = "Language files complete";
} else {
    echo "   {$c['y']}⚠ WARNING{$c['x']} - Missing: " . implode(', ', $missingLangFiles) . "\n";
    $validationResults['warnings'][] = "Some language files missing";
}

echo "\n";

// TEST 8: Backup System
echo "8. Verifying Backup System\n";
echo "─────────────────────────────────────────────────────────────\n";

$backupFiles = [
    'database/backup-full.bat',
    'database/restore-backup.bat',
    'database/verify-backup.php'
];

$backupSystemComplete = true;
foreach ($backupFiles as $file) {
    if (file_exists($file)) {
        echo "   {$c['g']}✓{$c['x']} - " . basename($file) . "\n";
    } else {
        echo "   {$c['y']}⚠{$c['x']} - " . basename($file) . " missing\n";
        $backupSystemComplete = false;
    }
}

if ($backupSystemComplete) {
    $validationResults['passed'][] = "Backup system configured";
} else {
    $validationResults['warnings'][] = "Backup system incomplete";
}

echo "\n";

// TEST 9: Upload Directories
echo "9. Checking Upload Directory Structure\n";
echo "─────────────────────────────────────────────────────────────\n";

$uploadDirs = ['uploads/staging', 'uploads/content', 'uploads/rejected', 'uploads/backup'];

$allDirsExist = true;
foreach ($uploadDirs as $dir) {
    if (file_exists($dir) && is_dir($dir)) {
        echo "   {$c['g']}✓{$c['x']} - $dir\n";
    } else {
        echo "   {$c['r']}✗{$c['x']} - $dir missing\n";
        $validationResults['critical'][] = "$dir missing";
        $allDirsExist = false;
    }
}

if ($allDirsExist) {
    $validationResults['passed'][] = "Upload directories configured";
}

echo "\n";

// TEST 10: Configuration Files
echo "10. Verifying Configuration Files\n";
echo "─────────────────────────────────────────────────────────────\n";

$configFiles = ['config/app.php', 'config/database.php'];

foreach ($configFiles as $file) {
    if (file_exists($file) && is_readable($file)) {
        $size = filesize($file);
        echo "   {$c['g']}✓{$c['x']} - $file (" . round($size/1024, 2) . "KB)\n";
    } else {
        echo "   {$c['r']}✗{$c['x']} - $file missing or not readable\n";
        $validationResults['critical'][] = "$file missing";
    }
}

echo "\n";

// FINAL SUMMARY
echo "═══════════════════════════════════════════════════════════════\n";
echo "  VALIDATION SUMMARY\n";
echo "═══════════════════════════════════════════════════════════════\n\n";

$totalPassed = count($validationResults['passed']);
$totalWarnings = count($validationResults['warnings']);
$totalCritical = count($validationResults['critical']);

echo "Passed: {$c['g']}$totalPassed{$c['x']}\n";
echo "Warnings: {$c['y']}$totalWarnings{$c['x']}\n";
echo "Critical Issues: {$c['r']}$totalCritical{$c['x']}\n\n";

if ($totalCritical > 0) {
    echo "{$c['r']}✗ DEPLOYMENT NOT RECOMMENDED{$c['x']}\n\n";
    echo "Critical issues found:\n";
    foreach ($validationResults['critical'] as $i => $issue) {
        echo "  " . ($i + 1) . ". $issue\n";
    }
    echo "\nFix all critical issues before deploying!\n";
} elseif ($totalWarnings > 0) {
    echo "{$c['y']}⚠ DEPLOYMENT POSSIBLE WITH CAUTION{$c['x']}\n\n";
    echo "Warnings found:\n";
    foreach ($validationResults['warnings'] as $i => $warning) {
        echo "  " . ($i + 1) . ". $warning\n";
    }
    echo "\nAddress warnings if possible before deploying.\n";
} else {
    echo "{$c['g']}✓ READY FOR DEPLOYMENT!{$c['x']}\n\n";
    echo "All validation checks passed successfully.\n";
    echo "Your application is ready for production deployment.\n";
}

echo "\n═══════════════════════════════════════════════════════════════\n\n";

// Save report
$report = [
    'timestamp' => date('Y-m-d H:i:s'),
    'status' => $totalCritical === 0 ? ($totalWarnings === 0 ? 'ready' : 'warnings') : 'critical',
    'passed' => $totalPassed,
    'warnings' => $totalWarnings,
    'critical' => $totalCritical,
    'details' => $validationResults
];

file_put_contents(__DIR__ . '/validation-report.json', json_encode($report, JSON_PRETTY_PRINT));
echo "Validation report saved to: deployment/validation-report.json\n\n";

exit($totalCritical > 0 ? 1 : 0);

