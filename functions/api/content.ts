// Get Content API - Fetch uploaded files from database
// GET /api/content?courseId=1

interface Env {
    DB: D1Database;
    R2_PUBLIC_URL: string;
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

// GET /api/content - Get all content or filter by courseId
export async function onRequestGet(context: any) {
    const { request, env } = context as { request: Request; env: Env };

    try {
        const url = new URL(request.url);
        const courseId = url.searchParams.get('courseId');
        const type = url.searchParams.get('type'); // 'video' or 'document'

        let query = `
            SELECT 
                c.id,
                c.title,
                c.type,
                c.file_url,
                c.file_key,
                c.description,
                c.file_size,
                c.mime_type,
                c.upload_date,
                c.is_approved,
                u.first_name || ' ' || u.last_name as uploader_name,
                u.user_id as uploader_id
            FROM content c
            LEFT JOIN users u ON c.uploader_id = u.user_id
            WHERE 1=1
        `;

        const params: any[] = [];

        if (courseId) {
            query += ` AND (c.course_id = ? OR c.course_id IS NULL)`;
            params.push(courseId);
        }

        if (type) {
            query += ` AND c.type = ?`;
            params.push(type);
        }

        query += ` ORDER BY c.upload_date DESC`;

        const result = await env.DB.prepare(query).bind(...params).all();

        return jsonResponse({
            success: true,
            files: result.results || [],
            count: result.results?.length || 0
        });

    } catch (error: any) {
        console.error('Get content error:', error);
        return jsonError(error.message || 'Failed to fetch content', 500);
    }
}
