// Comment Likes API - Toggle likes on comments
// POST /api/comment-likes

import { verifyToken } from './auth';

interface Env {
    DB: D1Database;
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

// POST /api/comment-likes - Toggle like on a comment
export async function onRequestPost(context: any) {
    const { request, env } = context as { request: Request; env: Env };

    try {
        // Verify authentication
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return jsonError('Unauthorized - No token provided', 401);
        }

        const user = await verifyToken(token, env.JWT_SECRET);
        if (!user) {
            return jsonError('Unauthorized - Invalid token', 401);
        }

        const body = await request.json();
        const { commentId } = body;

        if (!commentId) {
            return jsonError('commentId is required', 400);
        }

        // Check if user already liked this comment
        const existing = await env.DB.prepare(`
            SELECT id FROM comment_likes WHERE comment_id = ? AND user_id = ?
        `).bind(commentId, user.userId).first();

        if (existing) {
            // Unlike - remove the like
            await env.DB.prepare(`
                DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?
            `).bind(commentId, user.userId).run();

            // Get new count
            const countResult = await env.DB.prepare(`
                SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = ?
            `).bind(commentId).first();

            return jsonResponse({
                success: true,
                liked: false,
                likes: countResult?.count || 0
            });
        } else {
            // Like - add the like
            await env.DB.prepare(`
                INSERT INTO comment_likes (comment_id, user_id, created_at)
                VALUES (?, ?, datetime('now'))
            `).bind(commentId, user.userId).run();

            // Get new count
            const countResult = await env.DB.prepare(`
                SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = ?
            `).bind(commentId).first();

            return jsonResponse({
                success: true,
                liked: true,
                likes: countResult?.count || 0
            });
        }

    } catch (error: any) {
        console.error('Toggle like error:', error);
        return jsonError(error.message || 'Failed to toggle like', 500);
    }
}
