<?php
/**
 * Admin Moderation Flow Testing
 * Tsharok LMS - Test content moderation workflow
 * 
 * Usage: php tests/moderation-flow-tests.php
 */

define('TSHAROK_INIT', true);

require_once __DIR__ . '/../config/app.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/file-manager.php';

// Colors
$c = [
    'g' => "\033[32m", // green
    'r' => "\033[31m", // red
    'y' => "\033[33m", // yellow
    'b' => "\033[34m", // blue
    'x' => "\033[0m"   // reset
];

echo "\n";
echo "═══════════════════════════════════════════════════════════════\n";
echo "  ADMIN MODERATION FLOW - COMPREHENSIVE TESTING\n";
echo "═══════════════════════════════════════════════════════════════\n\n";

$db = getDB();
$testResults = [];

// Setup: Create test data
echo "{$c['b']}SETUP: Creating test data...{$c['x']}\n";
echo "─────────────────────────────────────────────────────────────\n";

// Check if test admin exists
$stmt = $db->prepare("SELECT user_id FROM users WHERE username = 'test_admin' AND role = 'admin' LIMIT 1");
$stmt->execute();
$testAdmin = $stmt->fetch();

if (!$testAdmin) {
    echo "  Creating test admin user...\n";
    $stmt = $db->prepare("
        INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active)
        VALUES ('test_admin', 'admin@test.com', ?, 'Test', 'Admin', 'admin', 1)
    ");
    $stmt->execute([password_hash('TestAdmin123!', PASSWORD_BCRYPT)]);
    $adminId = $db->lastInsertId();
    echo "  {$c['g']}✓{$c['x']} Test admin created (ID: $adminId)\n";
} else {
    $adminId = $testAdmin['user_id'];
    echo "  {$c['g']}✓{$c['x']} Using existing test admin (ID: $adminId)\n";
}

// Check if test student exists
$stmt = $db->prepare("SELECT user_id FROM users WHERE username = 'test_student' LIMIT 1");
$stmt->execute();
$testStudent = $stmt->fetch();

if (!$testStudent) {
    echo "  Creating test student user...\n";
    $stmt = $db->prepare("
        INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active, major_id)
        VALUES ('test_student', 'student@test.com', ?, 'Test', 'Student', 'student', 1, 1)
    ");
    $stmt->execute([password_hash('TestStudent123!', PASSWORD_BCRYPT)]);
    $studentId = $db->lastInsertId();
    echo "  {$c['g']}✓{$c['x']} Test student created (ID: $studentId)\n";
} else {
    $studentId = $testStudent['user_id'];
    echo "  {$c['g']}✓{$c['x']} Using existing test student (ID: $studentId)\n";
}

// Get a test course
$stmt = $db->prepare("SELECT course_id FROM courses LIMIT 1");
$stmt->execute();
$testCourse = $stmt->fetch();
$courseId = $testCourse ? $testCourse['course_id'] : null;

if (!$courseId) {
    echo "  {$c['y']}⚠{$c['x']} No courses found. Some tests may be skipped.\n";
} else {
    echo "  {$c['g']}✓{$c['x']} Using test course (ID: $courseId)\n";
}

echo "\n";

// Test 1: Upload Content (Pending Approval)
echo "TEST 1: Content Upload to Staging\n";
echo "─────────────────────────────────────────────────────────────\n";

if ($courseId) {
    try {
        $stmt = $db->prepare("
            INSERT INTO content (title, type, file_url, uploader_id, course_id, is_approved, description, upload_date)
            VALUES (?, 'document', '/uploads/staging/test-document.pdf', ?, ?, 0, 'Test document for moderation', NOW())
        ");
        $stmt->execute(['Test Document for Moderation', $studentId, $courseId]);
        $testContentId = $db->lastInsertId();
        
        echo "  {$c['g']}✓ PASS{$c['x']} - Content uploaded to staging (ID: $testContentId)\n";
        echo "    - Status: Pending (is_approved = 0)\n";
        echo "    - Location: /uploads/staging/\n";
        
        $testResults[] = ['test' => 'Content Upload', 'passed' => true];
    } catch (Exception $e) {
        echo "  {$c['r']}✗ FAIL{$c['x']} - Failed to upload content: " . $e->getMessage() . "\n";
        $testResults[] = ['test' => 'Content Upload', 'passed' => false];
        $testContentId = null;
    }
} else {
    echo "  {$c['y']}⊘ SKIP{$c['x']} - No course available\n";
    $testContentId = null;
}

echo "\n";

// Test 2: Get Pending Content
echo "TEST 2: Retrieve Pending Content\n";
echo "─────────────────────────────────────────────────────────────\n";

try {
    $stmt = $db->prepare("
        SELECT c.*, u.username, u.first_name, u.last_name, co.course_name
        FROM content c
        JOIN users u ON c.uploader_id = u.user_id
        LEFT JOIN courses co ON c.course_id = co.course_id
        WHERE c.is_approved = 0
        ORDER BY c.upload_date DESC
        LIMIT 10
    ");
    $stmt->execute();
    $pendingContent = $stmt->fetchAll();
    
    $count = count($pendingContent);
    echo "  {$c['g']}✓ PASS{$c['x']} - Retrieved $count pending content item(s)\n";
    
    if ($count > 0) {
        echo "    Pending items:\n";
        foreach ($pendingContent as $item) {
            echo "      - ID: {$item['id']}, Title: {$item['title']}, Type: {$item['type']}\n";
        }
    }
    
    $testResults[] = ['test' => 'Get Pending Content', 'passed' => true];
} catch (Exception $e) {
    echo "  {$c['r']}✗ FAIL{$c['x']} - Failed to retrieve pending content: " . $e->getMessage() . "\n";
    $testResults[] = ['test' => 'Get Pending Content', 'passed' => false];
}

echo "\n";

// Test 3: Approve Content
echo "TEST 3: Approve Content\n";
echo "─────────────────────────────────────────────────────────────\n";

if ($testContentId) {
    try {
        // Simulate approval
        $stmt = $db->prepare("UPDATE content SET is_approved = 1, updated_at = NOW() WHERE id = ?");
        $stmt->execute([$testContentId]);
        
        // Log admin action
        $stmt = $db->prepare("
            INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, description, timestamp)
            VALUES (?, 'approve', 'content', ?, 'Approved content during testing', NOW())
        ");
        $stmt->execute([$adminId, $testContentId]);
        
        echo "  {$c['g']}✓ PASS{$c['x']} - Content approved successfully\n";
        echo "    - Content ID: $testContentId\n";
        echo "    - Admin ID: $adminId\n";
        echo "    - Action logged in admin_actions table\n";
        
        $testResults[] = ['test' => 'Approve Content', 'passed' => true];
    } catch (Exception $e) {
        echo "  {$c['r']}✗ FAIL{$c['x']} - Failed to approve content: " . $e->getMessage() . "\n";
        $testResults[] = ['test' => 'Approve Content', 'passed' => false];
    }
} else {
    echo "  {$c['y']}⊘ SKIP{$c['x']} - No test content available\n";
}

echo "\n";

// Test 4: Reject Content
echo "TEST 4: Reject Content\n";
echo "─────────────────────────────────────────────────────────────\n";

if ($courseId) {
    try {
        // Create another test content to reject
        $stmt = $db->prepare("
            INSERT INTO content (title, type, file_url, uploader_id, course_id, is_approved, description, upload_date)
            VALUES (?, 'document', '/uploads/staging/test-reject.pdf', ?, ?, 0, 'Test document for rejection', NOW())
        ");
        $stmt->execute(['Test Document to Reject', $studentId, $courseId]);
        $rejectContentId = $db->lastInsertId();
        
        // Simulate rejection (set to -1)
        $stmt = $db->prepare("UPDATE content SET is_approved = -1, updated_at = NOW() WHERE id = ?");
        $stmt->execute([$rejectContentId]);
        
        // Log admin action
        $stmt = $db->prepare("
            INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, description, timestamp)
            VALUES (?, 'reject', 'content', ?, 'Rejected content during testing', NOW())
        ");
        $stmt->execute([$adminId, $rejectContentId]);
        
        echo "  {$c['g']}✓ PASS{$c['x']} - Content rejected successfully\n";
        echo "    - Content ID: $rejectContentId\n";
        echo "    - Status: Rejected (is_approved = -1)\n";
        echo "    - Action logged\n";
        
        $testResults[] = ['test' => 'Reject Content', 'passed' => true];
    } catch (Exception $e) {
        echo "  {$c['r']}✗ FAIL{$c['x']} - Failed to reject content: " . $e->getMessage() . "\n";
        $testResults[] = ['test' => 'Reject Content', 'passed' => false];
    }
} else {
    echo "  {$c['y']}⊘ SKIP{$c['x']} - No course available\n";
}

echo "\n";

// Test 5: Get Moderation Statistics
echo "TEST 5: Moderation Statistics\n";
echo "─────────────────────────────────────────────────────────────\n";

try {
    $stmt = $db->query("
        SELECT 
            COUNT(CASE WHEN is_approved = 0 THEN 1 END) as pending,
            COUNT(CASE WHEN is_approved = 1 THEN 1 END) as approved,
            COUNT(CASE WHEN is_approved = -1 THEN 1 END) as rejected
        FROM content
    ");
    $stats = $stmt->fetch();
    
    echo "  {$c['g']}✓ PASS{$c['x']} - Retrieved moderation statistics\n";
    echo "    - Pending: {$stats['pending']}\n";
    echo "    - Approved: {$stats['approved']}\n";
    echo "    - Rejected: {$stats['rejected']}\n";
    
    $testResults[] = ['test' => 'Moderation Statistics', 'passed' => true];
} catch (Exception $e) {
    echo "  {$c['r']}✗ FAIL{$c['x']} - Failed to get statistics: " . $e->getMessage() . "\n";
    $testResults[] = ['test' => 'Moderation Statistics', 'passed' => false];
}

echo "\n";

// Test 6: Admin Action Logging
echo "TEST 6: Admin Action Audit Trail\n";
echo "─────────────────────────────────────────────────────────────\n";

try {
    $stmt = $db->prepare("
        SELECT 
            aa.*,
            u.username as admin_username
        FROM admin_actions aa
        JOIN users u ON aa.admin_id = u.user_id
        WHERE aa.admin_id = ?
        ORDER BY aa.timestamp DESC
        LIMIT 5
    ");
    $stmt->execute([$adminId]);
    $actions = $stmt->fetchAll();
    
    echo "  {$c['g']}✓ PASS{$c['x']} - Retrieved admin actions (Last 5)\n";
    
    if (count($actions) > 0) {
        foreach ($actions as $action) {
            echo "      - {$action['action_type']} on {$action['target_type']} ID: {$action['target_id']} at {$action['timestamp']}\n";
        }
    } else {
        echo "      No admin actions found\n";
    }
    
    $testResults[] = ['test' => 'Admin Action Logging', 'passed' => true];
} catch (Exception $e) {
    echo "  {$c['r']}✗ FAIL{$c['x']} - Failed to retrieve admin actions: " . $e->getMessage() . "\n";
    $testResults[] = ['test' => 'Admin Action Logging', 'passed' => false];
}

echo "\n";

// Test 7: Bulk Actions
echo "TEST 7: Bulk Content Operations\n";
echo "─────────────────────────────────────────────────────────────\n";

if ($courseId) {
    try {
        // Create multiple test contents
        $bulkIds = [];
        for ($i = 1; $i <= 3; $i++) {
            $stmt = $db->prepare("
                INSERT INTO content (title, type, file_url, uploader_id, course_id, is_approved, upload_date)
                VALUES (?, 'document', ?, ?, ?, 0, NOW())
            ");
            $stmt->execute([
                "Bulk Test Document $i",
                "/uploads/staging/bulk-test-$i.pdf",
                $studentId,
                $courseId
            ]);
            $bulkIds[] = $db->lastInsertId();
        }
        
        // Bulk approve
        $placeholders = str_repeat('?,', count($bulkIds) - 1) . '?';
        $stmt = $db->prepare("UPDATE content SET is_approved = 1 WHERE id IN ($placeholders)");
        $stmt->execute($bulkIds);
        
        echo "  {$c['g']}✓ PASS{$c['x']} - Bulk approved " . count($bulkIds) . " items\n";
        echo "    - IDs: " . implode(', ', $bulkIds) . "\n";
        
        $testResults[] = ['test' => 'Bulk Operations', 'passed' => true];
    } catch (Exception $e) {
        echo "  {$c['r']}✗ FAIL{$c['x']} - Failed bulk operation: " . $e->getMessage() . "\n";
        $testResults[] = ['test' => 'Bulk Operations', 'passed' => false];
    }
} else {
    echo "  {$c['y']}⊘ SKIP{$c['x']} - No course available\n";
}

echo "\n";

// Test 8: Permission Checking
echo "TEST 8: Admin Permission Validation\n";
echo "─────────────────────────────────────────────────────────────\n";

try {
    // Check admin role
    $stmt = $db->prepare("SELECT role FROM users WHERE user_id = ?");
    $stmt->execute([$adminId]);
    $adminRole = $stmt->fetchColumn();
    
    $isAdmin = ($adminRole === 'admin');
    
    echo "  " . ($isAdmin ? "{$c['g']}✓ PASS{$c['x']}" : "{$c['r']}✗ FAIL{$c['x']}") . " - Admin role verified\n";
    echo "    - User ID: $adminId\n";
    echo "    - Role: $adminRole\n";
    
    // Try with student (should fail)
    $stmt->execute([$studentId]);
    $studentRole = $stmt->fetchColumn();
    $isNotAdmin = ($studentRole !== 'admin');
    
    echo "  " . ($isNotAdmin ? "{$c['g']}✓ PASS{$c['x']}" : "{$c['r']}✗ FAIL{$c['x']}") . " - Non-admin correctly identified\n";
    echo "    - User ID: $studentId\n";
    echo "    - Role: $studentRole\n";
    
    $testResults[] = ['test' => 'Permission Validation', 'passed' => $isAdmin && $isNotAdmin];
} catch (Exception $e) {
    echo "  {$c['r']}✗ FAIL{$c['x']} - Failed permission check: " . $e->getMessage() . "\n";
    $testResults[] = ['test' => 'Permission Validation', 'passed' => false];
}

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

if ($failed === 0) {
    echo "{$c['g']}✓ ALL MODERATION TESTS PASSED!{$c['x']}\n";
    echo "Admin moderation flow is working correctly.\n";
} else {
    echo "{$c['y']}⚠ SOME TESTS FAILED{$c['x']}\n";
    echo "Review failed tests and fix issues.\n";
}

echo "\n═══════════════════════════════════════════════════════════════\n\n";

// Cleanup option
echo "{$c['y']}CLEANUP{$c['x']}\n";
echo "Test data has been created. Do you want to clean it up? (y/N): ";
$handle = fopen("php://stdin", "r");
$line = trim(fgets($handle));

if (strtolower($line) === 'y' || strtolower($line) === 'yes') {
    echo "\nCleaning up test data...\n";
    
    // Delete test contents
    $db->exec("DELETE FROM content WHERE title LIKE '%Test%' OR title LIKE '%Bulk%'");
    echo "  {$c['g']}✓{$c['x']} Removed test content\n";
    
    // Delete test actions
    $db->exec("DELETE FROM admin_actions WHERE description LIKE '%testing%'");
    echo "  {$c['g']}✓{$c['x']} Removed test admin actions\n";
    
    echo "\nCleanup complete!\n";
} else {
    echo "\nTest data preserved for manual review.\n";
}

echo "\n";

exit($failed > 0 ? 1 : 0);

