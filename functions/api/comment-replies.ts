// Comment Replies API - Add replies to comments
// POST /api/comment-replies

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

// POST /api/comment-replies - Add a reply to a comment
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
        const { commentId, text } = body;

        if (!commentId || !text) {
            return jsonError('commentId and text are required', 400);
        }

        if (!text.trim()) {
            return jsonError('Reply text cannot be empty', 400);
        }

        // Insert reply
        const result = await env.DB.prepare(`
            INSERT INTO comment_replies (comment_id, user_id, content, created_at, updated_at)
            VALUES (?, ?, ?, datetime('now'), datetime('now'))
        `).bind(commentId, user.userId, text.trim()).run();

        // Get the newly created reply with user info
        const newReply = await env.DB.prepare(`
            SELECT 
                r.id,
                r.content as text,
                r.created_at,
                u.first_name || ' ' || u.last_name as author,
                u.user_id
            FROM comment_replies r
            LEFT JOIN users u ON r.user_id = u.user_id
            WHERE r.id = ?
        `).bind(result.meta.last_row_id).first();

        return jsonResponse({
            success: true,
            message: 'Reply added successfully',
            reply: newReply
        });

    } catch (error: any) {
        console.error('Post reply error:', error);
        return jsonError(error.message || 'Failed to add reply', 500);
    }
}
