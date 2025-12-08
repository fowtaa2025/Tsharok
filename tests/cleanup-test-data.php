<?php
/**
 * Cleanup Test Data
 * Tsharok LMS - Remove generated test data
 * 
 * Usage: php tests/cleanup-test-data.php
 */

define('TSHAROK_INIT', true);

require_once __DIR__ . '/../config/app.php';
require_once __DIR__ . '/../config/database.php';

$c = ['g' => "\033[32m", 'r' => "\033[31m", 'y' => "\033[33m", 'b' => "\033[34m", 'x' => "\033[0m"];

echo "\n";
echo "═══════════════════════════════════════════════════════════════\n";
echo "  CLEANUP TEST DATA\n";
echo "═══════════════════════════════════════════════════════════════\n\n";

echo "{$c['y']}WARNING:{$c['x']} This will delete all test data from the database.\n";
echo "This action cannot be undone!\n\n";
echo "Continue? (yes/no): ";

$handle = fopen("php://stdin", "r");
$line = trim(fgets($handle));

if (strtolower($line) !== 'yes') {
    echo "\nCleanup cancelled.\n\n";
    exit(0);
}

echo "\n";
$db = getDB();

// Load manifest if exists
$manifestFile = __DIR__ . '/test-data-manifest.json';
$hasManifest = file_exists($manifestFile);

if ($hasManifest) {
    $manifest = json_decode(file_get_contents($manifestFile), true);
    echo "Found test data manifest from: {$manifest['generated_at']}\n";
    echo "  Users: " . count($manifest['users']) . "\n";
    echo "  Courses: " . count($manifest['courses']) . "\n\n";
}

echo "Cleaning up test data...\n";
echo "─────────────────────────────────────────────────────────────\n";

$deletedCounts = [];

// Delete test content
try {
    $stmt = $db->query("DELETE FROM content WHERE title LIKE '%Test%' OR title LIKE '%Bulk%' OR file_url LIKE '%test-content%'");
    $count = $stmt->rowCount();
    echo "  {$c['g']}✓{$c['x']} Removed $count test content items\n";
    $deletedCounts['content'] = $count;
} catch (PDOException $e) {
    echo "  {$c['r']}✗{$c['x']} Failed to delete content: " . $e->getMessage() . "\n";
}

// Delete test ratings
try {
    $stmt = $db->query("DELETE FROM ratings WHERE comment LIKE '%This course was%'");
    $count = $stmt->rowCount();
    echo "  {$c['g']}✓{$c['x']} Removed $count test ratings\n";
    $deletedCounts['ratings'] = $count;
} catch (PDOException $e) {
    echo "  {$c['r']}✗{$c['x']} Failed to delete ratings: " . $e->getMessage() . "\n";
}

// Delete test enrollments (if we have user IDs)
if ($hasManifest && !empty($manifest['users'])) {
    try {
        $placeholders = str_repeat('?,', count($manifest['users']) - 1) . '?';
        $stmt = $db->prepare("DELETE FROM enrollments WHERE user_id IN ($placeholders)");
        $stmt->execute($manifest['users']);
        $count = $stmt->rowCount();
        echo "  {$c['g']}✓{$c['x']} Removed $count test enrollments\n";
        $deletedCounts['enrollments'] = $count;
    } catch (PDOException $e) {
        echo "  {$c['r']}✗{$c['x']} Failed to delete enrollments: " . $e->getMessage() . "\n";
    }
}

// Delete test courses
if ($hasManifest && !empty($manifest['courses'])) {
    try {
        $placeholders = str_repeat('?,', count($manifest['courses']) - 1) . '?';
        $stmt = $db->prepare("DELETE FROM courses WHERE course_id IN ($placeholders)");
        $stmt->execute($manifest['courses']);
        $count = $stmt->rowCount();
        echo "  {$c['g']}✓{$c['x']} Removed $count test courses\n";
        $deletedCounts['courses'] = $count;
    } catch (PDOException $e) {
        echo "  {$c['r']}✗{$c['x']} Failed to delete courses: " . $e->getMessage() . "\n";
    }
} else {
    try {
        $stmt = $db->query("DELETE FROM courses WHERE course_code LIKE 'CS%' AND course_name LIKE '% A' OR course_name LIKE '% B' OR course_name LIKE '% C'");
        $count = $stmt->rowCount();
        echo "  {$c['g']}✓{$c['x']} Removed $count test courses\n";
        $deletedCounts['courses'] = $count;
    } catch (PDOException $e) {
        echo "  {$c['r']}✗{$c['x']} Failed to delete courses: " . $e->getMessage() . "\n";
    }
}

// Delete test users
if ($hasManifest && !empty($manifest['users'])) {
    try {
        $placeholders = str_repeat('?,', count($manifest['users']) - 1) . '?';
        $stmt = $db->prepare("DELETE FROM users WHERE user_id IN ($placeholders)");
        $stmt->execute($manifest['users']);
        $count = $stmt->rowCount();
        echo "  {$c['g']}✓{$c['x']} Removed $count test users\n";
        $deletedCounts['users'] = $count;
    } catch (PDOException $e) {
        echo "  {$c['r']}✗{$c['x']} Failed to delete users: " . $e->getMessage() . "\n";
    }
} else {
    try {
        $stmt = $db->query("DELETE FROM users WHERE email LIKE '%@test.com'");
        $count = $stmt->rowCount();
        echo "  {$c['g']}✓{$c['x']} Removed $count test users\n";
        $deletedCounts['users'] = $count;
    } catch (PDOException $e) {
        echo "  {$c['r']}✗{$c['x']} Failed to delete users: " . $e->getMessage() . "\n";
    }
}

// Delete test admin actions
try {
    $stmt = $db->query("DELETE FROM admin_actions WHERE description LIKE '%testing%' OR description LIKE '%test%'");
    $count = $stmt->rowCount();
    echo "  {$c['g']}✓{$c['x']} Removed $count test admin actions\n";
    $deletedCounts['admin_actions'] = $count;
} catch (PDOException $e) {
    echo "  {$c['r']}✗{$c['x']} Failed to delete admin actions: " . $e->getMessage() . "\n";
}

// Delete test comments
try {
    $stmt = $db->query("DELETE FROM comments WHERE content LIKE '%test%'");
    $count = $stmt->rowCount();
    echo "  {$c['g']}✓{$c['x']} Removed $count test comments\n";
    $deletedCounts['comments'] = $count;
} catch (PDOException $e) {
    echo "  {$c['r']}✗{$c['x']} Failed to delete comments: " . $e->getMessage() . "\n";
}

echo "\n";
echo "═══════════════════════════════════════════════════════════════\n";
echo "  CLEANUP COMPLETE\n";
echo "═══════════════════════════════════════════════════════════════\n\n";

echo "Deleted:\n";
foreach ($deletedCounts as $table => $count) {
    echo "  $table: $count record(s)\n";
}
echo "\n";

// Remove manifest
if ($hasManifest) {
    unlink($manifestFile);
    echo "Test data manifest removed.\n";
}

// Remove test result files
$testResults = [
    __DIR__ . '/security-test-results.json',
    __DIR__ . '/api-test-results.json'
];

foreach ($testResults as $file) {
    if (file_exists($file)) {
        unlink($file);
        echo "Removed: " . basename($file) . "\n";
    }
}

echo "\n{$c['g']}✓ Cleanup complete!{$c['x']}\n\n";

