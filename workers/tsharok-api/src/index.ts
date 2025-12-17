/**
 * Tsharok API - Cloudflare Worker
 * Handles backend API requests for the Tsharok LMS
 */

export interface Env {
	DB: D1Database;
	BUCKET: R2Bucket;
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

			// Route: GET /api/ratings
			if (url.pathname === '/api/ratings' && request.method === 'GET') {
				return await handleGetRatings(url, env, corsHeaders);
			}

			// Route: POST /api/enroll
			if (url.pathname === '/api/enroll' && request.method === 'POST') {
				return await handleEnroll(request, env, corsHeaders);
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
	const userId = url.searchParams.get('userId') || '0';

	if (!contentId) {
		return new Response(
			JSON.stringify({ success: false, message: 'contentId parameter is required' }),
			{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	}

	try {
		const offset = (page - 1) * limit;

		// Get comments with ratings
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
				CASE WHEN c.user_id = ? THEN 1 ELSE 0 END as is_own_comment
			FROM comments c
			INNER JOIN users u ON c.user_id = u.user_id
			LEFT JOIN ratings r ON c.user_id = r.user_id AND c.content_id = r.content_id
			WHERE c.content_id = ?
			ORDER BY c.created_at DESC
			LIMIT ? OFFSET ?
		`;

		const params = [userId, contentId, limit + 1, offset];
		const result = await env.DB.prepare(query).bind(...params).all();

		const comments = result.results as any[];
		const hasMore = comments.length > limit;

		if (hasMore) {
			comments.pop();
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
 * Handle GET /api/ratings
 * Get rating statistics for content
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
		// Get average and count
		const stats = await env.DB.prepare(
			`SELECT 
				COALESCE(AVG(score), 0) as average_score,
				COUNT(*) as total_ratings
			 FROM ratings
			 WHERE content_id = ?`
		)
			.bind(contentId)
			.first();

		return new Response(
			JSON.stringify({
				success: true,
				message: 'Ratings retrieved successfully',
				data: {
					averageRating: Math.round((stats?.average_score as number) * 10) / 10,
					totalRatings: stats?.total_ratings || 0,
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
