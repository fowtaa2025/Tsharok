<?php
/**
 * Rating Handler Class
 * Manages course ratings and reviews
 */

defined('TSHAROK_INIT') or die('Direct access not permitted');

require_once __DIR__ . '/markdown.php';

class RatingHandler {
    private $db;
    private $userId;
    
    public function __construct($db, $userId = null) {
        $this->db = $db;
        $this->userId = $userId;
    }
    
    /**
     * Add rating and review
     */
    public function addRating($courseId, $rating, $comment, $title = null, $wouldRecommend = false) {
        // Validate inputs
        $validation = $this->validateRatingInput($courseId, $rating, $comment);
        if (!$validation['valid']) {
            return $validation;
        }
        
        // Check if user is enrolled
        if (!$this->isUserEnrolled($courseId)) {
            return [
                'success' => false,
                'message' => 'You must be enrolled in this course to rate it'
            ];
        }
        
        // Check if already rated
        if ($this->hasUserRated($courseId)) {
            return [
                'success' => false,
                'message' => 'You have already rated this course'
            ];
        }
        
        try {
            $this->db->beginTransaction();
            
            // Sanitize markdown
            $comment = sanitizeMarkdown($comment);
            
            // Insert rating
            $stmt = $this->db->prepare("
                INSERT INTO ratings (user_id, course_id, rating, created_at)
                VALUES (?, ?, ?, NOW())
            ");
            $stmt->execute([$this->userId, $courseId, $rating]);
            $ratingId = $this->db->lastInsertId();
            
            // Insert comment
            $stmt = $this->db->prepare("
                INSERT INTO comments (
                    user_id, course_id, comment, title, 
                    would_recommend, helpful_count, created_at
                ) VALUES (?, ?, ?, ?, ?, 0, NOW())
            ");
            $stmt->execute([
                $this->userId, 
                $courseId, 
                $comment, 
                $title,
                $wouldRecommend ? 1 : 0
            ]);
            $commentId = $this->db->lastInsertId();
            
            // Update course average rating
            $this->updateCourseAverageRating($courseId);
            
            // Log activity
            logActivity($this->userId, 'add_rating', 
                "Added rating $rating for course ID $courseId", $this->db);
            
            $this->db->commit();
            
            return [
                'success' => true,
                'message' => 'Review submitted successfully',
                'data' => [
                    'ratingId' => $ratingId,
                    'commentId' => $commentId
                ]
            ];
            
        } catch (PDOException $e) {
            $this->db->rollBack();
            error_log("Add Rating Error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to submit review'
            ];
        }
    }
    
    /**
     * Update existing rating
     */
    public function updateRating($commentId, $courseId, $rating, $comment, $title = null, $wouldRecommend = false) {
        // Validate ownership
        if (!$this->isReviewOwner($commentId)) {
            return [
                'success' => false,
                'message' => 'Unauthorized'
            ];
        }
        
        // Validate inputs
        $validation = $this->validateRatingInput($courseId, $rating, $comment);
        if (!$validation['valid']) {
            return $validation;
        }
        
        try {
            $this->db->beginTransaction();
            
            // Sanitize markdown
            $comment = sanitizeMarkdown($comment);
            
            // Update comment
            $stmt = $this->db->prepare("
                UPDATE comments 
                SET comment = ?, title = ?, would_recommend = ?, updated_at = NOW()
                WHERE comment_id = ? AND user_id = ?
            ");
            $stmt->execute([
                $comment, 
                $title, 
                $wouldRecommend ? 1 : 0, 
                $commentId, 
                $this->userId
            ]);
            
            // Update rating
            $stmt = $this->db->prepare("
                UPDATE ratings 
                SET rating = ?, updated_at = NOW()
                WHERE user_id = ? AND course_id = ?
            ");
            $stmt->execute([$rating, $this->userId, $courseId]);
            
            // Update course average rating
            $this->updateCourseAverageRating($courseId);
            
            // Log activity
            logActivity($this->userId, 'update_rating', 
                "Updated rating for course ID $courseId", $this->db);
            
            $this->db->commit();
            
            return [
                'success' => true,
                'message' => 'Review updated successfully'
            ];
            
        } catch (PDOException $e) {
            $this->db->rollBack();
            error_log("Update Rating Error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to update review'
            ];
        }
    }
    
    /**
     * Delete rating and review
     */
    public function deleteRating($commentId, $courseId) {
        // Validate ownership
        if (!$this->isReviewOwner($commentId)) {
            return [
                'success' => false,
                'message' => 'Unauthorized'
            ];
        }
        
        try {
            $this->db->beginTransaction();
            
            // Delete comment
            $stmt = $this->db->prepare("
                DELETE FROM comments 
                WHERE comment_id = ? AND user_id = ?
            ");
            $stmt->execute([$commentId, $this->userId]);
            
            // Delete rating
            $stmt = $this->db->prepare("
                DELETE FROM ratings 
                WHERE user_id = ? AND course_id = ?
            ");
            $stmt->execute([$this->userId, $courseId]);
            
            // Update course average rating
            $this->updateCourseAverageRating($courseId);
            
            // Log activity
            logActivity($this->userId, 'delete_rating', 
                "Deleted rating for course ID $courseId", $this->db);
            
            $this->db->commit();
            
            return [
                'success' => true,
                'message' => 'Review deleted successfully'
            ];
            
        } catch (PDOException $e) {
            $this->db->rollBack();
            error_log("Delete Rating Error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to delete review'
            ];
        }
    }
    
    /**
     * Get course ratings statistics
     */
    public function getCourseRatingsStats($courseId) {
        try {
            // Get average and count
            $stmt = $this->db->prepare("
                SELECT 
                    COALESCE(AVG(rating), 0) as average_rating,
                    COUNT(*) as total_ratings
                FROM ratings
                WHERE course_id = ?
            ");
            $stmt->execute([$courseId]);
            $stats = $stmt->fetch();
            
            // Get distribution
            $stmt = $this->db->prepare("
                SELECT rating, COUNT(*) as count
                FROM ratings
                WHERE course_id = ?
                GROUP BY rating
                ORDER BY rating DESC
            ");
            $stmt->execute([$courseId]);
            $distribution = $stmt->fetchAll();
            
            // Fill missing ratings
            $distributionMap = array_fill(1, 5, 0);
            foreach ($distribution as $item) {
                $distributionMap[$item['rating']] = intval($item['count']);
            }
            
            $distributionArray = [];
            for ($i = 5; $i >= 1; $i--) {
                $distributionArray[] = [
                    'rating' => $i,
                    'count' => $distributionMap[$i]
                ];
            }
            
            return [
                'success' => true,
                'data' => [
                    'averageRating' => round(floatval($stats['average_rating']), 1),
                    'totalRatings' => intval($stats['total_ratings']),
                    'distribution' => $distributionArray
                ]
            ];
            
        } catch (PDOException $e) {
            error_log("Get Ratings Stats Error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to retrieve ratings'
            ];
        }
    }
    
    /**
     * Get reviews with pagination and filtering
     */
    public function getReviews($courseId, $page = 1, $limit = 10, $filter = 'all', $sort = 'recent') {
        try {
            $offset = ($page - 1) * $limit;
            
            // Build WHERE clause
            $where = "c.course_id = ?";
            $params = [$courseId];
            
            if ($filter !== 'all' && in_array($filter, ['1', '2', '3', '4', '5'])) {
                $where .= " AND r.rating = ?";
                $params[] = intval($filter);
            }
            
            // Build ORDER BY clause
            $orderBy = $this->getSortClause($sort);
            
            // Get reviews
            $stmt = $this->db->prepare("
                SELECT 
                    c.comment_id as id,
                    c.comment,
                    c.title,
                    c.would_recommend,
                    c.helpful_count,
                    c.created_at,
                    c.updated_at,
                    u.user_id,
                    u.username,
                    CONCAT(u.first_name, ' ', u.last_name) as user_name,
                    u.profile_image as user_avatar,
                    r.rating,
                    (c.user_id = ?) as is_own_review
                FROM comments c
                INNER JOIN users u ON c.user_id = u.user_id
                LEFT JOIN ratings r ON c.user_id = r.user_id AND c.course_id = r.course_id
                WHERE $where
                ORDER BY $orderBy
                LIMIT ? OFFSET ?
            ");
            
            $currentUserId = $this->userId ?? 0;
            $params = array_merge([$currentUserId], $params, [$limit + 1, $offset]);
            $stmt->execute($params);
            
            $reviews = $stmt->fetchAll();
            $hasMore = count($reviews) > $limit;
            
            if ($hasMore) {
                array_pop($reviews);
            }
            
            // Process reviews
            $formattedReviews = array_map(function($review) {
                return [
                    'id' => $review['id'],
                    'userName' => $review['user_name'],
                    'username' => $review['username'],
                    'userAvatar' => $review['user_avatar'],
                    'rating' => intval($review['rating']),
                    'title' => $review['title'],
                    'comment' => $review['comment'],
                    'commentHtml' => markdownToHtml($review['comment']),
                    'wouldRecommend' => (bool)$review['would_recommend'],
                    'helpfulCount' => intval($review['helpful_count']),
                    'createdAt' => $review['created_at'],
                    'updatedAt' => $review['updated_at'],
                    'isOwnReview' => (bool)$review['is_own_review'],
                    'isEdited' => !empty($review['updated_at'])
                ];
            }, $reviews);
            
            return [
                'success' => true,
                'data' => [
                    'reviews' => $formattedReviews,
                    'hasMore' => $hasMore,
                    'page' => $page,
                    'limit' => $limit
                ]
            ];
            
        } catch (PDOException $e) {
            error_log("Get Reviews Error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to retrieve reviews'
            ];
        }
    }
    
    /**
     * Mark review as helpful
     */
    public function markAsHelpful($commentId) {
        try {
            $stmt = $this->db->prepare("
                UPDATE comments 
                SET helpful_count = helpful_count + 1 
                WHERE comment_id = ?
            ");
            $stmt->execute([$commentId]);
            
            return [
                'success' => true,
                'message' => 'Marked as helpful'
            ];
            
        } catch (PDOException $e) {
            error_log("Mark Helpful Error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to mark as helpful'
            ];
        }
    }
    
    /**
     * Get single review
     */
    public function getReview($commentId) {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    c.*,
                    r.rating
                FROM comments c
                LEFT JOIN ratings r ON c.user_id = r.user_id AND c.course_id = r.course_id
                WHERE c.comment_id = ? AND c.user_id = ?
            ");
            $stmt->execute([$commentId, $this->userId]);
            $review = $stmt->fetch();
            
            if (!$review) {
                return [
                    'success' => false,
                    'message' => 'Review not found'
                ];
            }
            
            return [
                'success' => true,
                'data' => [
                    'id' => $review['comment_id'],
                    'rating' => intval($review['rating']),
                    'title' => $review['title'],
                    'comment' => $review['comment'],
                    'wouldRecommend' => (bool)$review['would_recommend']
                ]
            ];
            
        } catch (PDOException $e) {
            error_log("Get Review Error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to retrieve review'
            ];
        }
    }
    
    /**
     * Private helper methods
     */
    
    private function validateRatingInput($courseId, $rating, $comment) {
        if (empty($courseId) || !is_numeric($courseId)) {
            return [
                'success' => false,
                'valid' => false,
                'message' => 'Invalid course ID'
            ];
        }
        
        if (empty($rating) || $rating < 1 || $rating > 5) {
            return [
                'success' => false,
                'valid' => false,
                'message' => 'Rating must be between 1 and 5'
            ];
        }
        
        $lengthValidation = validateMarkdownLength($comment, 10, 5000);
        if (!$lengthValidation['valid']) {
            return [
                'success' => false,
                'valid' => false,
                'message' => $lengthValidation['message']
            ];
        }
        
        return ['valid' => true];
    }
    
    private function isUserEnrolled($courseId) {
        $stmt = $this->db->prepare("
            SELECT enrollment_id 
            FROM enrollments 
            WHERE user_id = ? AND course_id = ? AND status = 'active'
        ");
        $stmt->execute([$this->userId, $courseId]);
        return $stmt->fetch() !== false;
    }
    
    private function hasUserRated($courseId) {
        $stmt = $this->db->prepare("
            SELECT rating_id 
            FROM ratings 
            WHERE user_id = ? AND course_id = ?
        ");
        $stmt->execute([$this->userId, $courseId]);
        return $stmt->fetch() !== false;
    }
    
    private function isReviewOwner($commentId) {
        $stmt = $this->db->prepare("
            SELECT comment_id 
            FROM comments 
            WHERE comment_id = ? AND user_id = ?
        ");
        $stmt->execute([$commentId, $this->userId]);
        return $stmt->fetch() !== false;
    }
    
    private function updateCourseAverageRating($courseId) {
        // This could update a courses table if you have one
        // For now, we calculate on the fly
        return true;
    }
    
    private function getSortClause($sort) {
        switch ($sort) {
            case 'helpful':
                return 'c.helpful_count DESC, c.created_at DESC';
            case 'highest':
                return 'r.rating DESC, c.created_at DESC';
            case 'lowest':
                return 'r.rating ASC, c.created_at DESC';
            case 'recent':
            default:
                return 'c.created_at DESC';
        }
    }
}
?>

