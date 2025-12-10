// Ratings API - Get and Post ratings for content
// GET /api/ratings?contentId=1
// POST /api/ratings

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

// GET /api/ratings - Get ratings for content
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
                r.id,
                r.score,
                r.created_at,
                r.updated_at,
                u.first_name || ' ' || u.last_name as user_name,
                u.user_id
            FROM ratings r
            LEFT JOIN users u ON r.user_id = u.user_id
            WHERE r.content_id = ?
            ORDER BY r.created_at DESC
        `).bind(contentId).all();

        // Calculate average rating
        const ratings = result.results || [];
        const avgRating = ratings.length > 0
            ? ratings.reduce((sum: number, r: any) => sum + r.score, 0) / ratings.length
            : 0;

        return jsonResponse({
            success: true,
            ratings: ratings,
            count: ratings.length,
            average: Number(avgRating.toFixed(1))
        });

    } catch (error: any) {
        console.error('Get ratings error:', error);
        return jsonError(error.message || 'Failed to fetch ratings', 500);
    }
}

// POST /api/ratings - Add or update a rating
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
        const { contentId, score } = body;

        if (!contentId || score === undefined) {
            return jsonError('contentId and score are required', 400);
        }

        if (score < 0 || score > 5) {
            return jsonError('Score must be between 0 and 5', 400);
        }

        // Check if user already rated this content
        const existing = await env.DB.prepare(`
            SELECT id FROM ratings WHERE content_id = ? AND user_id = ?
        `).bind(contentId, user.userId).first();

        let result;
        if (existing) {
            // Update existing rating
            result = await env.DB.prepare(`
                UPDATE ratings 
                SET score = ?, updated_at = datetime('now')
                WHERE content_id = ? AND user_id = ?
            `).bind(score, contentId, user.userId).run();
        } else {
            // Insert new rating
            result = await env.DB.prepare(`
                INSERT INTO ratings (content_id, user_id, score, created_at, updated_at)
                VALUES (?, ?, ?, datetime('now'), datetime('now'))
            `).bind(contentId, user.userId, score).run();
        }

        // Get updated average
        const avgResult = await env.DB.prepare(`
            SELECT AVG(score) as avg FROM ratings WHERE content_id = ?
        `).bind(contentId).first();

        return jsonResponse({
            success: true,
            message: existing ? 'Rating updated successfully' : 'Rating added successfully',
            average: Number((avgResult?.avg || 0).toFixed(1))
        });

    } catch (error: any) {
        console.error('Post rating error:', error);
        return jsonError(error.message || 'Failed to add rating', 500);
    }
}
