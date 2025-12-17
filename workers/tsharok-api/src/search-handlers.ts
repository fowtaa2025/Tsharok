/**
 * Handle GET /api/search
 * Search courses with filters, sorting, and pagination
 */
async function handleSearch(url: URL, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    const searchQuery = url.searchParams.get('q')?.trim() || '';
    const category = url.searchParams.get('category')?.trim() || '';
    const level = url.searchParams.get('level')?.trim() || '';
    const minRating = parseFloat(url.searchParams.get('minRating') || '0');
    const sortBy = url.searchParams.get('sortBy') || 'relevance';
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '12')));
    const offset = (page - 1) * limit;

    try {
        // Build WHERE conditions
        const whereConditions = ['c.is_published = 1'];
        const params: any[] = [];

        // Search relevance calculation
        let relevanceScore = '0 as relevance';
        if (searchQuery) {
            relevanceScore = `
				CASE
					WHEN c.title = ? THEN 3
					WHEN c.title LIKE ? THEN 2
					WHEN c.description LIKE ? THEN 1
					ELSE 0
				END as relevance
			`;
            params.push(searchQuery, searchQuery + '%', '%' + searchQuery + '%');

            // Add search filter
            whereConditions.push('(c.title LIKE ? OR c.description LIKE ?)');
            params.push('%' + searchQuery + '%', '%' + searchQuery + '%');
        }

        // Category filter
        if (category && category !== 'all') {
            whereConditions.push('c.category = ?');
            params.push(category);
        }

        // Level filter
        if (level && level !== 'all') {
            whereConditions.push('c.level = ?');
            params.push(level);
        }

        const whereClause = whereConditions.join(' AND ');

        // Count total results
        const countQuery = `
			SELECT COUNT(DISTINCT c.course_id) as total
			FROM courses c
			WHERE ${whereClause}
		`;
        const countResult = await env.DB.prepare(countQuery).bind(...params).first();
        const totalResults = countResult?.total || 0;

        // Build main query
        const query = `
			SELECT 
				c.course_id,
				c.title,
				c.description,
				c.category,
				c.level,
				c.duration_weeks,
				c.thumbnail,
				c.start_date,
				c.end_date,
				c.semester,
				c.created_at,
				${relevanceScore},
				COUNT(DISTINCT e.enrollment_id) as enrollment_count,
				COALESCE(AVG(r.score), 0) as average_rating,
				COUNT(DISTINCT r.id) as rating_count
			FROM courses c
			LEFT JOIN enrollments e ON c.course_id = e.course_id AND e.status = 'active'
			LEFT JOIN ratings r ON c.course_id = r.content_id
			WHERE ${whereClause}
			GROUP BY c.course_id
			HAVING (? = 0 OR average_rating >= ?)
			ORDER BY ${getSortOrder(sortBy, !!searchQuery)}
			LIMIT ? OFFSET ?
		`;

        const queryParams = [...params, minRating, minRating, limit + 1, offset];
        const result = await env.DB.prepare(query).bind(...queryParams).all();

        const courses = result.results as any[];
        const hasMore = courses.length > limit;
        if (hasMore) courses.pop();

        // Format courses
        const formattedCourses = courses.map((course) => ({
            courseId: course.course_id,
            title: course.title,
            description: truncateText(course.description || '', 150),
            category: course.category || 'General',
            level: capitalize(course.level),
            duration: course.duration_weeks ? `${course.duration_weeks} weeks` : 'N/A',
            thumbnail: course.thumbnail || '/assets/images/default-course.jpg',
            enrollmentCount: course.enrollment_count || 0,
            averageRating: Math.round(course.average_rating * 10) / 10,
            ratingCount: course.rating_count || 0,
            startDate: course.start_date,
            endDate: course.end_date,
            semester: course.semester,
            relevance: course.relevance || 0,
            createdAt: course.created_at,
        }));

        const totalPages = Math.ceil(totalResults / limit);

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Search completed successfully',
                data: {
                    courses: formattedCourses,
                    pagination: {
                        currentPage: page,
                        totalPages: totalPages,
                        totalResults: totalResults,
                        hasMore: hasMore,
                        limit: limit,
                    },
                    filters: {
                        searchQuery: searchQuery,
                        category: category,
                        level: level,
                        minRating: minRating,
                        sortBy: sortBy,
                    },
                },
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Search error:', error);
        return new Response(
            JSON.stringify({ success: false, message: 'Failed to perform search', error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * Handle GET /api/search/suggestions
 * Autocomplete suggestions for search
 */
async function handleSearchSuggestions(url: URL, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    const query = url.searchParams.get('q')?.trim() || '';
    const limit = Math.min(20, Math.max(1, parseInt(url.searchParams.get('limit') || '10')));

    if (query.length < 2) {
        return new Response(
            JSON.stringify({ success: true, message: 'Query too short', data: { suggestions: [], query: query } }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    try {
        const sql = `
			SELECT DISTINCT title
			FROM courses
			WHERE is_published = 1 
			AND (title LIKE ? OR description LIKE ?)
			ORDER BY 
				CASE 
					WHEN title LIKE ? THEN 1
					ELSE 2
				END,
				title ASC
			LIMIT ?
		`;

        const likeQueryAnywhere = '%' + query + '%';
        const likeQueryStart = query + '%';

        const result = await env.DB.prepare(sql)
            .bind(likeQueryAnywhere, likeQueryAnywhere, likeQueryStart, limit)
            .all();

        const suggestions = (result.results as any[]).map((row) => row.title);

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Suggestions retrieved successfully',
                data: {
                    suggestions: suggestions,
                    query: query,
                },
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Search suggestions error:', error);
        return new Response(
            JSON.stringify({ success: false, message: 'Failed to get suggestions', error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * Handle GET /api/search/filters
 * Get available filter options
 */
async function handleSearchFilters(env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    try {
        // Get categories
        const categoriesResult = await env.DB.prepare(`
			SELECT DISTINCT category 
			FROM courses 
			WHERE category IS NOT NULL AND is_published = 1
			ORDER BY category
		`).all();

        // Get levels
        const levelsResult = await env.DB.prepare(`
			SELECT DISTINCT level 
			FROM courses 
			WHERE is_published = 1
			ORDER BY level
		`).all();

        // Get semesters
        const semestersResult = await env.DB.prepare(`
			SELECT DISTINCT semester 
			FROM courses 
			WHERE semester IS NOT NULL AND is_published = 1
			ORDER BY semester DESC
		`).all();

        const categories = (categoriesResult.results as any[]).map((row) => row.category);
        const levels = (levelsResult.results as any[]).map((row) => capitalize(row.level));
        const semesters = (semestersResult.results as any[]).map((row) => row.semester);

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Filter options retrieved successfully',
                data: {
                    categories: categories,
                    levels: levels,
                    semesters: semesters,
                },
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Search filters error:', error);
        return new Response(
            JSON.stringify({ success: false, message: 'Failed to get filter options', error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}

// Helper functions
function getSortOrder(sortBy: string, hasSearchQuery: boolean): string {
    switch (sortBy) {
        case 'relevance':
            return hasSearchQuery ? 'relevance DESC, c.created_at DESC' : 'c.created_at DESC';
        case 'date_newest':
        case 'newest':
            return 'c.created_at DESC';
        case 'date_oldest':
        case 'oldest':
            return 'c.created_at ASC';
        case 'title_asc':
            return 'c.title ASC';
        case 'title_desc':
            return 'c.title DESC';
        case 'rating_high':
            return 'average_rating DESC, c.created_at DESC';
        case 'rating_low':
            return 'average_rating ASC, c.created_at DESC';
        case 'popular':
            return 'enrollment_count DESC, c.created_at DESC';
        case 'duration_short':
            return 'c.duration_weeks ASC';
        case 'duration_long':
            return 'c.duration_weeks DESC';
        default:
            return 'c.created_at DESC';
    }
}

function truncateText(text: string, length: number): string {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
}

function capitalize(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
