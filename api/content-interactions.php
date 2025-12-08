<?php
/**
 * Content Interactions API
 * Handles downloads, ratings, and comments for content
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';
require_once '../includes/session.php';

session_start();

// Check if user is authenticated
if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized. Please login.'
    ]);
    http_response_code(401);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$user_id = $_SESSION['user_id'];

try {
    $db = new Database();
    $conn = $db->getConnection();

    // Determine action
    $action = $_GET['action'] ?? $_POST['action'] ?? '';

    switch ($action) {
        case 'download':
            recordDownload($conn, $user_id);
            break;
        
        case 'rate':
            rateContent($conn, $user_id);
            break;
        
        case 'comment':
            if ($method === 'POST') {
                addComment($conn, $user_id);
            } elseif ($method === 'GET') {
                getComments($conn);
            }
            break;
        
        case 'get_ratings':
            getRatings($conn);
            break;
        
        default:
            throw new Exception('Invalid action');
    }

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
    http_response_code(500);
}

/**
 * Record content download
 */
function recordDownload($conn, $user_id) {
    if (empty($_POST['content_id'])) {
        throw new Exception('Content ID is required');
    }
    
    $content_id = intval($_POST['content_id']);
    
    // Verify content exists
    $stmt = $conn->prepare("SELECT id, file_url, title FROM content WHERE id = ? AND is_approved = 1");
    $stmt->bind_param("i", $content_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        throw new Exception('Content not found');
    }
    
    $content = $result->fetch_assoc();
    
    // Record download
    $stmt = $conn->prepare("
        INSERT INTO downloads (user_id, content_id, download_date)
        VALUES (?, ?, NOW())
    ");
    $stmt->bind_param("ii", $user_id, $content_id);
    
    if (!$stmt->execute()) {
        throw new Exception('Failed to record download');
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Download recorded successfully',
        'data' => [
            'file_url' => '../uploads/content/' . $content['file_url'],
            'filename' => $content['title']
        ]
    ]);
}

/**
 * Rate content
 */
function rateContent($conn, $user_id) {
    if (empty($_POST['content_id']) || !isset($_POST['rating'])) {
        throw new Exception('Content ID and rating are required');
    }
    
    $content_id = intval($_POST['content_id']);
    $rating = intval($_POST['rating']);
    $comment = trim($_POST['comment'] ?? '');
    
    // Validate rating
    if ($rating < 1 || $rating > 5) {
        throw new Exception('Rating must be between 1 and 5');
    }
    
    // Check if user already rated this content
    $stmt = $conn->prepare("SELECT id FROM ratings WHERE user_id = ? AND content_id = ?");
    $stmt->bind_param("ii", $user_id, $content_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        // Update existing rating
        $stmt = $conn->prepare("
            UPDATE ratings 
            SET rating = ?, comment = ?, rating_date = NOW()
            WHERE user_id = ? AND content_id = ?
        ");
        $stmt->bind_param("isii", $rating, $comment, $user_id, $content_id);
        $message = 'Rating updated successfully';
    } else {
        // Insert new rating
        $stmt = $conn->prepare("
            INSERT INTO ratings (user_id, content_id, rating, comment, rating_date)
            VALUES (?, ?, ?, ?, NOW())
        ");
        $stmt->bind_param("iiis", $user_id, $content_id, $rating, $comment);
        $message = 'Rating submitted successfully';
    }
    
    if (!$stmt->execute()) {
        throw new Exception('Failed to save rating');
    }
    
    // Get updated average rating
    $stmt = $conn->prepare("
        SELECT AVG(rating) as avg_rating, COUNT(*) as rating_count
        FROM ratings
        WHERE content_id = ?
    ");
    $stmt->bind_param("i", $content_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $stats = $result->fetch_assoc();
    
    echo json_encode([
        'success' => true,
        'message' => $message,
        'data' => [
            'avg_rating' => round($stats['avg_rating'], 1),
            'rating_count' => $stats['rating_count']
        ]
    ]);
}

/**
 * Add comment to content
 */
function addComment($conn, $user_id) {
    if (empty($_POST['content_id']) || empty($_POST['comment'])) {
        throw new Exception('Content ID and comment are required');
    }
    
    $content_id = intval($_POST['content_id']);
    $comment_text = trim($_POST['comment']);
    $parent_id = !empty($_POST['parent_id']) ? intval($_POST['parent_id']) : null;
    
    // Validate comment length
    if (strlen($comment_text) < 1 || strlen($comment_text) > 1000) {
        throw new Exception('Comment must be between 1 and 1000 characters');
    }
    
    // Verify content exists
    $stmt = $conn->prepare("SELECT id FROM content WHERE id = ? AND is_approved = 1");
    $stmt->bind_param("i", $content_id);
    $stmt->execute();
    
    if ($stmt->get_result()->num_rows === 0) {
        throw new Exception('Content not found');
    }
    
    // Insert comment
    if ($parent_id) {
        $stmt = $conn->prepare("
            INSERT INTO comments (user_id, content_id, parent_id, comment_text, comment_date)
            VALUES (?, ?, ?, ?, NOW())
        ");
        $stmt->bind_param("iiis", $user_id, $content_id, $parent_id, $comment_text);
    } else {
        $stmt = $conn->prepare("
            INSERT INTO comments (user_id, content_id, comment_text, comment_date)
            VALUES (?, ?, ?, NOW())
        ");
        $stmt->bind_param("iis", $user_id, $content_id, $comment_text);
    }
    
    if (!$stmt->execute()) {
        throw new Exception('Failed to add comment');
    }
    
    $comment_id = $conn->insert_id;
    
    // Get user info for the comment
    $stmt = $conn->prepare("
        SELECT c.*, u.name, u.user_type
        FROM comments c
        JOIN users u ON c.user_id = u.user_id
        WHERE c.id = ?
    ");
    $stmt->bind_param("i", $comment_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $comment_data = $result->fetch_assoc();
    
    echo json_encode([
        'success' => true,
        'message' => 'Comment added successfully',
        'data' => $comment_data
    ]);
}

/**
 * Get comments for content
 */
function getComments($conn) {
    if (empty($_GET['content_id'])) {
        throw new Exception('Content ID is required');
    }
    
    $content_id = intval($_GET['content_id']);
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
    $offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;
    
    // Get comments with user info
    $stmt = $conn->prepare("
        SELECT c.*, u.name, u.user_type,
               (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) as likes
        FROM comments c
        JOIN users u ON c.user_id = u.user_id
        WHERE c.content_id = ? AND c.parent_id IS NULL
        ORDER BY c.comment_date DESC
        LIMIT ? OFFSET ?
    ");
    $stmt->bind_param("iii", $content_id, $limit, $offset);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $comments = [];
    while ($row = $result->fetch_assoc()) {
        // Get replies for each comment
        $comment_id = $row['id'];
        $reply_stmt = $conn->prepare("
            SELECT c.*, u.name, u.user_type,
                   (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) as likes
            FROM comments c
            JOIN users u ON c.user_id = u.user_id
            WHERE c.parent_id = ?
            ORDER BY c.comment_date ASC
        ");
        $reply_stmt->bind_param("i", $comment_id);
        $reply_stmt->execute();
        $reply_result = $reply_stmt->get_result();
        
        $replies = [];
        while ($reply = $reply_result->fetch_assoc()) {
            $replies[] = $reply;
        }
        
        $row['replies'] = $replies;
        $comments[] = $row;
    }
    
    // Get total comment count
    $stmt = $conn->prepare("SELECT COUNT(*) as total FROM comments WHERE content_id = ?");
    $stmt->bind_param("i", $content_id);
    $stmt->execute();
    $total_result = $stmt->get_result();
    $total = $total_result->fetch_assoc()['total'];
    
    echo json_encode([
        'success' => true,
        'data' => $comments,
        'total' => $total,
        'limit' => $limit,
        'offset' => $offset
    ]);
}

/**
 * Get ratings for content
 */
function getRatings($conn) {
    if (empty($_GET['content_id'])) {
        throw new Exception('Content ID is required');
    }
    
    $content_id = intval($_GET['content_id']);
    
    // Get overall statistics
    $stmt = $conn->prepare("
        SELECT 
            AVG(rating) as avg_rating,
            COUNT(*) as total_ratings,
            SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
            SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
            SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
            SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
            SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
        FROM ratings
        WHERE content_id = ?
    ");
    $stmt->bind_param("i", $content_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $stats = $result->fetch_assoc();
    
    // Get recent ratings with comments
    $stmt = $conn->prepare("
        SELECT r.*, u.name
        FROM ratings r
        JOIN users u ON r.user_id = u.user_id
        WHERE r.content_id = ? AND r.comment IS NOT NULL AND r.comment != ''
        ORDER BY r.rating_date DESC
        LIMIT 10
    ");
    $stmt->bind_param("i", $content_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $recent_ratings = [];
    while ($row = $result->fetch_assoc()) {
        $recent_ratings[] = $row;
    }
    
    echo json_encode([
        'success' => true,
        'data' => [
            'statistics' => $stats,
            'recent_ratings' => $recent_ratings
        ]
    ]);
}
?>

