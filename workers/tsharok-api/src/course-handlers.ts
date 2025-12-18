/**
 * Course Management Handlers for Tsharok API
 * Handles course catalog, details, enrollment management, etc.
 */

// Define Env interface to match the main worker
interface Env {
    DB: D1Database;
    BUCKET: R2Bucket;
}

/**
 * Handle GET /api/courses
 * Get course catalog with filters, sorting, and pagination
 */
export async function handleGetCourses(url: URL, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    try {
        // Get filter parameters
        const search = url.searchParams.get('search') || '';
        const major = parseInt(url.searchParams.get('major') || '0');
        const level = url.searchParams.get('level') || '';
        const instructor = parseInt(url.searchParams.get('instructor') || '0');
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const sortBy = url.searchParams.get('sort') || 'created_at';
        const sortOrder = (url.searchParams.get('order') || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        // Build query dynamically
        let whereClauses: string[] = ['1=1'];
        let params: any[] = [];

        // Search filter
        if (search) {
            whereClauses.push('(c.title LIKE ? OR c.course_code LIKE ? OR c.description LIKE ?)');
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam, searchParam);
        }

        // Major filter
        if (major > 0) {
            whereClauses.push('c.category = ?');
            params.push(major.toString());
        }

        // Level filter
        if (level) {
            whereClauses.push('c.level = ?');
            params.push(level);
        }

        // Instructor filter
        if (instructor > 0) {
            whereClauses.push('c.instructor_id = ?');
            params.push(instructor);
        }

        // Validate sort field
        const allowedSortFields = ['title', 'created_at', 'level'];
        const sortField = allowedSortFields.includes(sortBy) ? `c.${sortBy}` : 'c.created_at';

        // Main query
        const query = `
			SELECT 
				c.course_id,
				c.course_code,
				c.title,
				c.description,
				c.instructor_id,
				c.category,
				c.level,
				c.thumbnail,
				c.created_at,
				c.updated_at,
				u.first_name AS instructor_first_name,
				u.last_name AS instructor_last_name,
				u.profile_image AS instructor_image,
				COUNT(DISTINCT e.enrollment_id) AS enrollment_count
			FROM courses c
			LEFT JOIN users u ON c.instructor_id = u.user_id
			LEFT JOIN enrollments e ON c.course_id = e.course_id
			WHERE ${whereClauses.join(' AND ')}
			GROUP BY c.course_id
			ORDER BY ${sortField} ${sortOrder}
			LIMIT ? OFFSET ?
		`;

        params.push(limit, offset);

        const result = await env.DB.prepare(query).bind(...params).all();
        const courses = result.results || [];

        // Get total count
        const countQuery = `
			SELECT COUNT(DISTINCT c.course_id) as total
			FROM courses c
			WHERE ${whereClauses.join(' AND ')}
		`;
        const countParams = params.slice(0, -2); // Remove limit and offset
        const countResult = await env.DB.prepare(countQuery).bind(...countParams).first();
        const totalCount = Number(countResult?.total) || 0;

        // Format courses
        const formattedCourses = courses.map((course: any) => ({
            courseId: course.course_id,
            courseCode: course.course_code,
            courseName: course.title,
            description: course.description,
            instructorId: course.instructor_id,
            instructorName: `${course.instructor_first_name || ''} ${course.instructor_last_name || ''}`.trim(),
            instructorImage: course.instructor_image,
            category: course.category,
            level: course.level,
            imageUrl: course.thumbnail || '/assets/images/course-placeholder.jpg',
            enrollmentCount: course.enrollment_count || 0,
            createdAt: course.created_at,
            updatedAt: course.updated_at,
        }));

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Courses retrieved successfully.',
                data: {
                    courses: formattedCourses,
                    pagination: {
                        total: totalCount,
                        limit: limit,
                        offset: offset,
                        hasMore: offset + limit < totalCount,
                    },
                },
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Get courses error:', error);
        return new Response(
            JSON.stringify({ success: false, message: 'Failed to retrieve courses', error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * Handle GET /api/course-details?courseId=X
 * Get detailed information about a specific course
 */
export async function handleGetCourseDetails(url: URL, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    const courseId = url.searchParams.get('courseId');

    if (!courseId) {
        return new Response(
            JSON.stringify({ success: false, message: 'courseId parameter is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    try {
        // Get course details
        const course = await env.DB.prepare(`
			SELECT 
				c.course_id,
				c.course_code,
				c.title,
				c.description,
				c.instructor_id,
				c.category,
				c.level,
				c.thumbnail,
				c.created_at,
				c.updated_at,
				c.syllabus,
				c.prerequisites,
				c.learning_outcomes,
				u.first_name AS instructor_first_name,
				u.last_name AS instructor_last_name,
				u.profile_image AS instructor_image,
				u.email AS instructor_email,
				COUNT(DISTINCT e.enrollment_id) AS enrollment_count
			FROM courses c
			LEFT JOIN users u ON c.instructor_id = u.user_id
			LEFT JOIN enrollments e ON c.course_id = e.course_id AND e.status = 'active'
			WHERE c.course_id = ?
			GROUP BY c.course_id
		`).bind(courseId).first();

        if (!course) {
            return new Response(
                JSON.stringify({ success: false, message: 'Course not found' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Get materials count
        const materialsResult = await env.DB.prepare(`
			SELECT COUNT(*) as count
			FROM content
			WHERE course_id = ? AND is_approved = 1
		`).bind(courseId).first();

        // Get average rating
        const ratingResult = await env.DB.prepare(`
			SELECT 
				AVG(r.score) as avg_rating,
				COUNT(r.id) as rating_count
			FROM ratings r
			INNER JOIN content c ON r.content_id = c.id
			WHERE c.course_id = ?
		`).bind(courseId).first();

        // Format response
        const formattedCourse = {
            courseId: course.course_id,
            courseCode: course.course_code,
            courseName: course.title,
            description: course.description,
            instructorId: course.instructor_id,
            instructorName: `${course.instructor_first_name || ''} ${course.instructor_last_name || ''}`.trim(),
            instructorImage: course.instructor_image,
            instructorEmail: course.instructor_email,
            category: course.category,
            level: course.level,
            imageUrl: course.thumbnail || '/assets/images/course-placeholder.jpg',
            syllabuslink: course.syllabus,
            prerequisites: course.prerequisites,
            learningOutcomes: course.learning_outcomes,
            enrollmentCount: course.enrollment_count || 0,
            avgRating: ratingResult?.avg_rating ? parseFloat(String(ratingResult.avg_rating)).toFixed(1) : '0.0',
            ratingCount: Number(ratingResult?.rating_count) || 0,
            materialsCount: Number(materialsResult?.count) || 0,
            createdAt: course.created_at,
            updatedAt: course.updated_at,
        };

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Course details retrieved successfully.',
                data: { course: formattedCourse },
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Get course details error:', error);
        return new Response(
            JSON.stringify({ success: false, message: 'Failed to retrieve course details', error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * Handle GET /api/my-courses
 * Get user's enrolled courses
 */
export async function handleGetMyCourses(request: Request, url: URL, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    // Get userId from authorization header or query param
    const authHeader = request.headers.get('Authorization');
    let userId: number | null = null;

    if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        userId = getUserIdFromToken(token);
    }

    if (!userId) {
        userId = parseInt(url.searchParams.get('userId') || '0');
    }

    if (!userId) {
        return new Response(
            JSON.stringify({ success: false, message: 'Authentication required' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    try {
        const status = url.searchParams.get('status') || 'active';

        // Get enrolled courses
        const result = await env.DB.prepare(`
			SELECT 
				e.enrollment_id,
				e.course_id,
				e.enrollment_date,
				e.status,
				e.progress_percentage,
				c.course_code,
				c.title,
				c.description,
				c.instructor_id,
				c.category,
				c.level,
				c.thumbnail,
				u.first_name AS instructor_first_name,
				u.last_name AS instructor_last_name,
				u.profile_image AS instructor_image,
				(SELECT COUNT(*) FROM content WHERE course_id = c.course_id AND is_approved = 1) as total_materials,
				(SELECT COUNT(*) FROM enrollments WHERE course_id = c.course_id) as total_students
			FROM enrollments e
			INNER JOIN courses c ON e.course_id = c.course_id
			LEFT JOIN users u ON c.instructor_id = u.user_id
			WHERE e.student_id = ? AND e.status = ?
			ORDER BY e.enrollment_date DESC
		`).bind(userId, status).all();

        const enrollments = result.results || [];

        // Format enrollments
        const formattedEnrollments = enrollments.map((enrollment: any) => ({
            enrollmentId: enrollment.enrollment_id,
            courseId: enrollment.course_id,
            courseCode: enrollment.course_code,
            courseName: enrollment.title,
            description: enrollment.description,
            instructorId: enrollment.instructor_id,
            instructorName: `${enrollment.instructor_first_name || ''} ${enrollment.instructor_last_name || ''}`.trim(),
            instructorImage: enrollment.instructor_image,
            category: enrollment.category,
            level: enrollment.level,
            imageUrl: enrollment.thumbnail || '/assets/images/course-placeholder.jpg',
            enrollmentDate: enrollment.enrollment_date,
            status: enrollment.status,
            progress: enrollment.progress_percentage || 0,
            totalMaterials: enrollment.total_materials || 0,
            totalStudents: enrollment.total_students || 0,
        }));

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Enrolled courses retrieved successfully.',
                data: {
                    courses: formattedEnrollments,
                    totalCount: formattedEnrollments.length,
                },
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Get my courses error:', error);
        return new Response(
            JSON.stringify({ success: false, message: 'Failed to retrieve enrolled courses', error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * Handle POST /api/unenroll
 * Unenroll user from a course
 */
export async function handleUnenroll(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    try {
        const data = (await request.json()) as any;

        if (!data.userId || !data.courseId) {
            return new Response(
                JSON.stringify({ success: false, message: 'userId and courseId are required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const userId = parseInt(data.userId);
        const courseId = parseInt(data.courseId);

        // Update enrollment status to 'dropped'
        const result = await env.DB.prepare(`
			UPDATE enrollments
			SET status = 'dropped'
			WHERE student_id = ? AND course_id = ? AND status = 'active'
		`).bind(userId, courseId).run();

        if (result.meta.changes === 0) {
            return new Response(
                JSON.stringify({ success: false, message: 'Enrollment not found or already dropped' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Successfully unenrolled from course',
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Unenroll error:', error);
        return new Response(
            JSON.stringify({ success: false, message: 'Failed to unenroll from course', error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * Handle GET /api/majors
 * Get all available majors/categories
 */
export async function handleGetMajors(env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    try {
        const result = await env.DB.prepare(`
			SELECT 
				id,
				name,
				description
			FROM majors
			ORDER BY name ASC
		`).all();

        const majors = result.results || [];

        // Format majors
        const formattedMajors = majors.map((major: any) => ({
            majorId: major.id,
            majorName: major.name,
            description: major.description,
            courseCount: 0, // Can be enhanced later with actual count
        }));

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Majors retrieved successfully.',
                data: {
                    majors: formattedMajors,
                    totalCount: formattedMajors.length,
                },
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Get majors error:', error);
        return new Response(
            JSON.stringify({ success: false, message: 'Failed to retrieve majors', error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * Handle GET /api/filter-options
 * Get available filter options for courses
 */
export async function handleGetFilterOptions(env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    try {
        // Get distinct levels
        const levelsResult = await env.DB.prepare(`
			SELECT DISTINCT level
			FROM courses
			WHERE level IS NOT NULL
			ORDER BY level
		`).all();

        // Get majors
        const majorsResult = await env.DB.prepare(`
			SELECT id, name
			FROM majors
			ORDER BY name ASC
		`).all();

        const levels = (levelsResult.results || []).map((l: any) => l.level);
        const majors = (majorsResult.results || []).map((m: any) => ({
            id: m.id,
            name: m.name,
        }));

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Filter options retrieved successfully.',
                data: {
                    levels: levels,
                    majors: majors,
                },
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Get filter options error:', error);
        return new Response(
            JSON.stringify({ success: false, message: 'Failed to retrieve filter options', error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}

// Helper function (use the existing one from index.ts)
function getUserIdFromToken(token: string): number | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            const userId = parseInt(token);
            return isNaN(userId) ? null : userId;
        }

        const payload = parts[1];
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        const data = JSON.parse(decoded);

        return parseInt(data.userId || data.user_id || data.sub || data.id || '0');
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
}
