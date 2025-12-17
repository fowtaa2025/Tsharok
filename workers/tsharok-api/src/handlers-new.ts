/**
 * Handle GET /api/comments
 * Get reviews/comments for a course with pagination and filtering
 */
async function handleGetComments(url: URL, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    const courseId = url.searchParams.get('courseId');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const filter = url.searchParams.get('filter') || 'all';
    const sort = url.searchParams.get('sort') || 'recent';
    const userId = url.searchParams.get('userId') || '0';

    if (!courseId) {
        return new Response(
            JSON.stringify({ success: false, message: 'courseId parameter is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    try {
        const offset = (page - 1) * limit;

        // Build WHERE clause
        let whereClause = 'c.course_id = ?';
        const params: any[] = [userId, courseId];

        if (filter !== 'all' && ['1', '2', '3', '4', '5'].includes(filter)) {
            whereClause += ' AND r.rating = ?';
            params.push(parseInt(filter));
        }

        // Build ORDER BY clause
        let orderBy = 'c.created_at DESC';
        switch (sort) {
            case 'helpful':
                orderBy = 'c.helpful_count DESC, c.created_at DESC';
                break;
            case 'highest':
                orderBy = 'r.rating DESC, c.created_at DESC';
                break;
            case 'lowest':
                orderBy = 'r.rating ASC, c.created_at DESC';
                break;
        }

        // Get reviews (fetch limit + 1 to check if there are more)
        const query = `
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
				u.first_name || ' ' || u.last_name as user_name,
				u.profile_image as user_avatar,
				r.rating,
				CASE WHEN c.user_id = ? THEN 1 ELSE 0 END as is_own_review
			FROM comments c
			INNER JOIN users u ON c.user_id = u.user_id
			LEFT JOIN ratings r ON c.user_id = r.user_id AND c.course_id = r.course_id
			WHERE ${whereClause}
			ORDER BY ${orderBy}
			LIMIT ? OFFSET ?
		`;

        params.push(limit + 1, offset);
        const result = await env.DB.prepare(query).bind(...params).all();

        const reviews = result.results as any[];
        const hasMore = reviews.length > limit;

        if (hasMore) {
            reviews.pop();
        }

        // Format reviews
        const formattedReviews = reviews.map((review) => ({
            id: review.id,
            userName: review.user_name,
            username: review.username,
            userAvatar: review.user_avatar,
            rating: review.rating,
            title: review.title,
            comment: review.comment,
            wouldRecommend: Boolean(review.would_recommend),
            helpfulCount: review.helpful_count || 0,
            createdAt: review.created_at,
            updatedAt: review.updated_at,
            isOwnReview: Boolean(review.is_own_review),
            isEdited: review.updated_at ? true : false,
        }));

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Reviews retrieved successfully',
                data: {
                    reviews: formattedReviews,
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
            JSON.stringify({ success: false, message: 'Failed to retrieve reviews', error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * Handle POST /api/comments/add
 * Add a new rating and review
 */
async function handleAddComment(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    try {
        const data = (await request.json()) as any;

        // Validate required fields
        if (!data.userId || !data.courseId || !data.rating || !data.comment) {
            return new Response(
                JSON.stringify({ success: false, message: 'Missing required fields: userId, courseId, rating, comment' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const userId = parseInt(data.userId);
        const courseId = parseInt(data.courseId);
        const rating = parseInt(data.rating);
        const comment = data.comment.trim();
        const title = data.title?.trim() || null;
        const wouldRecommend = data.wouldRecommend ? 1 : 0;

        // Validate rating
        if (rating < 1 || rating > 5) {
            return new Response(
                JSON.stringify({ success: false, message: 'Rating must be between 1 and 5' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Validate comment length
        if (comment.length < 10 || comment.length > 5000) {
            return new Response(
                JSON.stringify({ success: false, message: 'Comment must be between 10 and 5000 characters' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Check if user is enrolled
        const enrollment = await env.DB.prepare(
            `SELECT enrollment_id FROM enrollments WHERE user_id = ? AND course_id = ? AND status = 'active'`
        )
            .bind(userId, courseId)
            .first();

        if (!enrollment) {
            return new Response(
                JSON.stringify({ success: false, message: 'You must be enrolled in this course to rate it' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Check if user has already rated
        const existingRating = await env.DB.prepare(`SELECT rating_id FROM ratings WHERE user_id = ? AND course_id = ?`)
            .bind(userId, courseId)
            .first();

        if (existingRating) {
            return new Response(
                JSON.stringify({ success: false, message: 'You have already rated this course' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Insert rating
        const ratingResult = await env.DB.prepare(
            `INSERT INTO ratings (user_id, course_id, rating, created_at) VALUES (?, ?, ?, datetime('now'))`
        )
            .bind(userId, courseId, rating)
            .run();

        const ratingId = ratingResult.meta.last_row_id;

        // Insert comment
        const commentResult = await env.DB.prepare(
            `INSERT INTO comments (user_id, course_id, comment, title, would_recommend, helpful_count, created_at) 
			 VALUES (?, ?, ?, ?, ?, 0, datetime('now'))`
        )
            .bind(userId, courseId, comment, title, wouldRecommend)
            .run();

        const commentId = commentResult.meta.last_row_id;

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Review submitted successfully',
                data: {
                    ratingId: ratingId,
                    commentId: commentId,
                },
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Add comment error:', error);
        return new Response(
            JSON.stringify({ success: false, message: 'Failed to submit review', error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * Handle GET /api/ratings
 * Get rating statistics for a course
 */
async function handleGetRatings(url: URL, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    const courseId = url.searchParams.get('courseId');

    if (!courseId) {
        return new Response(
            JSON.stringify({ success: false, message: 'courseId parameter is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    try {
        // Get average and count
        const stats = await env.DB.prepare(
            `SELECT 
				COALESCE(AVG(rating), 0) as average_rating,
				COUNT(*) as total_ratings
			 FROM ratings
			 WHERE course_id = ?`
        )
            .bind(courseId)
            .first();

        // Get distribution
        const distributionResult = await env.DB.prepare(
            `SELECT rating, COUNT(*) as count
			 FROM ratings
			 WHERE course_id = ?
			 GROUP BY rating
			 ORDER BY rating DESC`
        )
            .bind(courseId)
            .all();

        // Fill missing ratings (1-5)
        const distributionMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        distributionResult.results.forEach((item: any) => {
            distributionMap[item.rating] = item.count;
        });

        const distribution = [];
        for (let i = 5; i >= 1; i--) {
            distribution.push({
                rating: i,
                count: distributionMap[i],
            });
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Ratings retrieved successfully',
                data: {
                    averageRating: Math.round((stats?.average_rating as number) * 10) / 10,
                    totalRatings: stats?.total_ratings || 0,
                    distribution: distribution,
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
            `SELECT course_id, course_name, instructor_id FROM courses WHERE course_id = ?`
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
            `SELECT enrollment_id FROM enrollments WHERE user_id = ? AND course_id = ?`
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
            `INSERT INTO enrollments (user_id, course_id, enrollment_date, status) 
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
                    courseName: course.course_name,
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
