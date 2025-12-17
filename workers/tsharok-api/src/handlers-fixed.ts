/**
 * Handle GET /api/comments
 * Get reviews/comments for a content item with pagination
 */
async function handleGetComments(url: URL, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    const contentId = url.searchParams.get('contentId');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const userId = url.searchParams.get('userId') || '0';

    if (!contentId) {
        return new Response(
            JSON.stringify({ success: false, message: 'contentId parameter is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    try {
        const offset = (page - 1) * limit;

        // Get comments with ratings
        const query = `
			SELECT 
				c.id,
				c.content,
				c.created_at,
				c.updated_at,
				u.user_id,
				u.username,
				u.first_name || ' ' || u.last_name as user_name,
				u.profile_image as user_avatar,
				r.score,
				CASE WHEN c.user_id = ? THEN 1 ELSE 0 END as is_own_comment
			FROM comments c
			INNER JOIN users u ON c.user_id = u.user_id
			LEFT JOIN ratings r ON c.user_id = r.user_id AND c.content_id = r.content_id
			WHERE c.content_id = ?
			ORDER BY c.created_at DESC
			LIMIT ? OFFSET ?
		`;

        const params = [userId, contentId, limit + 1, offset];
        const result = await env.DB.prepare(query).bind(...params).all();

        const comments = result.results as any[];
        const hasMore = comments.length > limit;

        if (hasMore) {
            comments.pop();
        }

        // Format comments
        const formattedComments = comments.map((comment) => ({
            id: comment.id,
            userName: comment.user_name,
            username: comment.username,
            userAvatar: comment.user_avatar,
            score: comment.score || 0,
            content: comment.content,
            createdAt: comment.created_at,
            updatedAt: comment.updated_at,
            isOwnComment: Boolean(comment.is_own_comment),
        }));

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Comments retrieved successfully',
                data: {
                    comments: formattedComments,
                    hasMore: hasMore,
                    page: page,
                    limit: limit,
                },
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Get comments error:', error);
        return new Response(
            JSON.stringify({ success: false, message: 'Failed to retrieve comments', error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * Handle POST /api/comments/add
 * Add a new rating and comment for content
 */
async function handleAddComment(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    try {
        const data = (await request.json()) as any;

        // Validate required fields
        if (!data.userId || !data.contentId || !data.score || !data.content) {
            return new Response(
                JSON.stringify({ success: false, message: 'Missing required fields: userId, contentId, score, content' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const userId = parseInt(data.userId);
        const contentId = parseInt(data.contentId);
        const score = parseFloat(data.score);
        const content = data.content.trim();

        // Validate score
        if (score < 0 || score > 5) {
            return new Response(
                JSON.stringify({ success: false, message: 'Score must be between 0 and 5' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Validate content length
        if (content.length < 1 || content.length > 5000) {
            return new Response(
                JSON.stringify({ success: false, message: 'Comment must be between 1 and 5000 characters' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Check if user has already rated this content
        const existingRating = await env.DB.prepare(`SELECT id FROM ratings WHERE user_id = ? AND content_id = ?`)
            .bind(userId, contentId)
            .first();

        if (existingRating) {
            // Update existing rating
            await env.DB.prepare(`UPDATE ratings SET score = ?, updated_at = datetime('now') WHERE user_id = ? AND content_id = ?`)
                .bind(score, userId, contentId)
                .run();
        } else {
            // Insert new rating
            await env.DB.prepare(`INSERT INTO ratings (user_id, content_id, score, created_at) VALUES (?, ?, ?, datetime('now'))`)
                .bind(userId, contentId, score)
                .run();
        }

        // Insert comment
        const commentResult = await env.DB.prepare(
            `INSERT INTO comments (user_id, content_id, content, created_at) VALUES (?, ?, ?, datetime('now'))`
        )
            .bind(userId, contentId, content)
            .run();

        const commentId = commentResult.meta.last_row_id;

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Rating and comment submitted successfully',
                data: {
                    commentId: commentId,
                },
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Add comment error:', error);
        return new Response(
            JSON.stringify({ success: false, message: 'Failed to submit rating and comment', error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * Handle GET /api/ratings
 * Get rating statistics for content
 */
async function handleGetRatings(url: URL, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    const contentId = url.searchParams.get('contentId');

    if (!contentId) {
        return new Response(
            JSON.stringify({ success: false, message: 'contentId parameter is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    try {
        // Get average and count
        const stats = await env.DB.prepare(
            `SELECT 
				COALESCE(AVG(score), 0) as average_score,
				COUNT(*) as total_ratings
			 FROM ratings
			 WHERE content_id = ?`
        )
            .bind(contentId)
            .first();

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Ratings retrieved successfully',
                data: {
                    averageRating: Math.round((stats?.average_score as number) * 10) / 10,
                    totalRatings: stats?.total_ratings || 0,
                },
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Get ratings error:', error);
        return new Response(
            JSON.stringify({ success: false, message: 'Failed to retrieve ratings', error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * Handle POST /api/enroll
 * Enroll a user in a course
 */
async function handleEnroll(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    try {
        const data = (await request.json()) as any;

        // Validate required fields
        if (!data.userId || !data.courseId) {
            return new Response(
                JSON.stringify({ success: false, message: 'userId and courseId are required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const userId = parseInt(data.userId);
        const courseId = parseInt(data.courseId);

        // Check if course exists
        const course = await env.DB.prepare(
            `SELECT course_id, title, instructor_id FROM courses WHERE course_id = ?`
        )
            .bind(courseId)
            .first();

        if (!course) {
            return new Response(
                JSON.stringify({ success: false, message: 'Course not found' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Check if user is the instructor
        if (course.instructor_id === userId) {
            return new Response(
                JSON.stringify({ success: false, message: 'Instructors cannot enroll in their own courses' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Check if already enrolled
        const existingEnrollment = await env.DB.prepare(
            `SELECT enrollment_id FROM enrollments WHERE student_id = ? AND course_id = ?`
        )
            .bind(userId, courseId)
            .first();

        if (existingEnrollment) {
            return new Response(
                JSON.stringify({ success: false, message: 'You are already enrolled in this course' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Create enrollment
        const result = await env.DB.prepare(
            `INSERT INTO enrollments (student_id, course_id, enrollment_date, status) 
			 VALUES (?, ?, datetime('now'), 'active')`
        )
            .bind(userId, courseId)
            .run();

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Successfully enrolled in the course!',
                data: {
                    enrollmentId: result.meta.last_row_id,
                    courseId: courseId,
                    courseName: course.title,
                },
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Enroll error:', error);
        return new Response(
            JSON.stringify({ success: false, message: 'Failed to enroll in course', error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}
