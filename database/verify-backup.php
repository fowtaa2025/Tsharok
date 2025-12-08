<?php
/**
 * Backup Verification Script
 * Verifies database backup integrity and completeness
 * 
 * Usage: php database/verify-backup.php [backup-file.sql]
 */

define('TSHAROK_INIT', true);

$c = ['g' => "\033[32m", 'r' => "\033[31m", 'y' => "\033[33m", 'b' => "\033[34m", 'x' => "\033[0m"];

echo "\n";
echo "═══════════════════════════════════════════════════════════════\n";
echo "  DATABASE BACKUP VERIFICATION\n";
echo "═══════════════════════════════════════════════════════════════\n\n";

// Get backup file from command line or prompt
$backupFile = isset($argv[1]) ? $argv[1] : null;

if (!$backupFile) {
    echo "Available backup files:\n";
    echo "─────────────────────────────────────────────────────────────\n";
    
    $backupDir = __DIR__ . '/backups';
    if (is_dir($backupDir)) {
        $files = glob($backupDir . '/*.sql');
        foreach ($files as $file) {
            $size = filesize($file);
            $sizeM = round($size / 1048576, 2);
            $modified = date('Y-m-d H:i:s', filemtime($file));
            echo "  " . basename($file) . " ({$sizeM}MB, $modified)\n";
        }
    }
    
    echo "\nUsage: php database/verify-backup.php [backup-file.sql]\n\n";
    exit(1);
}

// Check if file exists
if (!file_exists($backupFile)) {
    $testPath = __DIR__ . '/backups/' . $backupFile;
    if (file_exists($testPath)) {
        $backupFile = $testPath;
    } else {
        echo "{$c['r']}ERROR:{$c['x']} Backup file not found: $backupFile\n\n";
        exit(1);
    }
}

echo "Verifying backup: " . basename($backupFile) . "\n";
echo "─────────────────────────────────────────────────────────────\n\n";

// Check file size
$fileSize = filesize($backupFile);
$fileSizeMB = round($fileSize / 1048576, 2);

echo "File Information:\n";
echo "  Size: {$fileSizeMB}MB\n";
echo "  Modified: " . date('Y-m-d H:i:s', filemtime($backupFile)) . "\n\n";

if ($fileSize < 1024) {
    echo "{$c['r']}✗ FAIL{$c['x']} - Backup file is too small (< 1KB)\n\n";
    exit(1);
}

echo "{$c['g']}✓{$c['x']} File size is valid\n\n";

// Read and analyze backup file
echo "Analyzing backup contents...\n\n";

$content = file_get_contents($backupFile);

// Check for MySQL dump header
if (strpos($content, 'MySQL dump') === false) {
    echo "{$c['r']}✗ FAIL{$c['x']} - Not a valid MySQL dump file\n\n";
    exit(1);
}

echo "{$c['g']}✓{$c['x']} Valid MySQL dump format\n";

// Check for database name
if (strpos($content, 'tsharok') !== false) {
    echo "{$c['g']}✓{$c['x']} Database 'tsharok' found in backup\n";
} else {
    echo "{$c['y']}⚠ WARNING{$c['x']} - Database 'tsharok' not found in backup\n";
}

// Count tables
preg_match_all('/CREATE TABLE `([^`]+)`/', $content, $tables);
$tableCount = count($tables[1]);

echo "{$c['g']}✓{$c['x']} Found $tableCount table(s)\n";

if ($tableCount > 0) {
    echo "\n  Tables found:\n";
    foreach ($tables[1] as $table) {
        echo "    - $table\n";
    }
}

// Check for important tables
$requiredTables = ['users', 'courses', 'content', 'enrollments'];
$missingTables = [];

foreach ($requiredTables as $table) {
    if (!in_array($table, $tables[1])) {
        $missingTables[] = $table;
    }
}

echo "\n";

if (empty($missingTables)) {
    echo "{$c['g']}✓{$c['x']} All required tables present\n";
} else {
    echo "{$c['y']}⚠ WARNING{$c['x']} - Missing tables: " . implode(', ', $missingTables) . "\n";
}

// Count INSERT statements (data check)
preg_match_all('/INSERT INTO/', $content, $inserts);
$insertCount = count($inserts[0]);

echo "{$c['g']}✓{$c['x']} Found $insertCount INSERT statement(s)\n";

// Check for triggers
preg_match_all('/CREATE.*TRIGGER/', $content, $triggers);
$triggerCount = count($triggers[0]);

if ($triggerCount > 0) {
    echo "{$c['g']}✓{$c['x']} Found $triggerCount trigger(s)\n";
}

// Check for procedures/functions
preg_match_all('/CREATE.*PROCEDURE/', $content, $procedures);
$procedureCount = count($procedures[0]);

if ($procedureCount > 0) {
    echo "{$c['g']}✓{$c['x']} Found $procedureCount stored procedure(s)\n";
}

// Check for views
preg_match_all('/CREATE.*VIEW/', $content, $views);
$viewCount = count($views[0]);

if ($viewCount > 0) {
    echo "{$c['g']}✓{$c['x']} Found $viewCount view(s)\n";
}

// Check character set
if (strpos($content, 'utf8mb4') !== false) {
    echo "{$c['g']}✓{$c['x']} UTF-8 character set configured\n";
} else {
    echo "{$c['y']}⚠ WARNING{$c['x']} - UTF-8 character set not found\n";
}

// Estimate data volume
$dataSize = strlen($content) - (strlen($content) - strpos($content, 'INSERT'));
$dataSizeMB = round($dataSize / 1048576, 2);

echo "\nData Statistics:\n";
echo "  Estimated data size: {$dataSizeMB}MB\n";
echo "  Tables with data: $tableCount\n";
echo "  INSERT statements: $insertCount\n";

// Final verdict
echo "\n═══════════════════════════════════════════════════════════════\n";
echo "  VERIFICATION SUMMARY\n";
echo "═══════════════════════════════════════════════════════════════\n\n";

$issues = count($missingTables);
$warnings = 0;

if ($tableCount < 10) {
    $warnings++;
}

if ($insertCount < 10) {
    $warnings++;
}

if ($issues === 0 && $warnings === 0) {
    echo "{$c['g']}✓ BACKUP IS VALID AND COMPLETE{$c['x']}\n";
    echo "This backup can be safely used for restoration.\n";
} elseif ($issues > 0) {
    echo "{$c['r']}✗ BACKUP HAS ISSUES{$c['x']}\n";
    echo "Missing required tables. Backup may be incomplete.\n";
} else {
    echo "{$c['y']}⚠ BACKUP HAS WARNINGS{$c['x']}\n";
    echo "Backup appears valid but has some warnings.\n";
}

echo "\n";

exit($issues > 0 ? 1 : 0);

