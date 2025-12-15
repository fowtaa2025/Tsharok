// Get Content API - Fetch uploaded files from database
// GET /api/content?courseId=1
// POST /api/content - Track views

import { verifyToken } from './auth';

interface Env {
    DB: D1Database;
    R2_PUBLIC_URL: string;
    JWT_SECRET: string;
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
        const id = url.searchParams.get('id'); // Get single file by ID

        // If ID is provided, return single file
        if (id) {
            const file = await env.DB.prepare(`
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
                WHERE c.id = ?
            `).bind(id).first();

            if (!file) {
                return jsonError('File not found', 404);
            }

            return jsonResponse({
                success: true,
                file: file
            });
        }

        // Otherwise, return list of files
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

        // For each file, calculate average rating from ratings table
        const filesWithRatings = await Promise.all(
            (result.results || []).map(async (file: any) => {
                // Get average rating for this file
                const ratingResult = await env.DB.prepare(`
                    SELECT AVG(score) as avg_rating, COUNT(*) as rating_count
                    FROM ratings
                    WHERE content_id = ?
                `).bind(file.id).first();

                const avgRating = ratingResult?.avg_rating ? Number(ratingResult.avg_rating).toFixed(1) : '0.0';
                const ratingCount = ratingResult?.rating_count || 0;

                return {
                    ...file,
                    average_rating: avgRating,
                    rating_count: ratingCount
                };
            })
        );

        return jsonResponse({
            success: true,
            files: filesWithRatings,
            count: filesWithRatings.length
        });

    } catch (error: any) {
        console.error('Get content error:', error);
        return jsonError(error.message || 'Failed to fetch content', 500);
    }
}
