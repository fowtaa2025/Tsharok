<?php
/**
 * Content Upload API
 * Handles file uploads and content management for courses
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';
require_once '../includes/functions.php';
require_once '../includes/session.php';

// Start session
session_start();

// Check if user is authenticated
if (!isset($_SESSION['user_id']) || $_SESSION['user_type'] !== 'instructor') {
    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized. Only instructors can upload content.'
    ]);
    http_response_code(401);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$user_id = $_SESSION['user_id'];

try {
    $db = new Database();
    $conn = $db->getConnection();

    switch ($method) {
        case 'POST':
            uploadContent($conn, $user_id);
            break;
        
        case 'GET':
            getContent($conn);
            break;
        
        case 'PUT':
            updateContent($conn, $user_id);
            break;
        
        case 'DELETE':
            deleteContent($conn, $user_id);
            break;
        
        default:
            throw new Exception('Method not allowed');
    }

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
    http_response_code(500);
}

/**
 * Upload new content
 */
function uploadContent($conn, $user_id) {
    // Configuration
    $upload_dir = '../uploads/staging/'; // Upload to staging for admin approval
    $max_file_size = 100 * 1024 * 1024; // 100MB
    $allowed_types = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'video/mp4',
        'video/x-msvideo',
        'video/quicktime',
        'application/zip',
        'application/x-rar-compressed'
    ];

    // Validate input
    if (empty($_POST['title']) || empty($_POST['course_id']) || empty($_POST['content_type'])) {
        throw new Exception('Title, course ID, and content type are required');
    }

    $title = trim($_POST['title']);
    $description = trim($_POST['description'] ?? '');
    $course_id = intval($_POST['course_id']);
    $content_type = $_POST['content_type'];
    $week_number = intval($_POST['week_number'] ?? 0);
    $due_date = $_POST['due_date'] ?? null;
    $tags = $_POST['tags'] ?? '';
    $content_url = trim($_POST['url'] ?? '');
    
    // Settings
    $publish_now = isset($_POST['publish_now']) && $_POST['publish_now'] === 'true';
    $allow_downloads = isset($_POST['allow_downloads']) && $_POST['allow_downloads'] === 'true';
    $allow_comments = isset($_POST['allow_comments']) && $_POST['allow_comments'] === 'true';
    $notify_students = isset($_POST['notify_students']) && $_POST['notify_students'] === 'true';

    // Verify user teaches this course
    $stmt = $conn->prepare("SELECT course_id FROM courses WHERE course_id = ? AND instructor_id = ?");
    $stmt->bind_param("ii", $course_id, $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        throw new Exception('You do not have permission to upload content to this course');
    }

    $file_url = null;
    $file_size = 0;
    $mime_type = null;

    // Handle file upload
    if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
        $file = $_FILES['file'];
        
        // Validate file size
        if ($file['size'] > $max_file_size) {
            throw new Exception('File size exceeds maximum limit of 100MB');
        }
        
        // Validate file type
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime_type = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
        
        if (!in_array($mime_type, $allowed_types)) {
            throw new Exception('File type not allowed');
        }
        
        // Generate unique filename
        $file_extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $unique_filename = uniqid() . '_' . time() . '.' . $file_extension;
        $file_path = $upload_dir . $unique_filename;
        
        // Create upload directory if it doesn't exist
        if (!file_exists($upload_dir)) {
            mkdir($upload_dir, 0755, true);
        }
        
        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $file_path)) {
            throw new Exception('Failed to upload file');
        }
        
        $file_url = $unique_filename;
        $file_size = $file['size'];
        
    } elseif (!empty($content_url)) {
        // Use provided URL
        $file_url = $content_url;
        $mime_type = 'url';
    } else {
        throw new Exception('Either a file or URL must be provided');
    }

    // Insert content into database
    // All uploads go to staging and require admin approval (is_approved = 0)
    $is_approved = 0; // Pending approval
    
    $stmt = $conn->prepare("
        INSERT INTO content (
            title, 
            type, 
            file_url, 
            uploader_id, 
            course_id, 
            is_approved, 
            description, 
            file_size, 
            mime_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->bind_param(
        "sssiiiisi",
        $title,
        $content_type,
        $file_url,
        $user_id,
        $course_id,
        $is_approved,
        $description,
        $file_size,
        $mime_type
    );
    
    if (!$stmt->execute()) {
        throw new Exception('Failed to save content: ' . $stmt->error);
    }
    
    $content_id = $conn->insert_id;

    // Log activity
    logActivity($conn, $user_id, 'content_upload', "Uploaded content: {$title}");

    // Notify students if requested
    if ($notify_students) {
        notifyEnrolledStudents($conn, $course_id, $title, $content_id);
    }

    echo json_encode([
        'success' => true,
        'message' => 'Content uploaded successfully and is pending admin approval',
        'data' => [
            'content_id' => $content_id,
            'file_url' => $file_url,
            'file_size' => $file_size,
            'status' => 'pending_approval'
        ]
    ]);
}

/**
 * Get content details
 */
function getContent($conn) {
    if (isset($_GET['content_id'])) {
        // Get specific content
        $content_id = intval($_GET['content_id']);
        
        $stmt = $conn->prepare("
            SELECT c.*, u.name as uploader_name, co.course_code, co.course_name,
                   (SELECT AVG(rating) FROM ratings WHERE content_id = c.id) as avg_rating,
                   (SELECT COUNT(*) FROM ratings WHERE content_id = c.id) as rating_count,
                   (SELECT COUNT(*) FROM comments WHERE content_id = c.id) as comment_count,
                   (SELECT COUNT(*) FROM downloads WHERE content_id = c.id) as download_count
            FROM content c
            JOIN users u ON c.uploader_id = u.user_id
            JOIN courses co ON c.course_id = co.course_id
            WHERE c.id = ?
        ");
        $stmt->bind_param("i", $content_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($row = $result->fetch_assoc()) {
            echo json_encode([
                'success' => true,
                'data' => $row
            ]);
        } else {
            throw new Exception('Content not found');
        }
        
    } elseif (isset($_GET['course_id'])) {
        // Get all content for a course
        $course_id = intval($_GET['course_id']);
        
        $stmt = $conn->prepare("
            SELECT c.*, u.name as uploader_name,
                   (SELECT AVG(rating) FROM ratings WHERE content_id = c.id) as avg_rating,
                   (SELECT COUNT(*) FROM ratings WHERE content_id = c.id) as rating_count,
                   (SELECT COUNT(*) FROM downloads WHERE content_id = c.id) as download_count
            FROM content c
            JOIN users u ON c.uploader_id = u.user_id
            WHERE c.course_id = ? AND c.is_approved = 1
            ORDER BY c.upload_date DESC
        ");
        $stmt->bind_param("i", $course_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $content = [];
        while ($row = $result->fetch_assoc()) {
            $content[] = $row;
        }
        
        echo json_encode([
            'success' => true,
            'data' => $content,
            'count' => count($content)
        ]);
        
    } else {
        throw new Exception('Content ID or Course ID is required');
    }
}

/**
 * Update content
 */
function updateContent($conn, $user_id) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['content_id'])) {
        throw new Exception('Content ID is required');
    }
    
    $content_id = intval($input['content_id']);
    
    // Verify user owns this content
    $stmt = $conn->prepare("SELECT uploader_id FROM content WHERE id = ?");
    $stmt->bind_param("i", $content_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($row = $result->fetch_assoc()) {
        if ($row['uploader_id'] != $user_id) {
            throw new Exception('You do not have permission to update this content');
        }
    } else {
        throw new Exception('Content not found');
    }
    
    // Update content
    $updates = [];
    $types = '';
    $values = [];
    
    if (isset($input['title'])) {
        $updates[] = "title = ?";
        $types .= 's';
        $values[] = $input['title'];
    }
    
    if (isset($input['description'])) {
        $updates[] = "description = ?";
        $types .= 's';
        $values[] = $input['description'];
    }
    
    if (isset($input['is_approved'])) {
        $updates[] = "is_approved = ?";
        $types .= 'i';
        $values[] = $input['is_approved'];
    }
    
    if (empty($updates)) {
        throw new Exception('No fields to update');
    }
    
    $values[] = $content_id;
    $types .= 'i';
    
    $sql = "UPDATE content SET " . implode(', ', $updates) . " WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$values);
    
    if (!$stmt->execute()) {
        throw new Exception('Failed to update content');
    }
    
    logActivity($conn, $user_id, 'content_update', "Updated content ID: {$content_id}");
    
    echo json_encode([
        'success' => true,
        'message' => 'Content updated successfully'
    ]);
}

/**
 * Delete content
 */
function deleteContent($conn, $user_id) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['content_id'])) {
        throw new Exception('Content ID is required');
    }
    
    $content_id = intval($input['content_id']);
    
    // Verify user owns this content
    $stmt = $conn->prepare("SELECT uploader_id, file_url FROM content WHERE id = ?");
    $stmt->bind_param("i", $content_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($row = $result->fetch_assoc()) {
        if ($row['uploader_id'] != $user_id) {
            throw new Exception('You do not have permission to delete this content');
        }
        
        // Delete physical file if it exists
        $file_path = '../uploads/content/' . $row['file_url'];
        if (file_exists($file_path) && !is_dir($file_path)) {
            unlink($file_path);
        }
        
    } else {
        throw new Exception('Content not found');
    }
    
    // Delete content from database
    $stmt = $conn->prepare("DELETE FROM content WHERE id = ?");
    $stmt->bind_param("i", $content_id);
    
    if (!$stmt->execute()) {
        throw new Exception('Failed to delete content');
    }
    
    logActivity($conn, $user_id, 'content_delete', "Deleted content ID: {$content_id}");
    
    echo json_encode([
        'success' => true,
        'message' => 'Content deleted successfully'
    ]);
}

/**
 * Log user activity
 */
function logActivity($conn, $user_id, $action, $details) {
    $stmt = $conn->prepare("
        INSERT INTO activity_logs (user_id, action, details, ip_address)
        VALUES (?, ?, ?, ?)
    ");
    $ip_address = $_SERVER['REMOTE_ADDR'];
    $stmt->bind_param("isss", $user_id, $action, $details, $ip_address);
    $stmt->execute();
}

/**
 * Notify enrolled students
 */
function notifyEnrolledStudents($conn, $course_id, $content_title, $content_id) {
    // Get all enrolled students
    $stmt = $conn->prepare("
        SELECT user_id, email FROM users
        WHERE user_id IN (
            SELECT student_id FROM enrollments WHERE course_id = ? AND status = 'active'
        )
    ");
    $stmt->bind_param("i", $course_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    // In a real implementation, you would send emails here
    $notification_count = $result->num_rows;
    
    // Log notification
    logActivity($conn, 0, 'notification_sent', "Notified {$notification_count} students about content: {$content_title}");
}
?>

