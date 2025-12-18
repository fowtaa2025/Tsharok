/**
 * Tsharok API - Cloudflare Worker
 * Handles backend API requests for the Tsharok LMS
 */

import {
	handleGetCourses,
	handleGetCourseDetails,
	handleGetMyCourses,
	handleUnenroll,
	handleGetMajors,
	handleGetFilterOptions
} from './course-handlers';

import {
	handleContentInteractions,
	handleContentUpload,
	handleFileUploadHandler
} from './content-handlers';

import {
	handleAddRating,
	handleGetReview,
	handleUpdateReview,
	handleDeleteReview
} from './review-handlers';

import {
	handleCheckAuth,
	handleForgotPassword,
	handleResetPassword,
	handleVerifyEmail,
	handleResendVerification
} from './auth-handlers';

import {
	handleAdminLogin,
	handleGetPendingContent,
	handleApproveContent,
	handleRejectContent,
	handleModerationStats
} from './admin-handlers';

import {
	handleGetAvailableLanguages,
	handleGetTranslations,
	handleSetLanguage,
	handleAdminTranslations
} from './i18n-handlers';

export interface Env {
	DB: D1Database;
	BUCKET: R2Bucket;
}

/**
 * Extract userId from JWT token
 * Simple JWT decode - extracts payload without verification (for now)
 */
function getUserIdFromToken(token: string): number | null {
	try {
		// JWT format: header.payload.signature
		const parts = token.split('.');
		if (parts.length !== 3) {
			// Not a JWT, try as plain userId
			const userId = parseInt(token);
			return isNaN(userId) ? null : userId;
		}

		// Decode payload (base64url to JSON)
		const payload = parts[1];
		const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
		const data = JSON.parse(decoded);

		// Extract userId (might be 'userId', 'user_id', 'sub', or 'id')
		return parseInt(data.userId || data.user_id || data.sub || data.id || '0');
	} catch (error) {
		console.error('Error decoding token:', error);
		return null;
	}
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		// CORS headers
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		};

		// Handle preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		try {
			// Route: POST /api/login
			if (url.pathname === '/api/login' && request.method === 'POST') {
				return await handleLogin(request, env, corsHeaders);
			}

			// Route: POST /api/register
			if (url.pathname === '/api/register' && request.method === 'POST') {
				return await handleRegister(request, env, corsHeaders);
			}

			// Route: POST /api/logout
			if (url.pathname === '/api/logout' && request.method === 'POST') {
				return await handleLogout(corsHeaders);
			}

			// Route: POST /api/upload
			if (url.pathname === '/api/upload' && request.method === 'POST') {
				return await handleUpload(request, env, corsHeaders);
			}

			// Route: GET /api/profile?user_id=X
			if (url.pathname === '/api/profile' && request.method === 'GET') {
				return await handleProfile(url, env, corsHeaders);
			}

			// Route: GET /api/view-materials?course_id=1
			if (url.pathname === '/api/view-materials' && request.method === 'GET') {
				return await handleViewMaterials(url, env, corsHeaders);
			}

			// Route: GET /api/comments
			if (url.pathname === '/api/comments' && request.method === 'GET') {
				return await handleGetComments(url, env, corsHeaders);
			}

			// Route: POST /api/comments/add
			if (url.pathname === '/api/comments/add' && request.method === 'POST') {
				return await handleAddComment(request, env, corsHeaders);
			}

			// Route: POST /api/comments/like
			if (url.pathname === '/api/comments/like' && request.method === 'POST') {
				return await handleCommentLike(request, env, corsHeaders);
			}

			// Route: POST /api/comments/reply
			if (url.pathname === '/api/comments/reply' && request.method === 'POST') {
				return await handleCommentReply(request, env, corsHeaders);
			}

			// Route: GET /api/ratings
			if (url.pathname === '/api/ratings' && request.method === 'GET') {
				return await handleGetRatings(url, env, corsHeaders);
			}

			// Route: GET /api/search
			if (url.pathname === '/api/search' && request.method === 'GET') {
				return await handleSearch(url, env, corsHeaders);
			}

			// Route: GET /api/search/suggestions
			if (url.pathname === '/api/search/suggestions' && request.method === 'GET') {
				return await handleSearchSuggestions(url, env, corsHeaders);
			}

			// Route: GET /api/search/filters  
			if (url.pathname === '/api/search/filters' && request.method === 'GET') {
				return await handleSearchFilters(env, corsHeaders);
			}

			// Route: POST /api/enroll
			if (url.pathname === '/api/enroll' && request.method === 'POST') {
				return await handleEnroll(request, env, corsHeaders);
			}

			// Route: GET /api/ratings
			if (url.pathname === '/api/ratings' && request.method === 'GET') {
				return await handleGetRatings(url, env, corsHeaders);
			}

			// Route: GET /api/courses - Course catalog
			if (url.pathname === '/api/courses' && request.method === 'GET') {
				return await handleGetCourses(url, env, corsHeaders);
			}

			// Route: GET /api/course-details - Individual course details
			if (url.pathname === '/api/course-details' && request.method === 'GET') {
				return await handleGetCourseDetails(url, env, corsHeaders);
			}

			// Route: GET /api/my-courses - User's enrolled courses
			if (url.pathname === '/api/my-courses' && request.method === 'GET') {
				return await handleGetMyCourses(request, url, env, corsHeaders);
			}

			// Route: POST /api/unenroll - Unenroll from course
			if (url.pathname === '/api/unenroll' && request.method === 'POST') {
				return await handleUnenroll(request, env, corsHeaders);
			}

			// Route: GET /api/majors - Get available majors
			if (url.pathname === '/api/majors' && request.method === 'GET') {
				return await handleGetMajors(env, corsHeaders);
			}

			// Route: GET /api/filter-options - Get filter options
			if (url.pathname === '/api/filter-options' && request.method === 'GET') {
				return await handleGetFilterOptions(env, corsHeaders);
			}

			// Route: POST /api/content-interactions - Track downloads, views, helpful
			if (url.pathname === '/api/content-interactions' && request.method === 'POST') {
				return await handleContentInteractions(request, env, corsHeaders);
			}

			// Route: POST /api/content-upload - Upload content with metadata
			if (url.pathname === '/api/content-upload' && request.method === 'POST') {
				return await handleContentUpload(request, env, corsHeaders);
			}

			// Route: POST /api/file-upload-handler - Enhanced upload handler
			if (url.pathname === '/api/file-upload-handler' && request.method === 'POST') {
				return await handleFileUploadHandler(request, env, corsHeaders);
			}

			// Route: POST /api/add-rating - Add course rating/review
			if (url.pathname === '/api/add-rating' && request.method === 'POST') {
				return await handleAddRating(request, env, corsHeaders);
			}

			// Route: GET /api/get-review - Get specific review
			if (url.pathname === '/api/get-review' && request.method === 'GET') {
				return await handleGetReview(url, env, corsHeaders);
			}

			// Route: PUT /api/update-review - Update review
			if (url.pathname === '/api/update-review' && request.method === 'PUT') {
				return await handleUpdateReview(request, env, corsHeaders);
			}

			// Route: DELETE /api/delete-review - Delete review
			if (url.pathname === '/api/delete-review' && request.method === 'DELETE') {
				return await handleDeleteReview(request, env, corsHeaders);
			}

			// Route: GET /api/check-auth - Check authentication status
			if (url.pathname === '/api/check-auth' && request.method === 'GET') {
				return await handleCheckAuth(request, env, corsHeaders);
			}

			// Route: POST /api/forgot-password - Request password reset
			if (url.pathname === '/api/forgot-password' && request.method === 'POST') {
				return await handleForgotPassword(request, env, corsHeaders);
			}

			// Route: POST /api/reset-password - Reset password with token
			if (url.pathname === '/api/reset-password' && request.method === 'POST') {
				return await handleResetPassword(request, env, corsHeaders);
			}

			// Route: GET /api/verify-email - Verify email address
			if (url.pathname === '/api/verify-email' && request.method === 'GET') {
				return await handleVerifyEmail(url, env, corsHeaders);
			}

			// Route: POST /api/resend-verification - Resend verification email
			if (url.pathname === '/api/resend-verification' && request.method === 'POST') {
				return await handleResendVerification(request, env, corsHeaders);
			}

			// Route: POST /api/admin-login - Admin authentication
			if (url.pathname === '/api/admin-login' && request.method === 'POST') {
				return await handleAdminLogin(request, env, corsHeaders);
			}

			// Route: GET /api/get-pending-content - Get pending content
			if (url.pathname === '/api/get-pending-content' && request.method === 'GET') {
				return await handleGetPendingContent(request, env, corsHeaders);
			}

			// Route: POST /api/approve-content - Approve content
			if (url.pathname === '/api/approve-content' && request.method === 'POST') {
				return await handleApproveContent(request, env, corsHeaders);
			}

			// Route: POST /api/reject-content - Reject content
			if (url.pathname === '/api/reject-content' && request.method === 'POST') {
				return await handleRejectContent(request, env, corsHeaders);
			}

			// Route: GET /api/moderation-stats - Get moderation statistics
			if (url.pathname === '/api/moderation-stats' && request.method === 'GET') {
				return await handleModerationStats(request, env, corsHeaders);
			}

			// Route: GET /api/get-available-languages - Get available languages
			if (url.pathname === '/api/get-available-languages' && request.method === 'GET') {
				return await handleGetAvailableLanguages(env, corsHeaders);
			}

			// Route: GET /api/get-translations - Get translations for language
			if (url.pathname === '/api/get-translations' && request.method === 'GET') {
				return await handleGetTranslations(url, env, corsHeaders);
			}

			// Route: POST /api/set-language - Set user language preference
			if (url.pathname === '/api/set-language' && request.method === 'POST') {
				return await handleSetLanguage(request, env, corsHeaders);
			}

			// Route: POST /api/admin-translations - Admin translation management
			if (url.pathname === '/api/admin-translations' && request.method === 'POST') {
				return await handleAdminTranslations(request, env, corsHeaders);
			}

			// Default: Not Found
			return new Response(
				JSON.stringify({ success: false, message: 'Endpoint not found' }),
				{ status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		} catch (error: any) {
			console.error('Worker error:', error);
			return new Response(
				JSON.stringify({ success: false, message: 'Internal server error', error: error.message }),
				{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}
	},
} satisfies ExportedHandler<Env>;

/**
 * Hash password using SHA-256
 */
async function hashPassword(password: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(password);
	const hash = await crypto.subtle.digest('SHA-256', data);
	return Array.from(new Uint8Array(hash))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

/**
 * Generate random token
 */
function generateToken(): string {
	return crypto.randomUUID() + '-' + Date.now();
}

/**
 * Handle POST /api/login
 */
async function handleLogin(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
	try {
		const data = await request.json() as any;

		// Validate input
		if (!data.identifier || !data.password) {
			return new Response(
				JSON.stringify({ success: false, message: 'Email/username and password are required' }),
				{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		const identifier = data.identifier.trim();
		const password = data.password;

		// Find user
		const user = await env.DB.prepare(`
			SELECT 
				user_id, username, email, password_hash,
				first_name, last_name, role, major_id,
				is_active, profile_image
			FROM users
			WHERE (email = ? OR username = ?) AND is_active = 1
			LIMIT 1
		`)
			.bind(identifier, identifier)
			.first();

		if (!user) {
			return new Response(
				JSON.stringify({ success: false, message: 'Invalid credentials' }),
				{ status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		// Verify password
		const hashedPassword = await hashPassword(password);
		if (hashedPassword !== user.password_hash) {
			return new Response(
				JSON.stringify({ success: false, message: 'Invalid credentials' }),
				{ status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		// Generate session token
		const sessionToken = generateToken();

		// Update last login
		await env.DB.prepare(`UPDATE users SET last_login = datetime('now') WHERE user_id = ?`)
			.bind(user.user_id)
			.run();

		// Prepare response
		const userData = {
			userId: user.user_id,
			username: user.username,
			email: user.email,
			firstName: user.first_name,
			lastName: user.last_name,
			fullName: `${user.first_name} ${user.last_name}`,
			role: user.role,
			majorId: user.major_id,
			profileImage: user.profile_image,
			sessionToken: sessionToken,
		};

		const redirectUrl = user.role === 'admin' ? '/dashboard/admin.html' : '/dashboard/student.html';

		return new Response(
			JSON.stringify({
				success: true,
				message: 'Login successful! Redirecting...',
				user: userData,
				redirectUrl: redirectUrl,
			}),
			{ headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	} catch (error: any) {
		console.error('Login error:', error);
		return new Response(
			JSON.stringify({ success: false, message: 'Login failed', error: error.message }),
			{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	}
}

/**
 * Handle POST /api/register
 */
async function handleRegister(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
	try {
		const data = await request.json() as any;

		// Validate required fields
		const requiredFields = ['firstName', 'lastName', 'username', 'email', 'password'];
		for (const field of requiredFields) {
			if (!data[field] || !data[field].trim()) {
				return new Response(
					JSON.stringify({ success: false, message: `${field} is required` }),
					{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
				);
			}
		}

		// Basic validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(data.email)) {
			return new Response(
				JSON.stringify({ success: false, message: 'Invalid email format' }),
				{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		if (data.password.length < 6) {
			return new Response(
				JSON.stringify({ success: false, message: 'Password must be at least 6 characters' }),
				{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		// Check if username exists
		const existingUsername = await env.DB.prepare('SELECT user_id FROM users WHERE username = ?')
			.bind(data.username)
			.first();

		if (existingUsername) {
			return new Response(
				JSON.stringify({ success: false, message: 'Username already taken' }),
				{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		// Check if email exists
		const existingEmail = await env.DB.prepare('SELECT user_id FROM users WHERE email = ?')
			.bind(data.email)
			.first();

		if (existingEmail) {
			return new Response(
				JSON.stringify({ success: false, message: 'Email already registered' }),
				{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		// Hash password
		const hashedPassword = await hashPassword(data.password);

		// Insert user (set is_active to 1 for now - skip email verification)
		const result = await env.DB.prepare(`
			INSERT INTO users (
				username, email, password_hash,
				first_name, last_name, role, major_id,
				phone, is_active, created_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
		`)
			.bind(
				data.username,
				data.email,
				hashedPassword,
				data.firstName,
				data.lastName,
				'student', // Force student role
				data.major || null,
				data.phone || null
			)
			.run();

		return new Response(
			JSON.stringify({
				success: true,
				message: 'Registration successful! You can now login.',
				userId: result.meta.last_row_id,
			}),
			{ headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	} catch (error: any) {
		console.error('Registration error:', error);
		return new Response(
			JSON.stringify({ success: false, message: 'Registration failed', error: error.message }),
			{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	}
}

/**
 * Handle GET /api/view-materials?course_id=X
 */
async function handleViewMaterials(url: URL, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
	const courseId = url.searchParams.get('course_id');

	if (!courseId) {
		return new Response(
			JSON.stringify({ success: false, message: 'course_id parameter is required' }),
			{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	}

	try {
		// Query D1 database
		const result = await env.DB.prepare(`
			SELECT 
				id, title, type, file_url, upload_date,
				description, file_size, mime_type,
				is_approved, uploader_id
			FROM content
			WHERE course_id = ? AND is_approved = 1
			ORDER BY upload_date DESC
		`)
			.bind(courseId)
			.all();

		// Format response
		const materials = result.results.map((material: any) => ({
			id: material.id,
			title: material.title,
			type: material.type,
			description: material.description,
			file_url: material.file_url,
			file_size: material.file_size,
			mime_type: material.mime_type,
			is_approved: Boolean(material.is_approved),
			upload_date: material.upload_date,
			uploader: {
				id: material.uploader_id,
				name: 'Student',
				email: null,
			},
			statistics: {
				avg_rating: null,
				rating_count: 0,
			},
		}));

		const response = {
			success: true,
			message: 'Materials fetched successfully',
			timestamp: new Date().toISOString(),
			data: {
				materials: materials,
				total_count: materials.length,
				returned_count: materials.length,
			},
		};

		return new Response(JSON.stringify(response), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
		});
	} catch (error: any) {
		console.error('Database error:', error);
		return new Response(
			JSON.stringify({
				success: false,
				message: 'Failed to fetch materials',
				error: error.message,
			}),
			{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	}
}

/**
 * Handle POST /api/logout
 */
async function handleLogout(corsHeaders: Record<string, string>): Promise<Response> {
	// Logout is handled client-side by clearing sessionStorage
	// This endpoint just confirms the logout
	return new Response(
		JSON.stringify({
			success: true,
			message: 'Logged out successfully',
		}),
		{ headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
	);
}

/**
 * Handle GET /api/profile?user_id=X
 */
async function handleProfile(url: URL, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
	const userId = url.searchParams.get('user_id');

	if (!userId) {
		return new Response(
			JSON.stringify({ success: false, message: 'user_id parameter is required' }),
			{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	}

	try {
		// Query user data
		const user = await env.DB.prepare(`
			SELECT 
				user_id, username, email, first_name, last_name,
				role, major_id, phone, profile_image,
				created_at, last_login
			FROM users
			WHERE user_id = ?
		`)
			.bind(userId)
			.first();

		if (!user) {
			return new Response(
				JSON.stringify({ success: false, message: 'User not found' }),
				{ status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		// Return user profile
		const profile = {
			userId: user.user_id,
			username: user.username,
			email: user.email,
			firstName: user.first_name,
			lastName: user.last_name,
			fullName: `${user.first_name} ${user.last_name}`,
			role: user.role,
			majorId: user.major_id,
			phone: user.phone,
			profileImage: user.profile_image,
			createdAt: user.created_at,
			lastLogin: user.last_login,
		};

		return new Response(
			JSON.stringify({
				success: true,
				message: 'Profile fetched successfully',
				user: profile,
			}),
			{ headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	} catch (error: any) {
		console.error('Profile error:', error);
		return new Response(
			JSON.stringify({ success: false, message: 'Failed to fetch profile', error: error.message }),
			{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	}
}

/**
 * Handle POST /api/upload
 * Upload file to R2 and save metadata to D1
 */
async function handleUpload(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
	try {
		const formData = await request.formData();

		// Get form fields
		const file = formData.get('file') as File;
		const title = formData.get('title') as string;
		const courseId = formData.get('courseId') as string;
		const userId = formData.get('userId') as string;
		const description = formData.get('description') as string || '';
		const type = formData.get('type') as string || 'document';

		// Validate
		if (!file || !title || !courseId || !userId) {
			return new Response(
				JSON.stringify({ success: false, message: 'Missing required fields' }),
				{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		// Generate unique filename
		const timestamp = Date.now();
		const extension = file.name.split('.').pop();
		const r2Key = `course-${courseId}/${timestamp}-${file.name}`;

		// Upload to R2
		await env.BUCKET.put(r2Key, file.stream(), {
			httpMetadata: {
				contentType: file.type,
			},
		});

		// Get public URL
		const fileUrl = `https://pub-cd42bce9da7242b69d703b8bf1e9e4b6.r2.dev/${r2Key}`;

		// Save to D1 database
		const result = await env.DB.prepare(`
			INSERT INTO content (
				course_id, uploader_id, title, description,
				type, file_url, file_size, mime_type,
				is_approved, upload_date
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
		`)
			.bind(
				courseId,
				userId,
				title,
				description,
				type,
				r2Key,
				file.size,
				file.type
			)
			.run();

		return new Response(
			JSON.stringify({
				success: true,
				message: 'File uploaded successfully',
				data: {
					id: result.meta.last_row_id,
					title: title,
					fileUrl: fileUrl,
					r2Key: r2Key,
				},
			}),
			{ headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	} catch (error: any) {
		console.error('Upload error:', error);
		return new Response(
			JSON.stringify({ success: false, message: 'Upload failed', error: error.message }),
			{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	}
}

/**
 * Handle GET /api/comments
 * Get reviews/comments for a content item with pagination
 */
async function handleGetComments(url: URL, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
	const contentId = url.searchParams.get('contentId');
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = parseInt(url.searchParams.get('limit') || '10');
	const userIdParam = url.searchParams.get('userId') || '0';

	// Decode JWT if it's a token, otherwise use as-is
	const userId = getUserIdFromToken(userIdParam) || 0;

	if (!contentId) {
		return new Response(
			JSON.stringify({ success: false, message: 'contentId parameter is required' }),
			{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	}

	try {
		const offset = (page - 1) * limit;

		// Get comments with ratings and like info
		const query = `
			SELECT 
				c.id,
				c.content,
				c.created_at,
				c.updated_at,
				u.user_id,
				u.username,
				u.first_name || ' ' || u.last_name as user_name,
				u.profile_image as user_avatar,
				r.score,
				CASE WHEN c.user_id = ? THEN 1 ELSE 0 END as is_own_comment,
				(SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) as likes,
				CASE WHEN EXISTS(SELECT 1 FROM comment_likes WHERE comment_id = c.id AND user_id = ?) THEN 1 ELSE 0 END as likedByMe
			FROM comments c
			INNER JOIN users u ON c.user_id = u.user_id
			LEFT JOIN ratings r ON c.user_id = r.user_id AND c.content_id = r.content_id
			WHERE c.content_id = ?
			ORDER BY 
				CASE WHEN EXISTS(SELECT 1 FROM comment_likes WHERE comment_id = c.id AND user_id = ?) THEN 0 ELSE 1 END,
				c.created_at DESC
			LIMIT ? OFFSET ?
		`;

		const params = [userId, userId, contentId, userId, limit + 1, offset];
		const result = await env.DB.prepare(query).bind(...params).all();

		const comments = result.results as any[];
		const hasMore = comments.length > limit;

		if (hasMore) {
			comments.pop();
		}

		// Fetch replies for each comment
		for (const comment of comments) {
			const repliesResult = await env.DB.prepare(
				`SELECT 
					cr.id,
					cr.content as text,
					cr.created_at,
					u.first_name || ' ' || u.last_name as author,
					u.username
				FROM comment_replies cr
				JOIN users u ON cr.user_id = u.user_id
				WHERE cr.comment_id = ?
				ORDER BY cr.created_at ASC`
			)
				.bind(comment.id)
				.all();

			comment.replies = repliesResult.results || [];
		}

		// Format comments
		const formattedComments = comments.map((comment) => ({
			id: comment.id,
			userName: comment.user_name,
			username: comment.username,
			userAvatar: comment.user_avatar,
			score: comment.score || 0,
			content: comment.content,
			createdAt: comment.created_at,
			updatedAt: comment.updated_at,
			isOwnComment: Boolean(comment.is_own_comment),
			likes: comment.likes || 0,
			likedByMe: Boolean(comment.likedByMe),
			replies: (comment.replies || []).map((reply: any) => ({
				id: reply.id,
				text: reply.text,
				author: reply.author,
				username: reply.username,
				createdAt: reply.created_at,
			})),
		}));

		return new Response(
			JSON.stringify({
				success: true,
				message: 'Comments retrieved successfully',
				data: {
					comments: formattedComments,
					hasMore: hasMore,
					page: page,
					limit: limit,
				},
			}),
			{ headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	} catch (error: any) {
		console.error('Get comments error:', error);
		return new Response(
			JSON.stringify({ success: false, message: 'Failed to retrieve comments', error: error.message }),
			{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	}
}

/**
 * Handle GET /api/ratings
 * Get average rating for content
 */
async function handleGetRatings(url: URL, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
	const contentId = url.searchParams.get('contentId');

	if (!contentId) {
		return new Response(
			JSON.stringify({ success: false, message: 'contentId parameter is required' }),
			{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	}

	try {
		// Get average rating and count
		const result = await env.DB.prepare(
			`SELECT 
				AVG(score) as averageRating,
				COUNT(*) as totalRatings
			FROM ratings
			WHERE content_id = ?`
		)
			.bind(contentId)
			.first();

		const averageRating = result ? (result.averageRating as number) || 0 : 0;
		const totalRatings = result ? (result.totalRatings as number) || 0 : 0;

		return new Response(
			JSON.stringify({
				success: true,
				message: 'Ratings retrieved successfully',
				data: {
					averageRating: averageRating,
					totalRatings: totalRatings,
				},
			}),
			{ headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	} catch (error: any) {
		console.error('Get ratings error:', error);
		return new Response(
			JSON.stringify({ success: false, message: 'Failed to retrieve ratings', error: error.message }),
			{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	}
}

/**
 * Handle POST /api/comments/add
 * Add a new rating and comment for content
 */
async function handleAddComment(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
	try {
		const data = (await request.json()) as any;

		// Validate required fields
		if (!data.userId || !data.contentId || !data.score || !data.content) {
			return new Response(
				JSON.stringify({ success: false, message: 'Missing required fields: userId, contentId, score, content' }),
				{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		const userId = parseInt(data.userId);
		const contentId = parseInt(data.contentId);
		const score = parseFloat(data.score);
		const content = data.content.trim();

		// Validate score
		if (score < 0 || score > 5) {
			return new Response(
				JSON.stringify({ success: false, message: 'Score must be between 0 and 5' }),
				{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		// Validate content length
		if (content.length < 1 || content.length > 5000) {
			return new Response(
				JSON.stringify({ success: false, message: 'Comment must be between 1 and 5000 characters' }),
				{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		// Check if user has already rated this content
		const existingRating = await env.DB.prepare(`SELECT id FROM ratings WHERE user_id = ? AND content_id = ?`)
			.bind(userId, contentId)
			.first();

		if (existingRating) {
			// Update existing rating
			await env.DB.prepare(`UPDATE ratings SET score = ?, updated_at = datetime('now') WHERE user_id = ? AND content_id = ?`)
				.bind(score, userId, contentId)
				.run();
		} else {
			// Insert new rating
			await env.DB.prepare(`INSERT INTO ratings (user_id, content_id, score, created_at) VALUES (?, ?, ?, datetime('now'))`)
				.bind(userId, contentId, score)
				.run();
		}

		// Insert comment
		const commentResult = await env.DB.prepare(
			`INSERT INTO comments (user_id, content_id, content, created_at) VALUES (?, ?, ?, datetime('now'))`
		)
			.bind(userId, contentId, content)
			.run();

		const commentId = commentResult.meta.last_row_id;

		return new Response(
			JSON.stringify({
				success: true,
				message: 'Rating and comment submitted successfully',
				data: {
					commentId: commentId,
				},
			}),
			{ headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	} catch (error: any) {
		console.error('Add comment error:', error);
		return new Response(
			JSON.stringify({ success: false, message: 'Failed to submit rating and comment', error: error.message }),
			{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	}
}

/**
 * Handle POST /api/comments/like
 * Toggle like on a comment
 */
async function handleCommentLike(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
	const authHeader = request.headers.get('Authorization');
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return new Response(
			JSON.stringify({ success: false, message: 'Authentication required' }),
			{ status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	}

	try {
		const data = await request.json() as any;
		const commentId = data.commentId;
		const token = authHeader.substring(7);
		const userId = getUserIdFromToken(token);

		if (!userId) {
			return new Response(
				JSON.stringify({ success: false, message: 'Invalid token' }),
				{ status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		if (!commentId) {
			return new Response(
				JSON.stringify({ success: false, message: 'commentId is required' }),
				{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		// Check if comment exists
		const commentExists = await env.DB.prepare('SELECT id FROM comments WHERE id = ?')
			.bind(commentId)
			.first();

		if (!commentExists) {
			return new Response(
				JSON.stringify({ success: false, message: 'Comment not found' }),
				{ status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		// Check if user already liked
		const existingLike = await env.DB.prepare(
			'SELECT id FROM comment_likes WHERE comment_id = ? AND user_id = ?'
		)
			.bind(commentId, userId)
			.first();

		let liked = false;
		if (existingLike) {
			// Unlike - remove like
			await env.DB.prepare('DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?')
				.bind(commentId, userId)
				.run();
			liked = false;
		} else {
			// Like - add like
			await env.DB.prepare(
				"INSERT INTO comment_likes (comment_id, user_id, created_at) VALUES (?, ?, datetime('now'))"
			)
				.bind(commentId, userId)
				.run();
			liked = true;
		}

		// Get updated like count
		const likeCountResult = await env.DB.prepare(
			'SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = ?'
		)
			.bind(commentId)
			.first();

		const likeCount = (likeCountResult as any).count || 0;

		return new Response(
			JSON.stringify({
				success: true,
				liked: liked,
				likes: likeCount,
				message: liked ? 'Comment liked' : 'Comment unliked',
			}),
			{ headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	} catch (error: any) {
		console.error('Comment like error:', error);
		return new Response(
			JSON.stringify({ success: false, message: 'Failed to toggle like', error: error.message }),
			{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	}
}

/**
 * Handle POST /api/comments/reply
 * Add a reply to a comment
 */
async function handleCommentReply(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
	const authHeader = request.headers.get('Authorization');
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return new Response(
			JSON.stringify({ success: false, message: 'Authentication required' }),
			{ status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	}

	try {
		const data = await request.json() as any;
		const commentId = data.commentId;
		const text = data.text?.trim();
		const token = authHeader.substring(7);
		const userId = getUserIdFromToken(token);

		if (!userId) {
			return new Response(
				JSON.stringify({ success: false, message: 'Invalid token' }),
				{ status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		if (!commentId) {
			return new Response(
				JSON.stringify({ success: false, message: 'commentId is required' }),
				{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		if (!text) {
			return new Response(
				JSON.stringify({ success: false, message: 'Reply text is required' }),
				{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		if (text.length > 1000) {
			return new Response(
				JSON.stringify({ success: false, message: 'Reply text is too long (max 1000 characters)' }),
				{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		// Check if comment exists
		const commentExists = await env.DB.prepare('SELECT id FROM comments WHERE id = ?')
			.bind(commentId)
			.first();

		if (!commentExists) {
			return new Response(
				JSON.stringify({ success: false, message: 'Comment not found' }),
				{ status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		// Insert reply
		const replyResult = await env.DB.prepare(
			`INSERT INTO comment_replies (comment_id, user_id, content, created_at, updated_at) 
			 VALUES (?, ?, ?, datetime('now'), datetime('now'))`
		)
			.bind(commentId, userId, text)
			.run();

		const replyId = replyResult.meta.last_row_id;

		// Get reply with user info
		const reply = await env.DB.prepare(
			`SELECT 
				cr.id,
				cr.comment_id,
				cr.user_id,
				cr.content as text,
				cr.created_at,
				u.first_name || ' ' || u.last_name as author,
				u.username
			 FROM comment_replies cr
			 JOIN users u ON cr.user_id = u.user_id
			 WHERE cr.id = ?`
		)
			.bind(replyId)
			.first();

		return new Response(
			JSON.stringify({
				success: true,
				reply: reply,
				message: 'Reply added successfully',
			}),
			{ headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	} catch (error: any) {
		console.error('Comment reply error:', error);
		return new Response(
			JSON.stringify({ success: false, message: 'Failed to add reply', error: error.message }),
			{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	}
}

/**
 * Handle POST /api/enroll
 * Enroll a user in a course
 */
async function handleEnroll(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
	try {
		const data = (await request.json()) as any;

		// Validate required fields
		if (!data.userId || !data.courseId) {
			return new Response(
				JSON.stringify({ success: false, message: 'userId and courseId are required' }),
				{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		const userId = parseInt(data.userId);
		const courseId = parseInt(data.courseId);

		// Check if course exists
		const course = await env.DB.prepare(
			`SELECT course_id, title, instructor_id FROM courses WHERE course_id = ?`
		)
			.bind(courseId)
			.first();

		if (!course) {
			return new Response(
				JSON.stringify({ success: false, message: 'Course not found' }),
				{ status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		// Check if user is the instructor
		if (course.instructor_id === userId) {
			return new Response(
				JSON.stringify({ success: false, message: 'Instructors cannot enroll in their own courses' }),
				{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		// Check if already enrolled
		const existingEnrollment = await env.DB.prepare(
			`SELECT enrollment_id FROM enrollments WHERE student_id = ? AND course_id = ?`
		)
			.bind(userId, courseId)
			.first();

		if (existingEnrollment) {
			return new Response(
				JSON.stringify({ success: false, message: 'You are already enrolled in this course' }),
				{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		// Create enrollment
		const result = await env.DB.prepare(
			`INSERT INTO enrollments (student_id, course_id, enrollment_date, status) 
			 VALUES (?, ?, datetime('now'), 'active')`
		)
			.bind(userId, courseId)
			.run();

		return new Response(
			JSON.stringify({
				success: true,
				message: 'Successfully enrolled in the course!',
				data: {
					enrollmentId: result.meta.last_row_id,
					courseId: courseId,
					courseName: course.title,
				},
			}),
			{ headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	} catch (error: any) {
		console.error('Enroll error:', error);
		return new Response(
			JSON.stringify({ success: false, message: 'Failed to enroll in course', error: error.message }),
			{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	}
}

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