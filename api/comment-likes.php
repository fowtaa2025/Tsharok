<?php
/**
 * Comment Likes API
 * Handles toggling likes on comments
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/session.php';

session_start();

// Check authentication
if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'error' => 'Unauthorized. Please login.'
    ]);
    http_response_code(401);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'success' => false,
        'error' => 'Invalid request method'
    ]);
    http_response_code(405);
    exit();
}

try {
    // Get request data
    $data = json_decode(file_get_contents('php://input'), true);
    $commentId = isset($data['commentId']) ? intval($data['commentId']) : 0;
    $userId = $_SESSION['user_id'];

    if ($commentId <= 0) {
        throw new Exception('Invalid comment ID');
    }

    // Connect to database
    $db = new Database();
    $conn = $db->getConnection();

    // Check if comment exists
    $stmt = $conn->prepare("SELECT id FROM comments WHERE id = ?");
    $stmt->bind_param("i", $commentId);
    $stmt->execute();
    if ($stmt->get_result()->num_rows === 0) {
        throw new Exception('Comment not found');
    }

    // Check if user already liked this comment
    $stmt = $conn->prepare("SELECT id FROM comment_likes WHERE comment_id = ? AND user_id = ?");
    $stmt->bind_param("ii", $commentId, $userId);
    $stmt->execute();
    $result = $stmt->get_result();

    $liked = false;
    if ($result->num_rows > 0) {
        // Unlike - remove the like
        $stmt = $conn->prepare("DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?");
        $stmt->bind_param("ii", $commentId, $userId);
        $stmt->execute();
        $liked = false;
    } else {
        // Like - add the like
        $stmt = $conn->prepare("INSERT INTO comment_likes (comment_id, user_id, created_at) VALUES (?, ?, NOW())");
        $stmt->bind_param("ii", $commentId, $userId);
        $stmt->execute();
        $liked = true;
    }

    // Get updated like count
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = ?");
    $stmt->bind_param("i", $commentId);
    $stmt->execute();
    $likeCount = $stmt->get_result()->fetch_assoc()['count'];

    // Return success response
    echo json_encode([
        'success' => true,
        'liked' => $liked,
        'likes' => intval($likeCount),
        'message' => $liked ? 'Comment liked' : 'Comment unliked'
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
    http_response_code(500);
}
?>
