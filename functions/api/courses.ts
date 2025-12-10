// Courses API - Get courses with filtering and pagination
// Uses D1 database

interface Env {
    DB: D1Database;
}

function jsonResponse(data: any, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
        }
    });
}

function jsonError(message: string, status = 400) {
    return jsonResponse({ success: false, error: message }, status);
}

// GET /api/courses - Get all courses with filtering
export async function onRequestGet(context: any) {
    const { request, env } = context as { request: Request; env: Env };

    try {
        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const search = url.searchParams.get('search') || '';
        const level = url.searchParams.get('level') || '';
        const category = url.searchParams.get('category') || '';

        // Build query
        let query = `
      SELECT 
        c.*,
        u.first_name || ' ' || u.last_name as instructor_name,
        u.profile_image as instructor_image,
        COUNT(DISTINCT e.enrollment_id) as enrollment_count
      FROM courses c
      LEFT JOIN users u ON c.instructor_id = u.user_id
      LEFT JOIN enrollments e ON c.course_id = e.enrollment_id
      WHERE c.is_published = 1
    `;

        const params: any[] = [];

        // Add search filter
        if (search) {
            query += ` AND (c.title LIKE ? OR c.course_code LIKE ? OR c.description LIKE ?)`;
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam, searchParam);
        }

        // Add level filter
        if (level) {
            query += ` AND c.level = ?`;
            params.push(level);
        }

        // Add category filter
        if (category) {
            query += ` AND c.category = ?`;
            params.push(category);
        }

        query += ` GROUP BY c.course_id ORDER BY c.created_at DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        // Execute query
        const { results } = await env.DB.prepare(query).bind(...params).all();

        // Get total count
        let countQuery = `SELECT COUNT(*) as total FROM courses WHERE is_published = 1`;
        const countParams: any[] = [];

        if (search) {
            countQuery += ` AND (title LIKE ? OR course_code LIKE ? OR description LIKE ?)`;
            const searchParam = `%${search}%`;
            countParams.push(searchParam, searchParam, searchParam);
        }

        if (level) {
            countQuery += ` AND level = ?`;
            countParams.push(level);
        }

        if (category) {
            countQuery += ` AND category = ?`;
            countParams.push(category);
        }

        const countResult = await env.DB.prepare(countQuery).bind(...countParams).first() as any;
        const total = countResult?.total || 0;

        // Format response
        const courses = results.map((course: any) => ({
            courseId: course.course_id,
            courseCode: course.course_code,
            title: course.title,
            description: course.description,
            instructorId: course.instructor_id,
            instructorName: course.instructor_name,
            instructorImage: course.instructor_image,
            category: course.category,
            level: course.level,
            thumbnail: course.thumbnail || '/assets/images/course-placeholder.jpg',
            enrollmentCount: course.enrollment_count || 0,
            createdAt: course.created_at,
            updatedAt: course.updated_at
        }));

        return jsonResponse({
            success: true,
            courses,
            pagination: {
                total,
                limit,
                offset,
                hasMore: (offset + limit) < total
            }
        });

    } catch (error: any) {
        console.error('Courses error:', error);
        return jsonError('Failed to fetch courses', 500);
    }
}

// GET /api/courses/[id] - Get single course details
export async function onRequest(context: any) {
    const { request, env, params } = context as { request: Request; env: Env; params: any };

    // Handle specific course ID
    if (params && params.id) {
        try {
            const courseId = params.id;

            const course = await env.DB.prepare(`
        SELECT 
          c.*,
          u.first_name || ' ' || u.last_name as instructor_name,
          u.email as instructor_email,
          u.profile_image as instructor_image,
          COUNT(DISTINCT e.enrollment_id) as enrollment_count
        FROM courses c
        LEFT JOIN users u ON c.instructor_id = u.user_id
        LEFT JOIN enrollments e ON c.course_id = e.enrollment_id
        WHERE c.course_id = ?
        GROUP BY c.course_id
      `).bind(courseId).first();

            if (!course) {
                return jsonError('Course not found', 404);
            }

            return jsonResponse({
                success: true,
                course: {
                    courseId: course.course_id,
                    courseCode: course.course_code,
                    title: course.title,
                    description: course.description,
                    instructorId: course.instructor_id,
                    instructorName: course.instructor_name,
                    instructorEmail: course.instructor_email,
                    instructorImage: course.instructor_image,
                    category: course.category,
                    level: course.level,
                    thumbnail: course.thumbnail,
                    syllabus: course.syllabus,
                    prerequisites: course.prerequisites,
                    learningOutcomes: course.learning_outcomes,
                    enrollmentCount: course.enrollment_count || 0,
                    createdAt: course.created_at
                }
            });

        } catch (error: any) {
            return jsonError('Failed to fetch course', 500);
        }
    }

    // Default to GET handler
    return onRequestGet(context);
}
