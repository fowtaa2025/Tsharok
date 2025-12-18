/**
 * Authentication Extension Handlers for Tsharok API
 * Handles password reset, email verification, and auth checking
 */

// Define Env interface to match the main worker
interface Env {
    DB: D1Database;
    BUCKET: R2Bucket;
    JWT_SECRET?: string;
}

/**
 * Handle GET /api/check-auth
 * Check authentication status and return user data
 */
export async function handleCheckAuth(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    try {
        const authHeader = request.headers.get('Authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: 'Not authenticated',
                    data: { authenticated: false }
                }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const token = authHeader.replace('Bearer ', '');
        const userId = getUserIdFromToken(token);

        if (!userId) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: 'Invalid token',
                    data: { authenticated: false }
                }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Get user data
        const user = await env.DB.prepare(`
			SELECT 
				user_id, username, email, first_name, last_name,
				role, profile_image, major_id, is_active
			FROM users
			WHERE user_id = ? AND is_active = 1
			LIMIT 1
		`).bind(userId).first();

        if (!user) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: 'User not found',
                    data: { authenticated: false }
                }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Authenticated',
                data: {
                    authenticated: true,
                    user: {
                        userId: user.user_id,
                        username: user.username,
                        email: user.email,
                        firstName: user.first_name,
                        lastName: user.last_name,
                        fullName: `${user.first_name} ${user.last_name}`,
                        role: user.role,
                        majorId: user.major_id,
                        profileImage: user.profile_image
                    }
                }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Check auth error:', error);
        return new Response(
            JSON.stringify({
                success: false,
                message: 'Authentication check failed',
                data: { authenticated: false },
                error: error.message
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * Handle POST /api/forgot-password
 * Send password reset email
 */
export async function handleForgotPassword(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    try {
        const data = (await request.json()) as any;

        if (!data.email) {
            return new Response(
                JSON.stringify({ success: false, message: 'Email is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const email = data.email.toLowerCase().trim();

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return new Response(
                JSON.stringify({ success: false, message: 'Invalid email address' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Check if user exists
        const user = await env.DB.prepare(`
			SELECT user_id, first_name, is_active
			FROM users
			WHERE email = ?
			LIMIT 1
		`).bind(email).first();

        // Always return success message for security (don't reveal if email exists)
        // This prevents email enumeration attacks
        const genericMessage = 'If your email is registered, you will receive a password reset link shortly.';

        if (!user || user.is_active !== 1) {
            return new Response(
                JSON.stringify({ success: true, message: genericMessage }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Generate reset token (32-byte random string)
        const resetToken = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '');
        const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

        // Invalidate old tokens and store new one
        await env.DB.prepare(`
			UPDATE password_resets
			SET used = 2
			WHERE user_id = ? AND used = 0
		`).bind(user.user_id).run();

        await env.DB.prepare(`
			INSERT INTO password_resets (user_id, token, expires_at, created_at)
			VALUES (?, ?, ?, datetime('now'))
		`).bind(user.user_id, resetToken, tokenExpiry).run();

        // TODO: Send reset email via Cloudflare Email Workers
        // For now, we'll log it (in production, integrate with email service)
        console.log(`Password reset token for ${email}: ${resetToken}`);
        console.log(`Reset link: ${env.APP_URL || 'https://tsharok.com'}/reset-password.html?token=${resetToken}`);

        // Log activity
        await env.DB.prepare(`
			INSERT INTO activity_logs (user_id, action, description, created_at)
			VALUES (?, 'password_reset_request', ?, datetime('now'))
		`).bind(user.user_id, 'Password reset requested').run();

        return new Response(
            JSON.stringify({ success: true, message: genericMessage }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Forgot password error:', error);
        return new Response(
            JSON.stringify({ success: false, message: 'Failed to process request', error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * Handle POST /api/reset-password
 * Reset password using token
 */
export async function handleResetPassword(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    try {
        const data = (await request.json()) as any;

        if (!data.token || !data.password || !data.confirmPassword) {
            return new Response(
                JSON.stringify({ success: false, message: 'Token, password, and confirmPassword are required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const { token, password, confirmPassword } = data;

        // Validate passwords match
        if (password !== confirmPassword) {
            return new Response(
                JSON.stringify({ success: false, message: 'Passwords do not match' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Validate password strength (minimum 8 characters)
        if (password.length < 8) {
            return new Response(
                JSON.stringify({ success: false, message: 'Password must be at least 8 characters long' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Verify token
        const reset = await env.DB.prepare(`
			SELECT pr.*, u.email, u.first_name
			FROM password_resets pr
			INNER JOIN users u ON pr.user_id = u.user_id
			WHERE pr.token = ? 
			AND pr.used = 0 
			AND pr.expires_at > datetime('now')
			LIMIT 1
		`).bind(token).first();

        if (!reset) {
            return new Response(
                JSON.stringify({ success: false, message: 'Invalid or expired reset token. Please request a new password reset.' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Hash password (SHA-256 as used in the existing system)
        const encoder = new TextEncoder();
        const passwordData = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', passwordData);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // Update password
        await env.DB.prepare(`
			UPDATE users 
			SET password_hash = ?, updated_at = datetime('now')
			WHERE user_id = ?
		`).bind(hashedPassword, reset.user_id).run();

        // Mark token as used
        await env.DB.prepare(`
			UPDATE password_resets 
			SET used = 1, used_at = datetime('now')
			WHERE token = ?
		`).bind(token).run();

        // Log activity
        await env.DB.prepare(`
			INSERT INTO activity_logs (user_id, action, description, created_at)
			VALUES (?, 'password_reset', 'Password was reset successfully', datetime('now'))
		`).bind(reset.user_id).run();

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Password has been reset successfully. You can now login with your new password.'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Reset password error:', error);
        return new Response(
            JSON.stringify({ success: false, message: 'Failed to reset password', error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * Handle GET /api/verify-email?token=X
 * Verify email address
 */
export async function handleVerifyEmail(url: URL, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    try {
        const token = url.searchParams.get('token');

        if (!token) {
            return new Response(
                JSON.stringify({ success: false, message: 'Verification token is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Find verification record
        const verification = await env.DB.prepare(`
			SELECT ev.*, u.email, u.first_name, u.is_active
			FROM email_verifications ev
			INNER JOIN users u ON ev.user_id = u.user_id
			WHERE ev.token = ? AND ev.verified = 0
			LIMIT 1
		`).bind(token).first();

        if (!verification) {
            return new Response(
                JSON.stringify({ success: false, message: 'Invalid or already used verification link' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Check if already verified
        if (verification.is_active === 1) {
            return new Response(
                JSON.stringify({ success: true, message: 'Your account is already verified. You can login now.' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Check if token expired
        if (new Date(verification.expires_at as string) < new Date()) {
            return new Response(
                JSON.stringify({ success: false, message: 'Verification link has expired. Please request a new one.' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Mark as verified
        await env.DB.prepare(`
			UPDATE email_verifications 
			SET verified = 1, verified_at = datetime('now')
			WHERE token = ?
		`).bind(token).run();

        // Activate user account
        await env.DB.prepare(`
			UPDATE users 
			SET is_active = 1, updated_at = datetime('now')
			WHERE user_id = ?
		`).bind(verification.user_id).run();

        // Log activity
        await env.DB.prepare(`
			INSERT INTO activity_logs (user_id, action, description, created_at)
			VALUES (?, 'verify_email', 'Email verified successfully', datetime('now'))
		`).bind(verification.user_id).run();

        // TODO: Send welcome email

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Email verified successfully! You can now login.'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Verify email error:', error);
        return new Response(
            JSON.stringify({ success: false, message: 'Email verification failed', error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * Handle POST /api/resend-verification
 * Resend verification email
 */
export async function handleResendVerification(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    try {
        const data = (await request.json()) as any;

        if (!data.email) {
            return new Response(
                JSON.stringify({ success: false, message: 'Email is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const email = data.email.toLowerCase().trim();

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return new Response(
                JSON.stringify({ success: false, message: 'Invalid email address' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Check if user exists
        const user = await env.DB.prepare(`
			SELECT user_id, first_name, is_active
			FROM users
			WHERE email = ?
			LIMIT 1
		`).bind(email).first();

        if (!user) {
            // Don't reveal if email exists for security
            return new Response(
                JSON.stringify({ success: true, message: 'If your email is registered, you will receive a verification link.' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (user.is_active === 1) {
            return new Response(
                JSON.stringify({ success: false, message: 'Your account is already verified.' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Generate new token
        const newToken = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '');
        const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

        // Invalidate old tokens
        await env.DB.prepare(`
			UPDATE email_verifications
			SET verified = 2
			WHERE user_id = ? AND verified = 0
		`).bind(user.user_id).run();

        // Insert new token
        await env.DB.prepare(`
			INSERT INTO email_verifications (user_id, token, expires_at, created_at)
			VALUES (?, ?, ?, datetime('now'))
		`).bind(user.user_id, newToken, tokenExpiry).run();

        // TODO: Send verification email
        console.log(`Verification token for ${email}: ${newToken}`);
        console.log(`Verification link: ${env.APP_URL || 'https://tsharok.com'}/verify-email.html?token=${newToken}`);

        return new Response(
            JSON.stringify({ success: true, message: 'Verification email sent successfully. Please check your inbox.' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Resend verification error:', error);
        return new Response(
            JSON.stringify({ success: false, message: 'Failed to resend verification email', error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * Helper function to extract user ID from JWT token
 */
function getUserIdFromToken(token: string): number | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            // Simple numeric token
            const userId = parseInt(token);
            return isNaN(userId) ? null : userId;
        }

        // JWT token
        const payload = parts[1];
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        const data = JSON.parse(decoded);

        return parseInt(data.userId || data.user_id || data.sub || data.id || '0');
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
}
