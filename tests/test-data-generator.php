<?php
/**
 * Test Data Generator
 * Tsharok LMS - Generate realistic test data for testing
 * 
 * Usage: php tests/test-data-generator.php [options]
 * Options: --users=10 --courses=5 --content=20
 */

define('TSHAROK_INIT', true);

require_once __DIR__ . '/../config/app.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';

$c = ['g' => "\033[32m", 'r' => "\033[31m", 'y' => "\033[33m", 'b' => "\033[34m", 'x' => "\033[0m"];

echo "\n";
echo "═══════════════════════════════════════════════════════════════\n";
echo "  TEST DATA GENERATOR\n";
echo "═══════════════════════════════════════════════════════════════\n\n";

// Parse command line arguments
$numUsers = 10;
$numCourses = 5;
$numContent = 20;

foreach ($argv as $arg) {
    if (strpos($arg, '--users=') === 0) {
        $numUsers = intval(substr($arg, 8));
    } elseif (strpos($arg, '--courses=') === 0) {
        $numCourses = intval(substr($arg, 10));
    } elseif (strpos($arg, '--content=') === 0) {
        $numContent = intval(substr($arg, 10));
    }
}

echo "Configuration:\n";
echo "  Users to create: $numUsers\n";
echo "  Courses to create: $numCourses\n";
echo "  Content items to create: $numContent\n\n";

$db = getDB();

// Sample data
$firstNames = ['John', 'Jane', 'Ahmed', 'Fatima', 'Mohammed', 'Sarah', 'Ali', 'Layla', 'Omar', 'Aisha'];
$lastNames = ['Smith', 'Johnson', 'Al-Saud', 'Khan', 'Abdullah', 'Hassan', 'Ibrahim', 'Mahmoud'];
$courseNames = [
    'Introduction to Computer Science',
    'Data Structures and Algorithms',
    'Web Development Fundamentals',
    'Database Management Systems',
    'Software Engineering Principles',
    'Mobile App Development',
    'Artificial Intelligence',
    'Network Security',
    'Cloud Computing',
    'Machine Learning Basics'
];
$contentTypes = ['lecture', 'assignment', 'video', 'document', 'quiz'];
$descriptions = [
    'Comprehensive guide covering fundamental concepts',
    'Advanced topics and practical applications',
    'Step-by-step tutorial with examples',
    'In-depth analysis and case studies',
    'Interactive exercises and problems'
];

// Step 1: Generate Users
echo "{$c['b']}STEP 1: Generating Users{$c['x']}\n";
echo "─────────────────────────────────────────────────────────────\n";

$generatedUsers = [];
$password = password_hash('TestPassword123!', PASSWORD_BCRYPT);

for ($i = 0; $i < $numUsers; $i++) {
    $firstName = $firstNames[array_rand($firstNames)];
    $lastName = $lastNames[array_rand($lastNames)];
    $username = strtolower($firstName . $lastName . rand(100, 999));
    $email = strtolower($username . '@test.com');
    $role = rand(1, 10) > 8 ? 'instructor' : 'student'; // 20% instructors
    
    try {
        $stmt = $db->prepare("
            INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active, major_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 1, 1, NOW())
        ");
        
        $stmt->execute([$username, $email, $password, $firstName, $lastName, $role]);
        $userId = $db->lastInsertId();
        
        $generatedUsers[] = [
            'id' => $userId,
            'username' => $username,
            'role' => $role
        ];
        
        echo "  {$c['g']}✓{$c['x']} Created $role: $username (ID: $userId)\n";
    } catch (PDOException $e) {
        echo "  {$c['r']}✗{$c['x']} Failed to create user $username: " . $e->getMessage() . "\n";
    }
}

echo "\nCreated " . count($generatedUsers) . " users\n\n";

// Step 2: Generate Courses
echo "{$c['b']}STEP 2: Generating Courses{$c['x']}\n";
echo "─────────────────────────────────────────────────────────────\n";

$generatedCourses = [];
$instructors = array_filter($generatedUsers, function($u) { return $u['role'] === 'instructor'; });

if (empty($instructors)) {
    echo "{$c['y']}⚠{$c['x']} No instructors available, skipping course generation\n\n";
} else {
    for ($i = 0; $i < $numCourses; $i++) {
        $instructor = $instructors[array_rand($instructors)];
        $courseName = $courseNames[array_rand($courseNames)] . " " . chr(65 + $i);
        $courseCode = 'CS' . rand(100, 599);
        $description = $descriptions[array_rand($descriptions)];
        $level = rand(1, 4);
        
        try {
            $stmt = $db->prepare("
                INSERT INTO courses (course_code, course_name, description, instructor_id, major_id, level, created_at)
                VALUES (?, ?, ?, ?, 1, ?, NOW())
            ");
            
            $stmt->execute([$courseCode, $courseName, $description, $instructor['id'], $level]);
            $courseId = $db->lastInsertId();
            
            $generatedCourses[] = [
                'id' => $courseId,
                'name' => $courseName,
                'code' => $courseCode
            ];
            
            echo "  {$c['g']}✓{$c['x']} Created course: $courseCode - $courseName (ID: $courseId)\n";
        } catch (PDOException $e) {
            echo "  {$c['r']}✗{$c['x']} Failed to create course $courseName: " . $e->getMessage() . "\n";
        }
    }
    
    echo "\nCreated " . count($generatedCourses) . " courses\n\n";
}

// Step 3: Generate Enrollments
echo "{$c['b']}STEP 3: Generating Enrollments{$c['x']}\n";
echo "─────────────────────────────────────────────────────────────\n";

$students = array_filter($generatedUsers, function($u) { return $u['role'] === 'student'; });
$enrollmentCount = 0;

if (empty($students) || empty($generatedCourses)) {
    echo "{$c['y']}⚠{$c['x']} No students or courses available, skipping enrollments\n\n";
} else {
    foreach ($students as $student) {
        // Enroll each student in 1-3 random courses
        $coursesToEnroll = rand(1, min(3, count($generatedCourses)));
        $selectedCourses = array_rand($generatedCourses, $coursesToEnroll);
        
        if (!is_array($selectedCourses)) {
            $selectedCourses = [$selectedCourses];
        }
        
        foreach ($selectedCourses as $courseIndex) {
            $course = $generatedCourses[$courseIndex];
            
            try {
                $stmt = $db->prepare("
                    INSERT INTO enrollments (user_id, course_id, enrollment_date, status)
                    VALUES (?, ?, NOW(), 'active')
                ");
                
                $stmt->execute([$student['id'], $course['id']]);
                $enrollmentCount++;
                
            } catch (PDOException $e) {
                // Skip duplicate enrollments
            }
        }
    }
    
    echo "  {$c['g']}✓{$c['x']} Created $enrollmentCount enrollments\n\n";
}

// Step 4: Generate Content
echo "{$c['b']}STEP 4: Generating Content{$c['x']}\n";
echo "─────────────────────────────────────────────────────────────\n";

if (empty($generatedUsers) || empty($generatedCourses)) {
    echo "{$c['y']}⚠{$c['x']} No users or courses available, skipping content generation\n\n";
} else {
    for ($i = 0; $i < $numContent; $i++) {
        $user = $generatedUsers[array_rand($generatedUsers)];
        $course = $generatedCourses[array_rand($generatedCourses)];
        $type = $contentTypes[array_rand($contentTypes)];
        $title = ucfirst($type) . " " . ($i + 1) . ": " . $course['name'];
        $description = $descriptions[array_rand($descriptions)];
        $fileUrl = "/uploads/staging/test-content-{$i}.pdf";
        $isApproved = rand(1, 10) > 3 ? 0 : 1; // 70% pending, 30% approved
        
        try {
            $stmt = $db->prepare("
                INSERT INTO content (title, type, file_url, uploader_id, course_id, description, is_approved, upload_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            ");
            
            $stmt->execute([$title, $type, $fileUrl, $user['id'], $course['id'], $description, $isApproved]);
            $contentId = $db->lastInsertId();
            
            $status = $isApproved ? 'approved' : 'pending';
            echo "  {$c['g']}✓{$c['x']} Created content: $title (Status: $status)\n";
        } catch (PDOException $e) {
            echo "  {$c['r']}✗{$c['x']} Failed to create content: " . $e->getMessage() . "\n";
        }
    }
    
    echo "\nCreated $numContent content items\n\n";
}

// Step 5: Generate Ratings
echo "{$c['b']}STEP 5: Generating Ratings{$c['x']}\n";
echo "─────────────────────────────────────────────────────────────\n";

$ratingCount = 0;

if (empty($students) || empty($generatedCourses)) {
    echo "{$c['y']}⚠{$c['x']} No students or courses available, skipping ratings\n\n";
} else {
    foreach ($students as $student) {
        // Rate some courses (50% chance per enrolled course)
        $numRatings = rand(1, 3);
        
        for ($i = 0; $i < $numRatings; $i++) {
            if (rand(1, 10) <= 5 && !empty($generatedCourses)) {
                $course = $generatedCourses[array_rand($generatedCourses)];
                $rating = rand(3, 5);
                $comment = "This course was " . ($rating >= 4 ? "excellent" : "good") . "!";
                
                try {
                    $stmt = $db->prepare("
                        INSERT INTO ratings (user_id, course_id, rating, comment, created_at)
                        VALUES (?, ?, ?, ?, NOW())
                    ");
                    
                    $stmt->execute([$student['id'], $course['id'], $rating, $comment]);
                    $ratingCount++;
                } catch (PDOException $e) {
                    // Skip duplicate ratings
                }
            }
        }
    }
    
    echo "  {$c['g']}✓{$c['x']} Created $ratingCount ratings\n\n";
}

// Summary
echo "═══════════════════════════════════════════════════════════════\n";
echo "  GENERATION COMPLETE\n";
echo "═══════════════════════════════════════════════════════════════\n\n";

echo "Summary:\n";
echo "  Users:       " . count($generatedUsers) . " created\n";
echo "  Courses:     " . count($generatedCourses) . " created\n";
echo "  Enrollments: $enrollmentCount created\n";
echo "  Content:     $numContent created\n";
echo "  Ratings:     $ratingCount created\n\n";

echo "{$c['g']}✓ Test data generated successfully!{$c['x']}\n\n";

// Cleanup option
echo "{$c['y']}CLEANUP{$c['x']}\n";
echo "To remove all test data later, run: php tests/cleanup-test-data.php\n\n";

// Save generated IDs
$testDataManifest = [
    'generated_at' => date('Y-m-d H:i:s'),
    'users' => array_column($generatedUsers, 'id'),
    'courses' => array_column($generatedCourses, 'id')
];

file_put_contents(__DIR__ . '/test-data-manifest.json', json_encode($testDataManifest, JSON_PRETTY_PRINT));
echo "Test data manifest saved to: tests/test-data-manifest.json\n\n";

