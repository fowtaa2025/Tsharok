// Comments API - Get and Post comments for content
// GET /api/comments?contentId=1
// POST /api/comments

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

// GET /api/comments - Get comments for content
export async function onRequestGet(context: any) {
    const { request, env } = context as { request: Request; env: Env };

    try {
        const url = new URL(request.url);
        const contentId = url.searchParams.get('contentId');

        if (!contentId) {
            return jsonError('contentId is required', 400);
        }

        const result = await env.DB.prepare(`
            SELECT 
                c.id,
                c.content as text,
                c.created_at,
                c.updated_at,
                u.first_name || ' ' || u.last_name as user_name,
                u.user_id
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.user_id
            WHERE c.content_id = ?
            ORDER BY c.created_at DESC
        `).bind(contentId).all();

        return jsonResponse({
            success: true,
            comments: result.results || [],
            count: result.results?.length || 0
        });

    } catch (error: any) {
        console.error('Get comments error:', error);
        return jsonError(error.message || 'Failed to fetch comments', 500);
    }
}

// POST /api/comments - Add a comment
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
        const { contentId, text } = body;

        if (!contentId || !text) {
            return jsonError('contentId and text are required', 400);
        }

        if (!text.trim()) {
            return jsonError('Comment text cannot be empty', 400);
        }

        const result = await env.DB.prepare(`
            INSERT INTO comments (content_id, user_id, content, created_at, updated_at)
            VALUES (?, ?, ?, datetime('now'), datetime('now'))
        `).bind(contentId, user.userId, text.trim()).run();

        // Get the newly created comment with user info
        const newComment = await env.DB.prepare(`
            SELECT 
                c.id,
                c.content as text,
                c.created_at,
                c.updated_at,
                u.first_name || ' ' || u.last_name as user_name,
                u.user_id
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.user_id
            WHERE c.id = ?
        `).bind(result.meta.last_row_id).first();

        return jsonResponse({
            success: true,
            message: 'Comment added successfully',
            comment: newComment
        });

    } catch (error: any) {
        console.error('Post comment error:', error);
        return jsonError(error.message || 'Failed to add comment', 500);
    }
}
