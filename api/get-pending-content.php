<?php
/**
 * Get Pending Content API
 * Retrieves content awaiting moderation approval
 * Tsharok LMS
 */

// Define initialization constant
define('TSHAROK_INIT', true);

// Start session
session_start();

// Error reporting
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Set headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Include required files
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/session.php';

// Only allow GET and POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(false, 'Invalid request method.');
}

try {
    // Get database connection
    $db = getDB();
    
    // Check authentication
    $sessionToken = $_SESSION['session_token'] ?? null;
    if (!$sessionToken || !validateUserSession($sessionToken, $db)) {
        sendJsonResponse(false, 'Unauthorized. Please login.', null, 401);
    }
    
    // Verify admin role
    if (!hasRole('admin', $db)) {
        sendJsonResponse(false, 'Access denied. Admin privileges required.', null, 403);
    }
    
    // Get filter parameters
    $status = $_GET['status'] ?? 'pending'; // pending, approved, rejected, all
    $type = $_GET['type'] ?? 'all'; // all, lecture, assignment, video, document, quiz, other
    $courseId = $_GET['course_id'] ?? null;
    $search = $_GET['search'] ?? '';
    $sort = $_GET['sort'] ?? 'newest'; // newest, oldest, size, name
    $page = max(1, intval($_GET['page'] ?? 1));
    $limit = min(50, max(1, intval($_GET['limit'] ?? 20)));
    $offset = ($page - 1) * $limit;
    
    // Build WHERE clause
    $where = [];
    $params = [];
    
    // Status filter
    if ($status === 'pending') {
        $where[] = 'c.is_approved = 0';
    } elseif ($status === 'approved') {
        $where[] = 'c.is_approved = 1';
    } elseif ($status === 'rejected') {
        $where[] = 'c.is_approved = -1';
    }
    // 'all' shows everything
    
    // Type filter
    if ($type !== 'all') {
        $where[] = 'c.type = ?';
        $params[] = $type;
    }
    
    // Course filter
    if ($courseId) {
        $where[] = 'c.course_id = ?';
        $params[] = $courseId;
    }
    
    // Search filter
    if (!empty($search)) {
        $where[] = '(c.title LIKE ? OR c.description LIKE ? OR u.username LIKE ? OR u.email LIKE ?)';
        $searchTerm = '%' . $search . '%';
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
    }
    
    $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
    
    // Sorting
    $orderBy = 'c.upload_date DESC';
    switch ($sort) {
        case 'oldest':
            $orderBy = 'c.upload_date ASC';
            break;
        case 'size':
            $orderBy = 'c.file_size DESC';
            break;
        case 'name':
            $orderBy = 'c.title ASC';
            break;
        case 'newest':
        default:
            $orderBy = 'c.upload_date DESC';
            break;
    }
    
    // Get total count
    $countSql = "
        SELECT COUNT(*) as total
        FROM content c
        INNER JOIN users u ON c.uploader_id = u.user_id
        INNER JOIN courses co ON c.course_id = co.course_id
        {$whereClause}
    ";
    
    $countStmt = $db->prepare($countSql);
    $countStmt->execute($params);
    $totalCount = $countStmt->fetch()['total'];
    
    // Get content items
    $sql = "
        SELECT 
            c.id,
            c.title,
            c.type,
            c.file_url,
            c.file_size,
            c.mime_type,
            c.description,
            c.upload_date,
            c.is_approved,
            c.course_id,
            c.uploader_id,
            u.username as uploader_username,
            u.email as uploader_email,
            u.first_name as uploader_first_name,
            u.last_name as uploader_last_name,
            co.title as course_title,
            co.course_code
        FROM content c
        INNER JOIN users u ON c.uploader_id = u.user_id
        INNER JOIN courses co ON c.course_id = co.course_id
        {$whereClause}
        ORDER BY {$orderBy}
        LIMIT ? OFFSET ?
    ";
    
    $params[] = $limit;
    $params[] = $offset;
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $content = $stmt->fetchAll();
    
    // Format the results
    $formattedContent = array_map(function($item) {
        return [
            'id' => $item['id'],
            'title' => $item['title'],
            'type' => $item['type'],
            'fileUrl' => $item['file_url'],
            'fileSize' => $item['file_size'],
            'fileSizeFormatted' => formatFileSize($item['file_size']),
            'mimeType' => $item['mime_type'],
            'description' => $item['description'],
            'uploadDate' => $item['upload_date'],
            'uploadDateFormatted' => date('Y-m-d H:i', strtotime($item['upload_date'])),
            'status' => $item['is_approved'] == 1 ? 'approved' : ($item['is_approved'] == -1 ? 'rejected' : 'pending'),
            'isApproved' => $item['is_approved'],
            'course' => [
                'id' => $item['course_id'],
                'title' => $item['course_title'],
                'code' => $item['course_code']
            ],
            'uploader' => [
                'id' => $item['uploader_id'],
                'username' => $item['uploader_username'],
                'email' => $item['uploader_email'],
                'fullName' => $item['uploader_first_name'] . ' ' . $item['uploader_last_name']
            ]
        ];
    }, $content);
    
    // Pagination info
    $totalPages = ceil($totalCount / $limit);
    
    sendJsonResponse(true, 'Content retrieved successfully', [
        'content' => $formattedContent,
        'pagination' => [
            'currentPage' => $page,
            'totalPages' => $totalPages,
            'totalItems' => $totalCount,
            'itemsPerPage' => $limit,
            'hasNextPage' => $page < $totalPages,
            'hasPreviousPage' => $page > 1
        ],
        'filters' => [
            'status' => $status,
            'type' => $type,
            'courseId' => $courseId,
            'search' => $search,
            'sort' => $sort
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Get Pending Content Exception: " . $e->getMessage());
    sendJsonResponse(false, 'An error occurred while retrieving content.');
}

/**
 * Format file size in human readable format
 */
function formatFileSize($bytes) {
    if ($bytes >= 1073741824) {
        return number_format($bytes / 1073741824, 2) . ' GB';
    } elseif ($bytes >= 1048576) {
        return number_format($bytes / 1048576, 2) . ' MB';
    } elseif ($bytes >= 1024) {
        return number_format($bytes / 1024, 2) . ' KB';
    } else {
        return $bytes . ' bytes';
    }
}
?>

