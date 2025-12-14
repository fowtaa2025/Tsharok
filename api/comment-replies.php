<?php
/**
 * Comment Replies API
 * Handles adding replies to comments
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
    $text = isset($data['text']) ? trim($data['text']) : '';
    $userId = $_SESSION['user_id'];

    // Validate input
    if ($commentId <= 0) {
        throw new Exception('Invalid comment ID');
    }

    if (empty($text)) {
        throw new Exception('Reply text is required');
    }

    if (strlen($text) > 1000) {
        throw new Exception('Reply text is too long (max 1000 characters)');
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

    // Insert reply
    $stmt = $conn->prepare("
        INSERT INTO comment_replies (comment_id, user_id, content, created_at, updated_at) 
        VALUES (?, ?, ?, NOW(), NOW())
    ");
    $stmt->bind_param("iis", $commentId, $userId, $text);
    $stmt->execute();
    $replyId = $conn->insert_id;

    // Get reply with user info
    $stmt = $conn->prepare("
        SELECT 
            cr.id,
            cr.comment_id,
            cr.user_id,
            cr.content as text,
            cr.created_at,
            u.name as author,
            u.username
        FROM comment_replies cr
        JOIN users u ON cr.user_id = u.user_id
        WHERE cr.id = ?
    ");
    $stmt->bind_param("i", $replyId);
    $stmt->execute();
    $reply = $stmt->get_result()->fetch_assoc();

    // Format the date
    $reply['date'] = date('M j, Y', strtotime($reply['created_at']));

    // Return success response
    echo json_encode([
        'success' => true,
        'reply' => $reply,
        'message' => 'Reply added successfully'
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
    http_response_code(500);
}
?>
