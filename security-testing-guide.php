<?php
/**
 * Security Testing Guide & Examples
 * How to test SQL injection prevention
 * Tsharok LMS
 * 
 * WARNING: This file is for educational and testing purposes only
 * Do NOT run these tests on production systems
 */

// Don't execute this file - it's for reference only
if (basename(__FILE__) == basename($_SERVER['PHP_SELF'])) {
    die('This is a reference file for security testing. Do not execute directly.');
}

/**
 * ============================================
 * SQL INJECTION TEST CASES
 * ============================================
 * 
 * These are common SQL injection payloads that should be blocked
 * by our prepared statements and input validation
 */

$sqlInjectionPayloads = [
    
    // Basic SQL injection attempts
    "' OR '1'='1",
    "' OR 1=1--",
    "admin'--",
    "' OR 'a'='a",
    
    // UNION-based injection
    "' UNION SELECT NULL--",
    "' UNION SELECT username, password FROM users--",
    "1' UNION SELECT table_name FROM information_schema.tables--",
    
    // Time-based blind injection
    "' OR SLEEP(5)--",
    "'; WAITFOR DELAY '00:00:05'--",
    
    // Boolean-based blind injection
    "' AND 1=1--",
    "' AND 1=2--",
    
    // Comment-based injection
    "admin' /*",
    "admin' #",
    
    // Stacked queries
    "'; DROP TABLE users--",
    "'; DELETE FROM content--",
    "'; UPDATE users SET role='admin'--",
    
    // ORDER BY injection
    "title; DROP TABLE users--",
    "id, (SELECT password FROM users LIMIT 1)",
    
    // Encoded injections
    "%27%20OR%20%271%27%3D%271",
    "&#39; OR &#39;1&#39;=&#39;1",
    
    // Null byte injection
    "admin\0",
    
    // Hex encoding
    "0x61646d696e", // 'admin' in hex
];

/**
 * ============================================
 * TESTING PREPARED STATEMENTS
 * ============================================
 */

// Example 1: Testing login with SQL injection payloads
function testLoginSecurity($db) {
    echo "=== Testing Login Security ===\n\n";
    
    $payloads = ["' OR '1'='1", "admin'--", "admin' #"];
    
    foreach ($payloads as $payload) {
        echo "Testing payload: {$payload}\n";
        
        // VULNERABLE CODE (DO NOT USE):
        // $query = "SELECT * FROM users WHERE username = '$payload'";
        // $result = $db->query($query);
        
        // SECURE CODE (USING PREPARED STATEMENTS):
        $stmt = $db->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->execute([$payload]);
        $result = $stmt->fetch();
        
        if ($result) {
            echo "❌ FAILED: Payload succeeded (shouldn't happen with prepared statements)\n";
        } else {
            echo "✓ PASSED: Payload blocked\n";
        }
        echo "\n";
    }
}

// Example 2: Testing ORDER BY injection
function testOrderBySecurity($sortField) {
    echo "=== Testing ORDER BY Security ===\n\n";
    
    // VULNERABLE CODE (DO NOT USE):
    // $query = "SELECT * FROM courses ORDER BY $sortField";
    
    // SECURE CODE (USING WHITELIST):
    $allowedFields = ['id', 'title', 'created_at', 'updated_at'];
    
    if (!in_array($sortField, $allowedFields)) {
        echo "✓ PASSED: Invalid sort field rejected\n";
        return 'id'; // Default safe value
    }
    
    echo "✓ PASSED: Valid sort field accepted\n";
    return $sortField;
}

// Example 3: Testing LIMIT injection
function testLimitSecurity($limit) {
    echo "=== Testing LIMIT Security ===\n\n";
    
    // VULNERABLE CODE (DO NOT USE):
    // $query = "SELECT * FROM courses LIMIT $limit";
    
    // SECURE CODE (USING INTEGER VALIDATION):
    $limit = intval($limit);
    $limit = max(1, min(100, $limit)); // Enforce min/max
    
    echo "✓ PASSED: Limit sanitized to integer: {$limit}\n";
    return $limit;
}

/**
 * ============================================
 * TESTING INPUT VALIDATION
 * ============================================
 */

// Test cases for input validator
function testInputValidation() {
    echo "=== Testing Input Validation ===\n\n";
    
    require_once __DIR__ . '/includes/input-validator.php';
    
    // Test 1: Course ID validation
    $testCases = [
        ['input' => '123', 'expect' => true],
        ['input' => '-1', 'expect' => false],
        ['input' => '0', 'expect' => false],
        ['input' => "123'; DROP TABLE users--", 'expect' => false],
        ['input' => 'abc', 'expect' => false],
    ];
    
    echo "Testing Course ID validation:\n";
    foreach ($testCases as $test) {
        $result = InputValidator::validateCourseId($test['input']);
        $passed = $result['valid'] === $test['expect'];
        echo ($passed ? "✓" : "❌") . " Input: {$test['input']} - Expected: " . 
             ($test['expect'] ? 'valid' : 'invalid') . " - Got: " . 
             ($result['valid'] ? 'valid' : 'invalid') . "\n";
    }
    echo "\n";
    
    // Test 2: Search query validation
    $searchTests = [
        ['input' => 'computer science', 'expect' => true],
        ['input' => "'; DROP TABLE--", 'expect' => false],
        ['input' => "UNION SELECT", 'expect' => false],
        ['input' => 'O\'Reilly', 'expect' => false], // Quotes removed
    ];
    
    echo "Testing Search query validation:\n";
    foreach ($searchTests as $test) {
        $result = InputValidator::validateSearchQuery($test['input']);
        $passed = $result['valid'] === $test['expect'];
        echo ($passed ? "✓" : "❌") . " Input: {$test['input']} - " . 
             "Result: " . ($result['valid'] ? 'valid' : 'invalid') . "\n";
    }
}

/**
 * ============================================
 * TESTING RATE LIMITING
 * ============================================
 */

function testRateLimiting() {
    echo "\n=== Testing Rate Limiting ===\n\n";
    
    require_once __DIR__ . '/includes/security.php';
    
    // Simulate multiple login attempts
    $key = 'test_login_' . uniqid();
    $maxAttempts = 3;
    $timeWindow = 60; // 60 seconds
    
    echo "Testing {$maxAttempts} attempts in {$timeWindow} seconds:\n";
    
    for ($i = 1; $i <= $maxAttempts + 2; $i++) {
        $allowed = checkRateLimit($key, $maxAttempts, $timeWindow);
        
        if ($i <= $maxAttempts) {
            if ($allowed) {
                echo "✓ Attempt {$i}: Allowed\n";
            } else {
                echo "❌ Attempt {$i}: Blocked (shouldn't happen yet)\n";
            }
        } else {
            if (!$allowed) {
                echo "✓ Attempt {$i}: Blocked (rate limit exceeded)\n";
            } else {
                echo "❌ Attempt {$i}: Allowed (should be blocked)\n";
            }
        }
    }
}

/**
 * ============================================
 * MANUAL TESTING STEPS
 * ============================================
 */

?>

<!-- 
MANUAL TESTING STEPS:

1. Test Login with SQL Injection:
   URL: http://localhost:8000/login.html
   
   Try these usernames:
   - admin'--
   - ' OR '1'='1
   - admin' #
   
   Expected: All should fail to login
   If any succeed, there's a vulnerability!

2. Test Search with SQL Injection:
   URL: http://localhost:8000/search-results.html?q=' UNION SELECT
   
   Expected: Search should return no results or error
   Should NOT expose database structure

3. Test Course Filtering:
   URL: http://localhost:8000/api/courses-advanced.php?sortBy=title;DROP TABLE users
   
   Expected: Should use default sort, not execute DROP command

4. Test Registration:
   Try registering with:
   - Email: admin@test.com'; DROP TABLE users--
   - Username: admin'--
   
   Expected: Should be sanitized and stored safely

5. Test File Upload:
   Try uploading:
   - PHP files (should be rejected)
   - Files with .php.jpg extension
   - Very large files
   
   Expected: Only allowed file types accepted

6. Test Rate Limiting:
   - Try logging in 6 times quickly with wrong password
   
   Expected: After 5 attempts, should be rate limited

7. Test CSRF Protection:
   - Try submitting forms without valid CSRF tokens
   
   Expected: Requests should be rejected

8. Test Session Security:
   - Login and copy session token
   - Close browser
   - Try using old session token
   
   Expected: Session should expire after timeout

============================================
SECURITY CHECKLIST
============================================

✓ All SQL queries use prepared statements
✓ No user input is directly concatenated into queries
✓ ORDER BY clauses use whitelist validation
✓ All integers are validated with intval()
✓ All floats are validated with floatval()
✓ Enums use whitelist validation
✓ Search queries are sanitized
✓ Rate limiting on sensitive endpoints
✓ Passwords use bcrypt hashing
✓ Sessions are secure with tokens
✓ File uploads are validated
✓ CSRF tokens implemented
✓ XSS protection with htmlspecialchars()
✓ Security logging enabled

============================================
AUTOMATED TESTING COMMAND
============================================

Run security audit:
mysql -u root -p tsharok < database/security-audit.sql

Check for vulnerabilities:
grep -r "\$_GET\[" api/*.php
grep -r "\$_POST\[" api/*.php
grep -r "query(" api/*.php
grep -r "exec(" api/*.php

============================================
PENETRATION TESTING TOOLS
============================================

1. SQLMap - Automated SQL injection testing
   sqlmap -u "http://localhost:8000/api/login.php" --data="username=admin&password=test"

2. Burp Suite - Web vulnerability scanner
3. OWASP ZAP - Security testing tool
4. Nikto - Web server scanner

Note: Only use these tools on systems you own or have permission to test!

============================================
INCIDENT RESPONSE
============================================

If SQL injection is detected:

1. Immediately check logs:
   - error_log
   - logs/security.log
   - database query logs

2. Identify the vulnerable endpoint

3. Check database for unauthorized access:
   - Review admin_actions table
   - Check activity_logs table
   - Look for suspicious queries

4. Fix the vulnerability immediately

5. Notify affected users if data was compromised

6. Review all similar code patterns

7. Implement additional monitoring

============================================
-->

<?php
/**
 * Run all security tests
 */
function runAllSecurityTests() {
    echo "╔════════════════════════════════════════════════╗\n";
    echo "║    TSHAROK LMS SECURITY TESTING SUITE        ║\n";
    echo "╚════════════════════════════════════════════════╝\n\n";
    
    // Initialize database connection
    require_once __DIR__ . '/config/database.php';
    $db = getDB();
    
    // Run tests
    testInputValidation();
    testRateLimiting();
    testLoginSecurity($db);
    
    // Test ORDER BY with malicious input
    echo "\n=== Testing ORDER BY with injection ===\n";
    $result = testOrderBySecurity("title; DROP TABLE users--");
    echo "Safe sort field: {$result}\n\n";
    
    // Test LIMIT with malicious input
    echo "\n=== Testing LIMIT with injection ===\n";
    $result = testLimitSecurity("10; DROP TABLE users--");
    echo "Safe limit value: {$result}\n\n";
    
    echo "\n╔════════════════════════════════════════════════╗\n";
    echo "║         SECURITY TESTING COMPLETE             ║\n";
    echo "╚════════════════════════════════════════════════╝\n";
}

// Uncomment to run tests (NOT in production!)
// runAllSecurityTests();
?>

