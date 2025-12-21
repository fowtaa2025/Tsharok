/**
 * Tsharok API - Cloudflare Worker
 * Handles backend API requests for the Tsharok LMS
 * 
 * Rebuilt: 2025-12-21 - Phase 2
 * Clean minimal version with Phase 2: Auth + Gemma + Enrollments
 */

// ============================================
// TYPES & INTERFACES
// ============================================

export interface Env {
	DB: D1Database;
	BUCKET: R2Bucket;
	AI: any; // Cloudflare Workers AI binding for Gemma
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Extract userId from JWT token
 */
function getUserIdFromToken(token: string): number | null {
	try {
		const parts = token.split('.');
		if (parts.length !== 3) {
			const userId = parseInt(token);
			return isNaN(userId) ? null : userId;
		}
		const payload = parts[1];
		const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
		const data = JSON.parse(decoded);
		return parseInt(data.userId || data.user_id || data.sub || data.id || '0');
	} catch (error) {
		console.error('Error decoding token:', error);
		return null;
	}
}

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

// ============================================
// MAIN HANDLER
// ============================================

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		};

		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		try {
			// ============================================
			// AUTHENTICATION ROUTES
			// ============================================

			if (url.pathname === '/api/login' && request.method === 'POST') {
				return await handleLogin(request, env, corsHeaders);
			}

			if (url.pathname === '/api/register' && request.method === 'POST') {
				return await handleRegister(request, env, corsHeaders);
			}

			if (url.pathname === '/api/logout' && request.method === 'POST') {
				return await handleLogout(corsHeaders);
			}

			// ============================================
			// GEMMA AI CHATBOT
			// ============================================

			if (url.pathname === '/api/chatbot' && request.method === 'POST') {
				return await handleChatbot(request, env, corsHeaders);
			}

			// ============================================
			// ENROLLMENT SYSTEM
			// ============================================

			if (url.pathname === '/api/enroll' && request.method === 'POST') {
				return await handleEnroll(request, env, corsHeaders);
			}

			if (url.pathname === '/api/unenroll' && request.method === 'POST') {
				return await handleUnenroll(request, env, corsHeaders);
			}

			if (url.pathname === '/api/my-courses' && request.method === 'GET') {
				return await handleMyCourses(request, env, corsHeaders);
			}

			// Default 404
			return new Response(
				JSON.stringify({ success: false, message: 'Not found' }),
				{ status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);

		} catch (error: any) {
			console.error('Worker error:', error);
			return new Response(
				JSON.stringify({ success: false, message: 'Internal server error', error: error.message }),
				{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}
	}
} satisfies ExportedHandler<Env>;

// ============================================
// HANDLER FUNCTIONS - PHASE 2
// ============================================

/**
 * Handle POST /api/login
 */
async function handleLogin(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
	try {
		const data = await request.json() as any;

		if (!data.identifier || !data.password) {
			return new Response(
				JSON.stringify({ success: false, message: 'Email/username and password are required' }),
				{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		const identifier = data.identifier.trim();
		const password = data.password;

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

		const hashedPassword = await hashPassword(password);
		if (hashedPassword !== user.password_hash) {
			return new Response(
				JSON.stringify({ success: false, message: 'Invalid credentials' }),
				{ status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		const sessionToken = generateToken();

		await env.DB.prepare(`UPDATE users SET last_login = datetime('now') WHERE user_id = ?`)
			.bind(user.user_id)
			.run();

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

		const requiredFields = ['firstName', 'lastName', 'username', 'email', 'password'];
		for (const field of requiredFields) {
			if (!data[field] || !data[field].trim()) {
				return new Response(
					JSON.stringify({ success: false, message: `${field} is required` }),
					{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
				);
			}
		}

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

		const existingUsername = await env.DB.prepare('SELECT user_id FROM users WHERE username = ?')
			.bind(data.username)
			.first();

		if (existingUsername) {
			return new Response(
				JSON.stringify({ success: false, message: 'Username already taken' }),
				{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		const existingEmail = await env.DB.prepare('SELECT user_id FROM users WHERE email = ?')
			.bind(data.email)
			.first();

		if (existingEmail) {
			return new Response(
				JSON.stringify({ success: false, message: 'Email already registered' }),
				{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		const hashedPassword = await hashPassword(data.password);

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
				'student',
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
 * Handle POST /api/logout
 */
async function handleLogout(corsHeaders: Record<string, string>): Promise<Response> {
	return new Response(
		JSON.stringify({
			success: true,
			message: 'Logged out successfully',
		}),
		{ headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
	);
}

/**
 * Handle POST /api/chatbot - AI chatbot with Gemma
 */
async function handleChatbot(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		const { message, userId, conversationHistory = [] } = await request.json() as any;
		console.log('Chatbot request:', { message, userId });

		let userContext = '';

		if (userId) {
			console.log('User ID provided:', userId);

			const courses = await env.DB.prepare(`
				SELECT c.title, c.course_id
				FROM enrollments e
				JOIN courses c ON e.course_id = c.course_id
				WHERE e.student_id = ? AND e.status = 'active'
				LIMIT 5
			`).bind(userId).all();

			console.log('Courses query result:', courses.results);

			if (courses.results && courses.results.length > 0) {
				// Format as numbered list for clarity
				const courseListItems = courses.results
					.map((c: any, index: number) => `${index + 1}. ${c.title}`)
					.join('\n');

				userContext = `THE STUDENT IS CURRENTLY ENROLLED IN THESE EXACT COURSES:
${courseListItems}

CRITICAL: When asked about courses, you MUST list ONLY the courses shown above. 
Do NOT make up example courses like "English 101" or "Mathematics 120".
Use the EXACT course names from the list above.
`;
				console.log('User context set:', userContext);
			} else {
				console.log('No courses found for user:', userId);
			}
		}

		const systemPrompt = `You are Tsharok Assistant, an intelligent AI helper for students at Umm Al-Qura University.

Your role:
- Help students find courses and materials
- Answer questions about assignments and content
- Guide them through the platform
- Provide study tips and academic advice
- Respond in the SAME language the user uses (Arabic or English)

${userContext}
IMPORTANT INSTRUCTIONS:
- When asked about enrolled courses, YOU MUST list them from the information provided above
- This course enrollment information is meant to be shared with the student - it is NOT private
- If the student asks "what courses am I taking" or similar, directly tell them their enrolled courses
- Be friendly, helpful, and concise (2-3 sentences max)
- If you don't know something, suggest they check with their instructor
- Keep responses educational and professional`;

		const messages = [
			{ role: 'system', content: systemPrompt },
			...conversationHistory.slice(-10),
			{ role: 'user', content: message }
		];

		console.log('Calling Llama 3 AI...');

		const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
			messages: messages,
			max_tokens: 512,
			temperature: 0.7
		}) as any;

		console.log('Llama 3 response:', response);

		const aiReply = response.response || response.text || 'Sorry, I could not generate a response.';

		return new Response(
			JSON.stringify({
				success: true,
				reply: aiReply,
				model: 'llama-3-8b-instruct',
				timestamp: new Date().toISOString()
			}),
			{
				status: 200,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			}
		);

	} catch (error: any) {
		console.error('Chatbot error:', error);

		const fallbackResponse = 'I apologize, but I encountered an error. Please try asking your question again.';

		return new Response(
			JSON.stringify({
				success: true,
				reply: fallbackResponse,
				error: error.message,
				fallback: true
			}),
			{
				status: 200,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			}
		);
	}
}

/**
 * Handle POST /api/enroll - Enroll student in course
 */
async function handleEnroll(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		const { courseId, userId } = await request.json() as any;

		if (!courseId || !userId) {
			return new Response(
				JSON.stringify({ success: false, message: 'Missing courseId or userId' }),
				{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		const existing = await env.DB.prepare(`
			SELECT enrollment_id FROM enrollments 
			WHERE student_id = ? AND course_id = ?
		`).bind(userId, courseId).first();

		if (existing) {
			await env.DB.prepare(`
				UPDATE enrollments 
				SET status = 'active', enrollment_date = CURRENT_TIMESTAMP
				WHERE student_id = ? AND course_id = ?
			`).bind(userId, courseId).run();
		} else {
			await env.DB.prepare(`
				INSERT INTO enrollments (student_id, course_id, status, enrollment_date, progress_percent)
				VALUES (?, ?, 'active', CURRENT_TIMESTAMP, 0)
			`).bind(userId, courseId).run();
		}

		return new Response(
			JSON.stringify({ success: true, message: 'Enrolled successfully' }),
			{ status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);

	} catch (error: any) {
		console.error('Enrollment error:', error);
		return new Response(
			JSON.stringify({ success: false, message: error.message }),
			{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	}
}

/**
 * Handle POST /api/unenroll - Unenroll student from course
 */
async function handleUnenroll(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		const { courseId, userId } = await request.json() as any;

		if (!courseId || !userId) {
			return new Response(
				JSON.stringify({ success: false, message: 'Missing courseId or userId' }),
				{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		await env.DB.prepare(`
			UPDATE enrollments 
			SET status = 'dropped'
			WHERE student_id = ? AND course_id = ?
		`).bind(userId, courseId).run();

		return new Response(
			JSON.stringify({ success: true, message: 'Unenrolled successfully' }),
			{ status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);

	} catch (error: any) {
		console.error('Unenrollment error:', error);
		return new Response(
			JSON.stringify({ success: false, message: error.message }),
			{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	}
}

/**
 * Handle GET /api/my-courses - Get student's enrolled courses
 */
async function handleMyCourses(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		const url = new URL(request.url);
		const userId = url.searchParams.get('userId');

		if (!userId) {
			return new Response(
				JSON.stringify({ success: false, message: 'Missing userId parameter' }),
				{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		const result = await env.DB.prepare(`
			SELECT 
				c.course_id as courseId,
				c.title,
				c.description,
				c.level,
				e.enrollment_date
			FROM enrollments e
			JOIN courses c ON e.course_id = c.course_id
			WHERE e.student_id = ? AND e.status = 'active'
			ORDER BY e.enrollment_date DESC
		`).bind(userId).all();

		return new Response(
			JSON.stringify({
				success: true,
				data: { courses: result.results || [] }
			}),
			{ status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);

	} catch (error: any) {
		console.error('My courses error:', error);
		return new Response(
			JSON.stringify({ success: false, message: error.message }),
			{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	}
}
