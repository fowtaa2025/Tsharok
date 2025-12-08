<?php
/**
 * View Materials API
 * Fetches all materials metadata from MySQL associated with a specific course ID
 * Tsharok LMS
 * 
 * ENDPOINT: GET /api/view-materials.php
 * 
 * REQUIRED PARAMETERS:
 *   - course_id (int): The ID of the course
 * 
 * OPTIONAL PARAMETERS:
 *   - type (string): Filter by type (lecture, video, assignment, document, quiz, other)
 *   - search (string): Search term for title/description
 *   - sort_by (string): Sort column (upload_date, title, type, created_at, updated_at)
 *   - sort_order (string): ASC or DESC (default: DESC)
 *   - limit (int): Items per page (max 100)
 *   - offset (int): Pagination offset
 *   - group_by_type (bool): Group materials by content type
 *   - show_unapproved (bool): Show unapproved materials (instructor only)
 * 
 * RESPONSE FORMAT:
 *   {
 *     "success": true,
 *     "message": "Materials fetched successfully",
 *     "timestamp": "2025-11-06 10:30:00",
 *     "data": {
 *       "course": {...},
 *       "user_role": "student",
 *       "materials": [...],
 *       "total_count": 24,
 *       "returned_count": 10,
 *       "pagination": {...}
 *     }
 *   }
 * 
 * USAGE EXAMPLE:
 *   fetch('../api/view-materials.php?course_id=1&type=lecture&limit=10')
 *     .then(response => response.json())
 *     .then(data => console.log(data.data.materials));
 * 
 * TESTING:
 *   Open api/test-view-materials.html in your browser for interactive testing
 */

// Define initialization constant
define('TSHAROK_INIT', true);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';
require_once '../includes/session.php';

// Start session
session_start();

/**
 * Send JSON response
 */
function sendResponse($success, $message, $data = null, $statusCode = 200) {
    http_response_code($statusCode);
    $response = [
        'success' => $success,
        'message' => $message,
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    if ($data !== null) {
        $response['data'] = $data;
    }
    
    echo json_encode($response);
    exit;
}

/**
 * Validate course access
 */
function validateCourseAccess($conn, $course_id, $user_id = null) {
    try {
        // First, check if course exists
        $stmt = $conn->prepare("SELECT course_id, course_name, course_code FROM courses WHERE course_id = ?");
        $stmt->execute([$course_id]);
        $course = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$course) {
            return ['valid' => false, 'message' => 'Course not found'];
        }
        
        // If user is logged in, check enrollment or instructor status
        if ($user_id) {
            // Check if user is the instructor
            $stmt = $conn->prepare("SELECT instructor_id FROM courses WHERE course_id = ? AND instructor_id = ?");
            $stmt->execute([$course_id, $user_id]);
            if ($stmt->fetch()) {
                return ['valid' => true, 'role' => 'instructor', 'course' => $course];
            }
            
            // Check if user is enrolled
            $stmt = $conn->prepare("
                SELECT enrollment_id, status 
                FROM enrollments 
                WHERE course_id = ? AND student_id = ? AND status = 'active'
            ");
            $stmt->execute([$course_id, $user_id]);
            if ($stmt->fetch()) {
                return ['valid' => true, 'role' => 'student', 'course' => $course];
            }
            
            return ['valid' => false, 'message' => 'You are not enrolled in this course'];
        }
        
        return ['valid' => true, 'role' => 'guest', 'course' => $course];
        
    } catch (PDOException $e) {
        error_log("Database Error in validateCourseAccess: " . $e->getMessage());
        return ['valid' => false, 'message' => 'Database error occurred'];
    }
}

/**
 * Get all materials for a specific course
 */
function getMaterialsByCourse($conn, $course_id, $user_id = null, $filters = []) {
    try {
        // Build the SQL query
        $sql = "
            SELECT 
                c.id,
                c.title,
                c.type,
                c.file_url,
                c.upload_date,
                c.description,
                c.file_size,
                c.mime_type,
                c.is_approved,
                c.created_at,
                c.updated_at,
                u.user_id as uploader_id,
                u.name as uploader_name,
                u.email as uploader_email,
                co.course_id,
                co.course_name,
                co.course_code,
                (SELECT AVG(rating) FROM ratings WHERE content_id = c.id) as avg_rating,
                (SELECT COUNT(*) FROM ratings WHERE content_id = c.id) as rating_count,
                (SELECT COUNT(*) FROM comments WHERE content_id = c.id) as comment_count,
                (SELECT COUNT(*) FROM downloads WHERE content_id = c.id) as download_count
            FROM content c
            INNER JOIN users u ON c.uploader_id = u.user_id
            INNER JOIN courses co ON c.course_id = co.course_id
            WHERE c.course_id = ?
        ";
        
        $params = [$course_id];
        
        // Only show approved materials to students and guests
        // Instructors can see all materials including unapproved ones
        if (!isset($filters['show_unapproved']) || !$filters['show_unapproved']) {
            $sql .= " AND c.is_approved = 1";
        }
        
        // Filter by content type if specified
        if (isset($filters['type']) && !empty($filters['type'])) {
            $sql .= " AND c.type = ?";
            $params[] = $filters['type'];
        }
        
        // Search by title or description if specified
        if (isset($filters['search']) && !empty($filters['search'])) {
            $sql .= " AND (c.title LIKE ? OR c.description LIKE ?)";
            $searchTerm = '%' . $filters['search'] . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        // Sorting
        $sortBy = $filters['sort_by'] ?? 'upload_date';
        $sortOrder = $filters['sort_order'] ?? 'DESC';
        
        // Validate sort parameters to prevent SQL injection
        $allowedSortColumns = ['upload_date', 'title', 'type', 'created_at', 'updated_at'];
        $allowedSortOrders = ['ASC', 'DESC'];
        
        if (!in_array($sortBy, $allowedSortColumns)) {
            $sortBy = 'upload_date';
        }
        if (!in_array(strtoupper($sortOrder), $allowedSortOrders)) {
            $sortOrder = 'DESC';
        }
        
        $sql .= " ORDER BY c.{$sortBy} {$sortOrder}";
        
        // Pagination
        if (isset($filters['limit']) && isset($filters['offset'])) {
            $sql .= " LIMIT ? OFFSET ?";
            $params[] = (int)$filters['limit'];
            $params[] = (int)$filters['offset'];
        }
        
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        $materials = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format the materials data
        $formattedMaterials = [];
        foreach ($materials as $material) {
            $formattedMaterial = [
                'id' => (int)$material['id'],
                'title' => $material['title'],
                'type' => $material['type'],
                'description' => $material['description'],
                'file_url' => $material['file_url'],
                'file_size' => (int)$material['file_size'],
                'file_size_formatted' => formatFileSize($material['file_size']),
                'mime_type' => $material['mime_type'],
                'is_approved' => (bool)$material['is_approved'],
                'upload_date' => $material['upload_date'],
                'upload_date_formatted' => formatDate($material['upload_date']),
                'created_at' => $material['created_at'],
                'updated_at' => $material['updated_at'],
                'uploader' => [
                    'id' => (int)$material['uploader_id'],
                    'name' => $material['uploader_name'],
                    'email' => $material['uploader_email']
                ],
                'course' => [
                    'id' => (int)$material['course_id'],
                    'name' => $material['course_name'],
                    'code' => $material['course_code']
                ],
                'statistics' => [
                    'avg_rating' => $material['avg_rating'] ? round((float)$material['avg_rating'], 2) : null,
                    'rating_count' => (int)$material['rating_count'],
                    'comment_count' => (int)$material['comment_count'],
                    'download_count' => (int)$material['download_count']
                ]
            ];
            
            $formattedMaterials[] = $formattedMaterial;
        }
        
        // Get total count for pagination
        $countSql = "
            SELECT COUNT(*) as total
            FROM content c
            WHERE c.course_id = ?
        ";
        
        $countParams = [$course_id];
        
        if (!isset($filters['show_unapproved']) || !$filters['show_unapproved']) {
            $countSql .= " AND c.is_approved = 1";
        }
        
        if (isset($filters['type']) && !empty($filters['type'])) {
            $countSql .= " AND c.type = ?";
            $countParams[] = $filters['type'];
        }
        
        if (isset($filters['search']) && !empty($filters['search'])) {
            $countSql .= " AND (c.title LIKE ? OR c.description LIKE ?)";
            $searchTerm = '%' . $filters['search'] . '%';
            $countParams[] = $searchTerm;
            $countParams[] = $searchTerm;
        }
        
        $countStmt = $conn->prepare($countSql);
        $countStmt->execute($countParams);
        $totalCount = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        return [
            'success' => true,
            'materials' => $formattedMaterials,
            'total_count' => (int)$totalCount,
            'returned_count' => count($formattedMaterials)
        ];
        
    } catch (PDOException $e) {
        error_log("Database Error in getMaterialsByCourse: " . $e->getMessage());
        return [
            'success' => false,
            'message' => 'Failed to fetch materials: ' . $e->getMessage()
        ];
    }
}

/**
 * Get materials grouped by type
 */
function getMaterialsGroupedByType($conn, $course_id, $user_id = null) {
    try {
        $filters = ['show_unapproved' => false];
        $result = getMaterialsByCourse($conn, $course_id, $user_id, $filters);
        
        if (!$result['success']) {
            return $result;
        }
        
        $groupedMaterials = [
            'lecture' => [],
            'assignment' => [],
            'video' => [],
            'document' => [],
            'quiz' => [],
            'other' => []
        ];
        
        foreach ($result['materials'] as $material) {
            $type = $material['type'];
            if (isset($groupedMaterials[$type])) {
                $groupedMaterials[$type][] = $material;
            } else {
                $groupedMaterials['other'][] = $material;
            }
        }
        
        return [
            'success' => true,
            'materials' => $groupedMaterials,
            'total_count' => $result['total_count']
        ];
        
    } catch (Exception $e) {
        error_log("Error in getMaterialsGroupedByType: " . $e->getMessage());
        return [
            'success' => false,
            'message' => 'Failed to group materials'
        ];
    }
}

/**
 * Format file size for display
 */
function formatFileSize($bytes) {
    if ($bytes == 0) return '0 B';
    
    $units = ['B', 'KB', 'MB', 'GB', 'TB'];
    $index = floor(log($bytes) / log(1024));
    
    return round($bytes / pow(1024, $index), 2) . ' ' . $units[$index];
}

/**
 * Format date for display
 */
function formatDate($datetime) {
    $date = new DateTime($datetime);
    $now = new DateTime();
    $diff = $now->diff($date);
    
    if ($diff->days == 0) {
        if ($diff->h == 0) {
            if ($diff->i == 0) {
                return 'just now';
            }
            return $diff->i . ' minute' . ($diff->i > 1 ? 's' : '') . ' ago';
        }
        return $diff->h . ' hour' . ($diff->h > 1 ? 's' : '') . ' ago';
    } elseif ($diff->days == 1) {
        return 'yesterday';
    } elseif ($diff->days < 7) {
        return $diff->days . ' days ago';
    } else {
        return $date->format('M d, Y');
    }
}

// ==================== MAIN EXECUTION ====================

try {
    // Only allow GET requests
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        sendResponse(false, 'Only GET requests are allowed', null, 405);
    }
    
    // Get database connection
    $db = Database::getInstance();
    $conn = $db->getConnection();
    
    // Get user ID from session if logged in
    $user_id = $_SESSION['user_id'] ?? null;
    
    // Check if course_id is provided
    if (!isset($_GET['course_id']) || empty($_GET['course_id'])) {
        sendResponse(false, 'Course ID is required', null, 400);
    }
    
    $course_id = (int)$_GET['course_id'];
    
    // Validate course access
    $accessCheck = validateCourseAccess($conn, $course_id, $user_id);
    if (!$accessCheck['valid']) {
        sendResponse(false, $accessCheck['message'], null, 403);
    }
    
    // Prepare filters
    $filters = [];
    
    // Only instructors can see unapproved materials
    if (isset($accessCheck['role']) && $accessCheck['role'] === 'instructor') {
        $filters['show_unapproved'] = isset($_GET['show_unapproved']) && $_GET['show_unapproved'] === 'true';
    } else {
        $filters['show_unapproved'] = false;
    }
    
    // Content type filter
    if (isset($_GET['type']) && !empty($_GET['type'])) {
        $filters['type'] = $_GET['type'];
    }
    
    // Search filter
    if (isset($_GET['search']) && !empty($_GET['search'])) {
        $filters['search'] = trim($_GET['search']);
    }
    
    // Sorting
    if (isset($_GET['sort_by'])) {
        $filters['sort_by'] = $_GET['sort_by'];
    }
    if (isset($_GET['sort_order'])) {
        $filters['sort_order'] = strtoupper($_GET['sort_order']);
    }
    
    // Pagination
    if (isset($_GET['limit'])) {
        $filters['limit'] = max(1, min(100, (int)$_GET['limit'])); // Max 100 items per page
    }
    if (isset($_GET['offset'])) {
        $filters['offset'] = max(0, (int)$_GET['offset']);
    }
    
    // Check if grouped by type is requested
    $groupByType = isset($_GET['group_by_type']) && $_GET['group_by_type'] === 'true';
    
    // Fetch materials
    if ($groupByType) {
        $result = getMaterialsGroupedByType($conn, $course_id, $user_id);
    } else {
        $result = getMaterialsByCourse($conn, $course_id, $user_id, $filters);
    }
    
    if ($result['success']) {
        $responseData = [
            'course' => $accessCheck['course'],
            'user_role' => $accessCheck['role'] ?? 'guest',
            'materials' => $result['materials'],
            'total_count' => $result['total_count'],
            'returned_count' => $result['returned_count'] ?? count($result['materials'])
        ];
        
        // Add pagination info if applicable
        if (isset($filters['limit']) && isset($filters['offset'])) {
            $responseData['pagination'] = [
                'limit' => $filters['limit'],
                'offset' => $filters['offset'],
                'total_pages' => ceil($result['total_count'] / $filters['limit']),
                'current_page' => floor($filters['offset'] / $filters['limit']) + 1
            ];
        }
        
        sendResponse(true, 'Materials fetched successfully', $responseData);
    } else {
        sendResponse(false, $result['message'], null, 500);
    }
    
} catch (Exception $e) {
    error_log("Error in view-materials.php: " . $e->getMessage());
    sendResponse(false, 'An unexpected error occurred', null, 500);
}
?>

