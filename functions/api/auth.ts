// Authentication API - Login and Register
// Uses D1 database and JWT tokens with Web Crypto API

interface Env {
    DB: D1Database;
    JWT_SECRET: string;
}

// Helper functions
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

// Simple password hashing (for demo - use bcrypt in production)
async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
    const passwordHash = await hashPassword(password);
    return passwordHash === hash;
}

// Base64 URL encoding helper
function base64UrlEncode(str: string): string {
    return btoa(str)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

// Generate JWT token using Web Crypto API
async function generateToken(user: any, secret: string): Promise<string> {
    const header = {
        alg: 'HS256',
        typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
        userId: user.user_id,
        email: user.email,
        role: user.role,
        iat: now,
        exp: now + (24 * 60 * 60) // 24 hours
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const data = `${encodedHeader}.${encodedPayload}`;

    // Create signature using HMAC SHA-256
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(data)
    );

    const encodedSignature = base64UrlEncode(
        String.fromCharCode(...new Uint8Array(signature))
    );

    return `${data}.${encodedSignature}`;
}

// Verify JWT token using Web Crypto API
export async function verifyToken(token: string, secret: string): Promise<any> {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const [encodedHeader, encodedPayload, encodedSignature] = parts;
        const data = `${encodedHeader}.${encodedPayload}`;

        // Verify signature
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['verify']
        );

        const signature = Uint8Array.from(
            atob(encodedSignature.replace(/-/g, '+').replace(/_/g, '/')),
            c => c.charCodeAt(0)
        );

        const isValid = await crypto.subtle.verify(
            'HMAC',
            key,
            signature,
            encoder.encode(data)
        );

        if (!isValid) return null;

        // Decode and verify payload
        const payload = JSON.parse(
            atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/'))
        );

        // Check expiration
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) return null;

        return payload;
    } catch {
        return null;
    }
}

// POST /api/auth - Login
export async function onRequestPost(context: any) {
    const { request, env } = context as { request: Request; env: Env };

    try {
        const body = await request.json();
        const { email, password, action } = body;

        // Handle registration
        if (action === 'register') {
            const { firstName, lastName } = body;

            if (!email || !password || !firstName || !lastName) {
                return jsonError('All fields are required', 400);
            }

            // Check if user exists
            const existing = await env.DB.prepare(
                'SELECT user_id FROM users WHERE email = ?'
            ).bind(email).first();

            if (existing) {
                return jsonError('Email already registered', 400);
            }

            // Create user
            const passwordHash = await hashPassword(password);
            const username = email.split('@')[0];

            const result = await env.DB.prepare(`
        INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'student', 1, datetime('now'), datetime('now'))
      `).bind(username, email, passwordHash, firstName, lastName).run();

            // Get the created user
            const user = await env.DB.prepare(
                'SELECT user_id, username, email, first_name, last_name, role FROM users WHERE email = ?'
            ).bind(email).first();

            const token = await generateToken(user, env.JWT_SECRET);

            return jsonResponse({
                success: true,
                message: 'Registration successful!',
                token,
                user: {
                    userId: user.user_id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    role: user.role
                }
            });
        }

        // Handle login
        if (!email || !password) {
            return jsonError('Email and password are required', 400);
        }

        // Find user
        const user = await env.DB.prepare(
            'SELECT * FROM users WHERE email = ? AND is_active = 1'
        ).bind(email).first();

        if (!user) {
            return jsonError('Invalid credentials', 401);
        }

        // Verify password
        const isValid = await verifyPassword(password, user.password_hash as string);
        if (!isValid) {
            return jsonError('Invalid credentials', 401);
        }

        // Update last login
        await env.DB.prepare(
            'UPDATE users SET last_login = datetime(\'now\') WHERE user_id = ?'
        ).bind(user.user_id).run();

        // Generate token
        const token = await generateToken(user, env.JWT_SECRET);

        return jsonResponse({
            success: true,
            message: 'Login successful!',
            token,
            user: {
                userId: user.user_id,
                username: user.username,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
                profileImage: user.profile_image
            }
        });

    } catch (error: any) {
        console.error('Auth error:', error);
        return jsonError(error.message || 'Authentication failed', 500);
    }
}

// GET /api/auth - Verify token
export async function onRequestGet(context: any) {
    const { request, env } = context as { request: Request; env: Env };

    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return jsonError('No token provided', 401);
        }

        const payload = await verifyToken(token, env.JWT_SECRET);

        if (!payload) {
            return jsonError('Invalid token', 401);
        }

        // Get fresh user data
        const user = await env.DB.prepare(
            'SELECT user_id, username, email, first_name, last_name, role, profile_image FROM users WHERE user_id = ? AND is_active = 1'
        ).bind(payload.userId).first();

        if (!user) {
            return jsonError('User not found', 404);
        }

        return jsonResponse({
            success: true,
            user: {
                userId: user.user_id,
                username: user.username,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
                profileImage: user.profile_image
            }
        });

    } catch (error: any) {
        return jsonError('Token verification failed', 401);
    }
}
