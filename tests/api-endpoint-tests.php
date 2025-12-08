<?php
/**
 * API Endpoint Testing Suite
 * Tsharok LMS - Test all API endpoints with various scenarios
 * 
 * Usage: php tests/api-endpoint-tests.php
 */

define('TSHAROK_INIT', true);

require_once __DIR__ . '/../config/app.php';

// Colors
$c = ['g' => "\033[32m", 'r' => "\033[31m", 'y' => "\033[33m", 'b' => "\033[34m", 'x' => "\033[0m"];

echo "\n";
echo "═══════════════════════════════════════════════════════════════\n";
echo "  API ENDPOINT TESTING SUITE\n";
echo "═══════════════════════════════════════════════════════════════\n\n";

$baseUrl = APP_URL;
$testResults = [];

/**
 * Helper function to make API request
 */
function makeApiRequest($endpoint, $method = 'GET', $data = null, $headers = []) {
    global $baseUrl;
    
    $ch = curl_init();
    $url = $baseUrl . $endpoint;
    
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $defaultHeaders = ['Content-Type: application/json'];
    $allHeaders = array_merge($defaultHeaders, $headers);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $allHeaders);
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
    } elseif ($method === 'PUT') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
    } elseif ($method === 'DELETE') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    
    curl_close($ch);
    
    return [
        'code' => $httpCode,
        'body' => $response,
        'json' => json_decode($response, true),
        'error' => $error
    ];
}

// Test 1: Registration API
echo "TEST 1: Registration API\n";
echo "─────────────────────────────────────────────────────────────\n";

$validRegistration = [
    'firstName' => 'API',
    'lastName' => 'Test',
    'username' => 'apitest_' . time(),
    'email' => 'apitest' . time() . '@test.com',
    'password' => 'TestPassword123!',
    'confirmPassword' => 'TestPassword123!',
    'role' => 'student',
    'major' => 1,
    'phone' => '1234567890'
];

$response = makeApiRequest('/api/register.php', 'POST', $validRegistration);
$passed = ($response['code'] === 200 && isset($response['json']['success']));

echo "  1.1 Valid Registration: " . ($passed ? "{$c['g']}✓ PASS{$c['x']}" : "{$c['r']}✗ FAIL{$c['x']}") . " (HTTP {$response['code']})\n";
if ($passed && $response['json']['success']) {
    echo "      Message: {$response['json']['message']}\n";
}
$testResults[] = ['test' => 'Valid Registration', 'passed' => $passed];

// Test SQL injection in registration
$sqlInjection = array_merge($validRegistration, [
    'username' => "admin'--",
    'email' => 'sql' . time() . '@test.com'
]);

$response = makeApiRequest('/api/register.php', 'POST', $sqlInjection);
$passed = ($response['code'] === 200 && (!isset($response['json']['success']) || !$response['json']['success']));

echo "  1.2 SQL Injection Prevention: " . ($passed ? "{$c['g']}✓ PASS{$c['x']}" : "{$c['r']}✗ FAIL{$c['x']}") . "\n";
$testResults[] = ['test' => 'SQL Injection in Registration', 'passed' => $passed];

// Test weak password
$weakPassword = array_merge($validRegistration, [
    'username' => 'weakpass_' . time(),
    'email' => 'weak' . time() . '@test.com',
    'password' => '123',
    'confirmPassword' => '123'
]);

$response = makeApiRequest('/api/register.php', 'POST', $weakPassword);
$passed = (!isset($response['json']['success']) || !$response['json']['success']);

echo "  1.3 Weak Password Rejection: " . ($passed ? "{$c['g']}✓ PASS{$c['x']}" : "{$c['r']}✗ FAIL{$c['x']}") . "\n";
$testResults[] = ['test' => 'Weak Password Rejection', 'passed' => $passed];

echo "\n";

// Test 2: Login API
echo "TEST 2: Login API\n";
echo "─────────────────────────────────────────────────────────────\n";

// Test with invalid credentials
$invalidLogin = [
    'identifier' => 'nonexistent@test.com',
    'password' => 'WrongPassword123!'
];

$response = makeApiRequest('/api/login.php', 'POST', $invalidLogin);
$passed = (!isset($response['json']['success']) || !$response['json']['success']);

echo "  2.1 Invalid Credentials Rejection: " . ($passed ? "{$c['g']}✓ PASS{$c['x']}" : "{$c['r']}✗ FAIL{$c['x']}") . "\n";
$testResults[] = ['test' => 'Invalid Login Rejection', 'passed' => $passed];

// Test SQL injection in login
$sqlInjectionLogin = [
    'identifier' => "admin' OR '1'='1",
    'password' => "password' OR '1'='1"
];

$response = makeApiRequest('/api/login.php', 'POST', $sqlInjectionLogin);
$passed = (!isset($response['json']['success']) || !$response['json']['success']);

echo "  2.2 SQL Injection in Login: " . ($passed ? "{$c['g']}✓ PASS{$c['x']}" : "{$c['r']}✗ FAIL{$c['x']}") . "\n";
$testResults[] = ['test' => 'SQL Injection in Login', 'passed' => $passed];

// Test empty credentials
$emptyLogin = [
    'identifier' => '',
    'password' => ''
];

$response = makeApiRequest('/api/login.php', 'POST', $emptyLogin);
$passed = (!isset($response['json']['success']) || !$response['json']['success']);

echo "  2.3 Empty Credentials Rejection: " . ($passed ? "{$c['g']}✓ PASS{$c['x']}" : "{$c['r']}✗ FAIL{$c['x']}") . "\n";
$testResults[] = ['test' => 'Empty Credentials', 'passed' => $passed];

echo "\n";

// Test 3: Search API
echo "TEST 3: Search API\n";
echo "─────────────────────────────────────────────────────────────\n";

// Valid search
$response = makeApiRequest('/api/search.php?q=programming&page=1&limit=10', 'GET');
$passed = ($response['code'] === 200);

echo "  3.1 Valid Search Query: " . ($passed ? "{$c['g']}✓ PASS{$c['x']}" : "{$c['r']}✗ FAIL{$c['x']}") . " (HTTP {$response['code']})\n";
$testResults[] = ['test' => 'Valid Search', 'passed' => $passed];

// SQL injection in search
$response = makeApiRequest('/api/search.php?q=' . urlencode("'; DROP TABLE courses--") . '&page=1', 'GET');
$passed = ($response['code'] === 200); // Should handle gracefully

echo "  3.2 SQL Injection in Search: " . ($passed ? "{$c['g']}✓ PASS{$c['x']}" : "{$c['r']}✗ FAIL{$c['x']}") . "\n";
$testResults[] = ['test' => 'SQL Injection in Search', 'passed' => $passed];

// XSS in search
$response = makeApiRequest('/api/search.php?q=' . urlencode('<script>alert("xss")</script>'), 'GET');
$passed = ($response['code'] === 200 && !strpos($response['body'], '<script>'));

echo "  3.3 XSS Prevention in Search: " . ($passed ? "{$c['g']}✓ PASS{$c['x']}" : "{$c['r']}✗ FAIL{$c['x']}") . "\n";
$testResults[] = ['test' => 'XSS in Search', 'passed' => $passed];

// Invalid pagination
$response = makeApiRequest('/api/search.php?page=-1&limit=999999', 'GET');
$passed = ($response['code'] === 200); // Should sanitize and continue

echo "  3.4 Invalid Pagination Handling: " . ($passed ? "{$c['g']}✓ PASS{$c['x']}" : "{$c['r']}✗ FAIL{$c['x']}") . "\n";
$testResults[] = ['test' => 'Invalid Pagination', 'passed' => $passed];

echo "\n";

// Test 4: Courses API
echo "TEST 4: Courses API\n";
echo "─────────────────────────────────────────────────────────────\n";

$response = makeApiRequest('/api/courses.php?limit=10&offset=0', 'GET');
$passed = ($response['code'] === 200);

echo "  4.1 Get Courses: " . ($passed ? "{$c['g']}✓ PASS{$c['x']}" : "{$c['r']}✗ FAIL{$c['x']}") . " (HTTP {$response['code']})\n";
if ($passed && isset($response['json']['data']['courses'])) {
    echo "      Courses returned: " . count($response['json']['data']['courses']) . "\n";
}
$testResults[] = ['test' => 'Get Courses', 'passed' => $passed];

// Test with filters
$response = makeApiRequest('/api/courses.php?major=1&level=1', 'GET');
$passed = ($response['code'] === 200);

echo "  4.2 Filtered Courses: " . ($passed ? "{$c['g']}✓ PASS{$c['x']}" : "{$c['r']}✗ FAIL{$c['x']}") . "\n";
$testResults[] = ['test' => 'Filtered Courses', 'passed' => $passed];

echo "\n";

// Test 5: Rate Limiting
echo "TEST 5: Rate Limiting\n";
echo "─────────────────────────────────────────────────────────────\n";

$attempts = 0;
$blocked = false;

for ($i = 0; $i < 7; $i++) {
    $response = makeApiRequest('/api/login.php', 'POST', $invalidLogin);
    $attempts++;
    
    if (isset($response['json']['message']) && strpos($response['json']['message'], 'Too many') !== false) {
        $blocked = true;
        break;
    }
}

echo "  5.1 Login Rate Limiting: " . ($blocked ? "{$c['g']}✓ PASS{$c['x']}" : "{$c['y']}⚠ WARNING{$c['x']}") . "\n";
echo "      Attempts before block: $attempts" . ($blocked ? " (Blocked)" : " (Not blocked)") . "\n";
$testResults[] = ['test' => 'Rate Limiting', 'passed' => $blocked];

echo "\n";

// Test 6: Invalid HTTP Methods
echo "TEST 6: HTTP Method Validation\n";
echo "─────────────────────────────────────────────────────────────\n";

// Try POST on GET-only endpoint
$response = makeApiRequest('/api/courses.php', 'POST', ['test' => 'data']);
$passed = ($response['code'] !== 200 || (isset($response['json']['success']) && !$response['json']['success']));

echo "  6.1 Invalid Method on Courses: " . ($passed ? "{$c['g']}✓ PASS{$c['x']}" : "{$c['r']}✗ FAIL{$c['x']}") . "\n";
$testResults[] = ['test' => 'Invalid HTTP Method', 'passed' => $passed];

// Try GET on POST-only endpoint
$response = makeApiRequest('/api/register.php?username=test', 'GET');
$passed = ($response['code'] !== 200 || (isset($response['json']['success']) && !$response['json']['success']));

echo "  6.2 Invalid Method on Register: " . ($passed ? "{$c['g']}✓ PASS{$c['x']}" : "{$c['r']}✗ FAIL{$c['x']}") . "\n";
$testResults[] = ['test' => 'Invalid GET on POST', 'passed' => $passed];

echo "\n";

// Test 7: Malformed JSON
echo "TEST 7: Malformed Input Handling\n";
echo "─────────────────────────────────────────────────────────────\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $baseUrl . '/api/register.php');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, '{invalid json}');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$json = json_decode($response, true);
$passed = (!isset($json['success']) || !$json['success']);

echo "  7.1 Malformed JSON Rejection: " . ($passed ? "{$c['g']}✓ PASS{$c['x']}" : "{$c['r']}✗ FAIL{$c['x']}") . "\n";
$testResults[] = ['test' => 'Malformed JSON', 'passed' => $passed];

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
    echo "{$c['g']}✓ ALL API TESTS PASSED!{$c['x']}\n";
} elseif ($passRate >= 80.0) {
    echo "{$c['y']}⚠ MOST TESTS PASSED ($passRate%){$c['x']}\n";
} else {
    echo "{$c['r']}✗ MANY TESTS FAILED ($passRate%){$c['x']}\n";
}

echo "\n═══════════════════════════════════════════════════════════════\n\n";

// Save results
$results = [
    'timestamp' => date('Y-m-d H:i:s'),
    'base_url' => $baseUrl,
    'total' => $total,
    'passed' => $passed,
    'failed' => $failed,
    'pass_rate' => $passRate,
    'tests' => $testResults
];

file_put_contents(__DIR__ . '/api-test-results.json', json_encode($results, JSON_PRETTY_PRINT));
echo "Results saved to: tests/api-test-results.json\n\n";

exit($failed > 0 ? 1 : 0);

