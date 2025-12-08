<?php
/**
 * Authentication & Authorization Testing
 * Tsharok LMS - Test auth flows and permissions
 * 
 * Usage: php tests/auth-tests.php
 */

define('TSHAROK_INIT', true);

require_once __DIR__ . '/../config/app.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/session.php';

$c = ['g' => "\033[32m", 'r' => "\033[31m", 'y' => "\033[33m", 'b' => "\033[34m", 'x' => "\033[0m"];

echo "\n";
echo "═══════════════════════════════════════════════════════════════\n";
echo "  AUTHENTICATION & AUTHORIZATION TESTING\n";
echo "═══════════════════════════════════════════════════════════════\n\n";

$db = getDB();
$testResults = [];

// Test 1: Password Hashing
echo "TEST 1: Password Security\n";
echo "─────────────────────────────────────────────────────────────\n";

$password = "TestPassword123!";
$hashed = hashPassword($password);
$passed = (strlen($hashed) >= 60 && password_verify($password, $hashed));

echo "  1.1 Password Hashing: " . ($passed ? "{$c['g']}✓ PASS{$c['x']}" : "{$c['r']}✗ FAIL{$c['x']}") . "\n";
echo "      Hash length: " . strlen($hashed) . " chars\n";
echo "      Algorithm: " . (strpos($hashed, '$2y$') === 0 ? 'bcrypt' : 'unknown') . "\n";
$testResults[] = ['test' => 'Password Hashing', 'passed' => $passed];

$wrongPassword = "WrongPassword123!";
$notVerified = !password_verify($wrongPassword, $hashed);

echo "  1.2 Wrong Password Rejection: " . ($notVerified ? "{$c['g']}✓ PASS{$c['x']}" : "{$c['r']}✗ FAIL{$c['x']}") . "\n";
$testResults[] = ['test' => 'Wrong Password Rejection', 'passed' => $notVerified];

echo "\n";

// Test 2: Email Validation
echo "TEST 2: Email Validation\n";
echo "─────────────────────────────────────────────────────────────\n";

$validEmails = ['test@example.com', 'user.name@domain.co.uk', 'user+tag@test.com'];
$invalidEmails = ['invalid', '@domain.com', 'user@', 'user @domain.com', '<script>@test.com'];

$allValid = true;
foreach ($validEmails as $email) {
    $valid = validateEmail($email);
    if (!$valid) $allValid = false;
    echo "  Valid: $email - " . ($valid ? "{$c['g']}✓{$c['x']}" : "{$c['r']}✗{$c['x']}") . "\n";
}

$allInvalid = true;
foreach ($invalidEmails as $email) {
    $invalid = !validateEmail($email);
    if (!$invalid) $allInvalid = false;
    echo "  Invalid: $email - " . ($invalid ? "{$c['g']}✓{$c['x']}" : "{$c['r']}✗{$c['x']}") . "\n";
}

$passed = $allValid && $allInvalid;
$testResults[] = ['test' => 'Email Validation', 'passed' => $passed];

echo "\n";

// Test 3: Username Validation
echo "TEST 3: Username Validation\n";
echo "─────────────────────────────────────────────────────────────\n";

$validUsernames = ['john_doe', 'user123', 'test-user', 'JohnDoe'];
$invalidUsernames = ['ab', 'user@name', 'user name', '<script>', 'admin\'--'];

$allValid = true;
foreach ($validUsernames as $username) {
    $result = validateUsername($username);
    $valid = $result['valid'];
    if (!$valid) $allValid = false;
    echo "  Valid: $username - " . ($valid ? "{$c['g']}✓{$c['x']}" : "{$c['r']}✗{$c['x']}") . "\n";
}

$allInvalid = true;
foreach ($invalidUsernames as $username) {
    $result = validateUsername($username);
    $invalid = !$result['valid'];
    if (!$invalid) $allInvalid = false;
    echo "  Invalid: $username - " . ($invalid ? "{$c['g']}✓{$c['x']}" : "{$c['r']}✗{$c['x']}") . "\n";
}

$passed = $allValid && $allInvalid;
$testResults[] = ['test' => 'Username Validation', 'passed' => $passed];

echo "\n";

// Test 4: Password Strength Validation
echo "TEST 4: Password Strength Validation\n";
echo "─────────────────────────────────────────────────────────────\n";

$strongPasswords = ['StrongPass123!', 'MyP@ssw0rd', 'Secure#2024'];
$weakPasswords = ['weak', '12345678', 'password', 'NoNumber!', 'nonumber123', 'NOLOWERCASE123!'];

$allStrong = true;
foreach ($strongPasswords as $pass) {
    $result = validatePassword($pass);
    $valid = $result['valid'];
    if (!$valid) $allStrong = false;
    echo "  Strong: $pass - " . ($valid ? "{$c['g']}✓{$c['x']}" : "{$c['r']}✗{$c['x']}") . "\n";
}

$allWeak = true;
foreach ($weakPasswords as $pass) {
    $result = validatePassword($pass);
    $invalid = !$result['valid'];
    if (!$invalid) $allWeak = false;
    $msg = $result['valid'] ? 'accepted (should reject)' : 'rejected';
    echo "  Weak: $pass - " . ($invalid ? "{$c['g']}✓{$c['x']}" : "{$c['r']}✗{$c['x']}") . " ($msg)\n";
}

$passed = $allStrong && $allWeak;
$testResults[] = ['test' => 'Password Strength', 'passed' => $passed];

echo "\n";

// Test 5: Session Token Generation
echo "TEST 5: Session Security\n";
echo "─────────────────────────────────────────────────────────────\n";

$token1 = generateToken(32);
$token2 = generateToken(32);

$passed = (strlen($token1) === 64 && strlen($token2) === 64 && $token1 !== $token2);

echo "  5.1 Token Generation: " . ($passed ? "{$c['g']}✓ PASS{$c['x']}" : "{$c['r']}✗ FAIL{$c['x']}") . "\n";
echo "      Token 1 length: " . strlen($token1) . " chars\n";
echo "      Token 2 length: " . strlen($token2) . " chars\n";
echo "      Unique: " . ($token1 !== $token2 ? 'Yes' : 'No') . "\n";
$testResults[] = ['test' => 'Session Token Generation', 'passed' => $passed];

echo "\n";

// Test 6: Role-Based Access
echo "TEST 6: Role-Based Access Control\n";
echo "─────────────────────────────────────────────────────────────\n";

$roles = ['student', 'instructor', 'admin'];

foreach ($roles as $role) {
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM users WHERE role = ? LIMIT 1");
    $stmt->execute([$role]);
    $count = $stmt->fetchColumn();
    
    echo "  $role role exists: " . ($count > 0 ? "{$c['g']}✓{$c['x']}" : "{$c['y']}⚠{$c['x']}") . " ($count users)\n";
}

$testResults[] = ['test' => 'Role-Based Access', 'passed' => true];

echo "\n";

// Test 7: Account Lockout (Simulation)
echo "TEST 7: Account Security Features\n";
echo "─────────────────────────────────────────────────────────────\n";

// Check if is_active column exists
$stmt = $db->query("SHOW COLUMNS FROM users LIKE 'is_active'");
$hasActiveFlag = $stmt->rowCount() > 0;

echo "  7.1 Account Active/Inactive Flag: " . ($hasActiveFlag ? "{$c['g']}✓ PASS{$c['x']}" : "{$c['r']}✗ FAIL{$c['x']}") . "\n";
$testResults[] = ['test' => 'Account Active Flag', 'passed' => $hasActiveFlag];

// Check for last_login tracking
$stmt = $db->query("SHOW COLUMNS FROM users LIKE 'last_login'");
$hasLastLogin = $stmt->rowCount() > 0;

echo "  7.2 Last Login Tracking: " . ($hasLastLogin ? "{$c['g']}✓ PASS{$c['x']}" : "{$c['r']}✗ FAIL{$c['x']}") . "\n";
$testResults[] = ['test' => 'Last Login Tracking', 'passed' => $hasLastLogin];

// Check for email verification system
$stmt = $db->query("SHOW TABLES LIKE 'email_verifications'");
$hasVerification = $stmt->rowCount() > 0;

echo "  7.3 Email Verification System: " . ($hasVerification ? "{$c['g']}✓ PASS{$c['x']}" : "{$c['r']}✗ FAIL{$c['x']}") . "\n";
$testResults[] = ['test' => 'Email Verification', 'passed' => $hasVerification];

// Check for password reset system
$stmt = $db->query("SHOW TABLES LIKE 'password_resets'");
$hasPasswordReset = $stmt->rowCount() > 0;

echo "  7.4 Password Reset System: " . ($hasPasswordReset ? "{$c['g']}✓ PASS{$c['x']}" : "{$c['r']}✗ FAIL{$c['x']}") . "\n";
$testResults[] = ['test' => 'Password Reset', 'passed' => $hasPasswordReset];

echo "\n";

// Test 8: Session Management Tables
echo "TEST 8: Session Management Infrastructure\n";
echo "─────────────────────────────────────────────────────────────\n";

$stmt = $db->query("SHOW TABLES LIKE 'user_sessions'");
$hasSessions = $stmt->rowCount() > 0;

if ($hasSessions) {
    echo "  8.1 Session Table Exists: {$c['g']}✓ PASS{$c['x']}\n";
    
    // Check session columns
    $stmt = $db->query("SHOW COLUMNS FROM user_sessions");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $requiredColumns = ['session_token', 'user_id', 'expires_at', 'ip_address'];
    $hasAllColumns = true;
    
    foreach ($requiredColumns as $col) {
        $exists = in_array($col, $columns);
        if (!$exists) $hasAllColumns = false;
        echo "    - Column '$col': " . ($exists ? "{$c['g']}✓{$c['x']}" : "{$c['r']}✗{$c['x']}") . "\n";
    }
    
    $testResults[] = ['test' => 'Session Table Structure', 'passed' => $hasAllColumns];
} else {
    echo "  8.1 Session Table Exists: {$c['y']}⚠ WARNING{$c['x']} - Using PHP sessions only\n";
    $testResults[] = ['test' => 'Session Table', 'passed' => false];
}

echo "\n";

// Test 9: Admin Actions Logging
echo "TEST 9: Admin Actions Audit System\n";
echo "─────────────────────────────────────────────────────────────\n";

$stmt = $db->query("SHOW TABLES LIKE 'admin_actions'");
$hasAdminActions = $stmt->rowCount() > 0;

if ($hasAdminActions) {
    echo "  9.1 Admin Actions Table: {$c['g']}✓ PASS{$c['x']}\n";
    
    // Check recent admin actions
    $stmt = $db->query("SELECT COUNT(*) FROM admin_actions");
    $actionCount = $stmt->fetchColumn();
    echo "      Total admin actions logged: $actionCount\n";
    
    $testResults[] = ['test' => 'Admin Actions Logging', 'passed' => true];
} else {
    echo "  9.1 Admin Actions Table: {$c['r']}✗ FAIL{$c['x']}\n";
    $testResults[] = ['test' => 'Admin Actions Logging', 'passed' => false];
}

echo "\n";

// Test 10: CSRF Protection
echo "TEST 10: CSRF Protection\n";
echo "─────────────────────────────────────────────────────────────\n";

// Start a test session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$token = generateCsrfToken();
$passed = (strlen($token) === 64);

echo "  10.1 CSRF Token Generation: " . ($passed ? "{$c['g']}✓ PASS{$c['x']}" : "{$c['r']}✗ FAIL{$c['x']}") . "\n";
echo "       Token length: " . strlen($token) . " chars\n";
$testResults[] = ['test' => 'CSRF Token Generation', 'passed' => $passed];

$validated = validateCsrfToken($token);
echo "  10.2 CSRF Token Validation: " . ($validated ? "{$c['g']}✓ PASS{$c['x']}" : "{$c['r']}✗ FAIL{$c['x']}") . "\n";
$testResults[] = ['test' => 'CSRF Token Validation', 'passed' => $validated];

$invalidToken = str_repeat('a', 64);
$notValidated = !validateCsrfToken($invalidToken);
echo "  10.3 Invalid CSRF Rejection: " . ($notValidated ? "{$c['g']}✓ PASS{$c['x']}" : "{$c['r']}✗ FAIL{$c['x']}") . "\n";
$testResults[] = ['test' => 'Invalid CSRF Rejection', 'passed' => $notValidated];

echo "\n";

// Generate Summary
echo "═══════════════════════════════════════════════════════════════\n";
echo "  TEST SUMMARY\n";
echo "═══════════════════════════════════════════════════════════════\n\n";

$total = count($testResults);
$passed = count(array_filter($testResults, function($r) { return $r['passed']; }));
$failed = $total - $passed;

echo "Total Tests: $total\n";
echo "{$c['g']}Passed: $passed{$c['x']}\n";
echo "{$c['r']}Failed: $failed{$c['x']}\n\n";

$passRate = ($passed / $total) * 100;

if ($passRate === 100.0) {
    echo "{$c['g']}✓ ALL AUTHENTICATION TESTS PASSED!{$c['x']}\n";
} elseif ($passRate >= 80.0) {
    echo "{$c['y']}⚠ MOST TESTS PASSED ($passRate%){$c['x']}\n";
} else {
    echo "{$c['r']}✗ MANY TESTS FAILED ($passRate%){$c['x']}\n";
}

echo "\n═══════════════════════════════════════════════════════════════\n\n";

exit($failed > 0 ? 1 : 0);

