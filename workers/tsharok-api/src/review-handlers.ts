/**
 * Review Management Handlers for Tsharok API
 * Handles CRUD operations for course reviews and ratings
 */

// Define Env interface to match the main worker
interface Env {
    DB: D1Database;
    BUCKET: R2Bucket;
}

/**
 * Handle POST /api/add-rating
 * Add a new rating/review for a course
 */
export async function handleAddRating(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    try {
        const data = (await request.json()) as any;

        // Validate required fields
        if (!data.userId || !data.courseId || !data.rating || !data.comment) {
            return new Response(
                JSON.stringify({ success: false, message: 'userId, courseId, rating, and comment are required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const userId = parseInt(data.userId);
        const courseId = parseInt(data.courseId);
        const rating = parseInt(data.rating);
        const title = data.title || '';
        const comment = data.comment;
        const wouldRecommend = data.wouldRecommend === true || data.wouldRecommend === 'true';

        // Validate rating range
        if (rating < 1 || rating > 5) {
            return new Response(
                JSON.stringify({ success: false, message: 'Rating must be between 1 and 5' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Check if course exists
        const course = await env.DB.prepare(`
			SELECT course_id FROM courses WHERE course_id = ?
		`).bind(courseId).first();

        if (!course) {
            return new Response(
                JSON.stringify({ success: false, message: 'Course not found' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Check if user already reviewed this course
        const existing = await env.DB.prepare(`
			SELECT rating_id FROM ratings WHERE user_id = ? AND course_id = ?
		`).bind(userId, courseId).first();

        if (existing) {
            return new Response(
                JSON.stringify({ success: false, message: 'You have already reviewed this course. Use update instead.' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Insert rating
        const result = await env.DB.prepare(`
			INSERT INTO ratings (
				user_id, course_id, score, title, review_text,
				would_recommend, created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
		`).bind(userId, courseId, rating, title, comment, wouldRecommend ? 1 : 0).run();

        // Get the newly created rating
        const newRating = await env.DB.prepare(`
			SELECT r.*, u.first_name, u.last_name
			FROM ratings r
			LEFT JOIN users u ON r.user_id = u.user_id
			WHERE r.rating_id = ?
		`).bind(result.meta.last_row_id).first();

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Rating submitted successfully',
                data: {
                    ratingId: result.meta.last_row_id,
                    rating: newRating
                }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Add rating error:', error);
        return new Response(
            JSON.stringify({ success: false, message: 'Failed to add rating', error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * Handle GET /api/get-review?id=X
 * Get a specific review by ID
 */
export async function handleGetReview(url: URL, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    try {
        const reviewId = url.searchParams.get('id');

        if (!reviewId) {
            return new Response(
                JSON.stringify({ success: false, message: 'Review ID is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Get review with user details
        const review = await env.DB.prepare(`
			SELECT 
				r.rating_id,
				r.user_id,
				r.course_id,
				r.score,
				r.title,
				r.review_text,
				r.would_recommend,
				r.created_at,
				r.updated_at,
				u.first_name,
				u.last_name,
				u.profile_image,
				c.title as course_title,
				c.course_code
			FROM ratings r
			LEFT JOIN users u ON r.user_id = u.user_id
			LEFT JOIN courses c ON r.course_id = c.course_id
			WHERE r.rating_id = ?
		`).bind(reviewId).first();

        if (!review) {
            return new Response(
                JSON.stringify({ success: false, message: 'Review not found' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Review retrieved successfully',
                data: {
                    review: {
                        ratingId: review.rating_id,
                        userId: review.user_id,
                        courseId: review.course_id,
                        rating: review.score,
                        title: review.title,
                        comment: review.review_text,
                        wouldRecommend: review.would_recommend === 1,
                        userName: `${review.first_name || ''} ${review.last_name || ''}`.trim(),
                        userImage: review.profile_image,
                        courseTitle: review.course_title,
                        courseCode: review.course_code,
                        createdAt: review.created_at,
                        updatedAt: review.updated_at
                    }
                }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Get review error:', error);
        return new Response(
            JSON.stringify({ success: false, message: 'Failed to retrieve review', error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * Handle PUT /api/update-review
 * Update an existing review
 */
export async function handleUpdateReview(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    try {
        const data = (await request.json()) as any;

        // Validate required fields
        if (!data.reviewId || !data.userId || !data.courseId || !data.rating || !data.comment) {
            return new Response(
                JSON.stringify({ success: false, message: 'reviewId, userId, courseId, rating, and comment are required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const reviewId = parseInt(data.reviewId);
        const userId = parseInt(data.userId);
        const courseId = parseInt(data.courseId);
        const rating = parseInt(data.rating);
        const title = data.title || '';
        const comment = data.comment;
        const wouldRecommend = data.wouldRecommend === true || data.wouldRecommend === 'true';

        // Validate rating range
        if (rating < 1 || rating > 5) {
            return new Response(
                JSON.stringify({ success: false, message: 'Rating must be between 1 and 5' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Verify ownership
        const existing = await env.DB.prepare(`
			SELECT rating_id FROM ratings
			WHERE rating_id = ? AND user_id = ? AND course_id = ?
		`).bind(reviewId, userId, courseId).first();

        if (!existing) {
            return new Response(
                JSON.stringify({ success: false, message: 'Review not found or you do not have permission to update it' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Update rating
        await env.DB.prepare(`
			UPDATE ratings
			SET score = ?,
				title = ?,
				review_text = ?,
				would_recommend = ?,
				updated_at = datetime('now')
			WHERE rating_id = ? AND user_id = ?
		`).bind(rating, title, comment, wouldRecommend ? 1 : 0, reviewId, userId).run();

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Review updated successfully'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Update review error:', error);
        return new Response(
            JSON.stringify({ success: false, message: 'Failed to update review', error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * Handle DELETE /api/delete-review
 * Delete a review
 */
export async function handleDeleteReview(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    try {
        const data = (await request.json()) as any;

        // Validate required fields
        if (!data.reviewId || !data.userId || !data.courseId) {
            return new Response(
                JSON.stringify({ success: false, message: 'reviewId, userId, and courseId are required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const reviewId = parseInt(data.reviewId);
        const userId = parseInt(data.userId);
        const courseId = parseInt(data.courseId);

        // Verify ownership before deletion
        const existing = await env.DB.prepare(`
			SELECT rating_id FROM ratings
			WHERE rating_id = ? AND user_id = ? AND course_id = ?
		`).bind(reviewId, userId, courseId).first();

        if (!existing) {
            return new Response(
                JSON.stringify({ success: false, message: 'Review not found or you do not have permission to delete it' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Delete the rating
        await env.DB.prepare(`
			DELETE FROM ratings
			WHERE rating_id = ? AND user_id = ?
		`).bind(reviewId, userId).run();

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Review deleted successfully'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Delete review error:', error);
        return new Response(
            JSON.stringify({ success: false, message: 'Failed to delete review', error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}
