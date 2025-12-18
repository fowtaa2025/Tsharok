/**
 * Admin Feature Handlers for Tsharok API
 * Handles admin authentication and content moderation
 */

// Define Env interface to match the main worker
interface Env {
    DB: D1Database;
    BUCKET: R2Bucket;
    JWT_SECRET?: string;
}

/**
 * Handle POST /api/admin-login
 * Admin authentication
 */
export async function handleAdminLogin(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    try {
        const data = (await request.json()) as any;

        if (!data.email || !data.password) {
            return new Response(
                JSON.stringify({ success: false, message: 'Email and password are required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const email = data.email.toLowerCase().trim();
        const password = data.password;

        // Hash password (SHA-256)
        const encoder = new TextEncoder();
        const passwordData = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', passwordData);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // Check admin credentials
        const user = await env.DB.prepare(`
			SELECT user_id, username, email, first_name, last_name, role, is_active
			FROM users
			WHERE email = ? AND password_hash = ? AND (role = 'admin' OR role = 'moderator') AND is_active = 1
			LIMIT 1
		`).bind(email, hashedPassword).first();

        if (!user) {
            return new Response(
                JSON.stringify({ success: false, message: 'Invalid credentials or insufficient permissions' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Generate simple token (in production, use proper JWT)
        const token = `admin_${user.user_id}_${Date.now()}_${crypto.randomUUID()}`;

        // Log admin login
        await env.DB.prepare(`
			INSERT INTO activity_logs (user_id, action, description, created_at)
			VALUES (?, 'admin_login', 'Admin logged in', datetime('now'))
		`).bind(user.user_id).run();

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Login successful',
                data: {
                    token: token,
                    user: {
                        userId: user.user_id,
                        username: user.username,
                        email: user.email,
                        firstName: user.first_name,
                        lastName: user.last_name,
                        role: user.role
                    }
                }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Admin login error:', error);
        return new Response(
            JSON.stringify({ success: false, message: 'Login failed', error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * Handle GET /api/get-pending-content
 * Get content pending moderation approval
 */
export async function handleGetPendingContent(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    try {
        // Verify admin/moderator role (simple check)
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.includes('admin_')) {
            return new Response(
                JSON.stringify({ success: false, message: 'Admin authentication required' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Get pending content
        const result = await env.DB.prepare(`
			SELECT 
				c.id,
				c.title,
				c.description,
				c.type,
				c.file_url,
				c.file_size,
				c.mime_type,
				c.upload_date,
				c.uploader_id,
				c.course_id,
				u.first_name,
				u.last_name,
				u.email,
				co.title as course_title
			FROM content c
			LEFT JOIN users u ON c.uploader_id = u.user_id
			LEFT JOIN courses co ON c.course_id = co.course_id
			WHERE c.is_approved = 0
			ORDER BY c.upload_date DESC
			LIMIT 100
		`).all();

        const pendingContent = result.results || [];

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Pending content retrieved successfully',
                data: {
                    content: pendingContent.map((item: any) => ({
                        id: item.id,
                        title: item.title,
                        description: item.description,
                        type: item.type,
                        fileUrl: item.file_url,
                        fileSize: item.file_size,
                        mimeType: item.mime_type,
                        uploadDate: item.upload_date,
                        uploaderId: item.uploader_id,
                        uploaderName: `${item.first_name || ''} ${item.last_name || ''}`.trim(),
                        uploaderEmail: item.email,
                        courseId: item.course_id,
                        courseTitle: item.course_title
                    })),
                    totalCount: pendingContent.length
                }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Get pending content error:', error);
        return new Response(
            JSON.stringify({ success: false, message: 'Failed to retrieve pending content', error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * Handle POST /api/approve-content
 * Approve pending content
 */
export async function handleApproveContent(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    try {
        // Verify admin/moderator role
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.includes('admin_')) {
            return new Response(
                JSON.stringify({ success: false, message: 'Admin authentication required' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const data = (await request.json()) as any;

        if (!data.contentId) {
            return new Response(
                JSON.stringify({ success: false, message: 'contentId is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const contentId = parseInt(data.contentId);
        const moderatorId = data.moderatorId ? parseInt(data.moderatorId) : null;

        // Approve content
        const result = await env.DB.prepare(`
			UPDATE content
			SET is_approved = 1, approved_at = datetime('now'), approved_by = ?
			WHERE id = ? AND is_approved = 0
		`).bind(moderatorId, contentId).run();

        if (result.meta.changes === 0) {
            return new Response(
                JSON.stringify({ success: false, message: 'Content not found or already approved' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Log moderation action
        if (moderatorId) {
            await env.DB.prepare(`
				INSERT INTO activity_logs (user_id, action, description, created_at)
				VALUES (?, 'content_approved', ?, datetime('now'))
			`).bind(moderatorId, `Approved content ID: ${contentId}`).run();
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Content approved successfully'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Approve content error:', error);
        return new Response(
            JSON.stringify({ success: false, message: 'Failed to approve content', error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * Handle POST /api/reject-content
 * Reject pending content
 */
export async function handleRejectContent(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    try {
        // Verify admin/moderator role
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.includes('admin_')) {
            return new Response(
                JSON.stringify({ success: false, message: 'Admin authentication required' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const data = (await request.json()) as any;

        if (!data.contentId) {
            return new Response(
                JSON.stringify({ success: false, message: 'contentId is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const contentId = parseInt(data.contentId);
        const moderatorId = data.moderatorId ? parseInt(data.moderatorId) : null;
        const reason = data.reason || 'No reason provided';

        // Mark as rejected (is_approved = 2 means rejected)
        const result = await env.DB.prepare(`
			UPDATE content
			SET is_approved = 2, approved_at = datetime('now'), approved_by = ?
			WHERE id = ? AND is_approved = 0
		`).bind(moderatorId, contentId).run();

        if (result.meta.changes === 0) {
            return new Response(
                JSON.stringify({ success: false, message: 'Content not found or already processed' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Log moderation action
        if (moderatorId) {
            await env.DB.prepare(`
				INSERT INTO activity_logs (user_id, action, description, created_at)
				VALUES (?, 'content_rejected', ?, datetime('now'))
			`).bind(moderatorId, `Rejected content ID: ${contentId}. Reason: ${reason}`).run();
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Content rejected successfully'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Reject content error:', error);
        return new Response(
            JSON.stringify({ success: false, message: 'Failed to reject content', error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * Handle GET /api/moderation-stats
 * Get moderation statistics
 */
export async function handleModerationStats(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    try {
        // Verify admin/moderator role
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.includes('admin_')) {
            return new Response(
                JSON.stringify({ success: false, message: 'Admin authentication required' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Get pending count
        const pendingResult = await env.DB.prepare(`
			SELECT COUNT(*) as count FROM content WHERE is_approved = 0
		`).first();

        // Get approved count
        const approvedResult = await env.DB.prepare(`
			SELECT COUNT(*) as count FROM content WHERE is_approved = 1
		`).first();

        // Get rejected count
        const rejectedResult = await env.DB.prepare(`
			SELECT COUNT(*) as count FROM content WHERE is_approved = 2
		`).first();

        // Get total content count
        const totalResult = await env.DB.prepare(`
			SELECT COUNT(*) as count FROM content
		`).first();

        // Get recent moderation activity
        const recentActivity = await env.DB.prepare(`
			SELECT 
				al.action,
				al.description,
				al.created_at,
				u.first_name,
				u.last_name
			FROM activity_logs al
			LEFT JOIN users u ON al.user_id = u.user_id
			WHERE al.action IN ('content_approved', 'content_rejected')
			ORDER BY al.created_at DESC
			LIMIT 10
		`).all();

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Moderation statistics retrieved successfully',
                data: {
                    stats: {
                        pending: Number(pendingResult?.count) || 0,
                        approved: Number(approvedResult?.count) || 0,
                        rejected: Number(rejectedResult?.count) || 0,
                        total: Number(totalResult?.count) || 0
                    },
                    recentActivity: (recentActivity.results || []).map((item: any) => ({
                        action: item.action,
                        description: item.description,
                        moderator: `${item.first_name || ''} ${item.last_name || ''}`.trim(),
                        timestamp: item.created_at
                    }))
                }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Moderation stats error:', error);
        return new Response(
            JSON.stringify({ success: false, message: 'Failed to retrieve moderation statistics', error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}
