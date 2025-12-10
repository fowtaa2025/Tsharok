// File Upload API - Upload files to R2
// Requires authentication

import { verifyToken } from './auth';

interface Env {
    R2_BUCKET: R2Bucket;
    R2_PUBLIC_URL: string;
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

// POST /api/upload - Upload file to R2
export async function onRequestPost(context: any) {
    const { request, env } = context as { request: Request; env: Env };

    try {
        // 1. Verify authentication
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return jsonError('Unauthorized - No token provided', 401);
        }

        const user = await verifyToken(token, env.JWT_SECRET);
        if (!user) {
            return jsonError('Unauthorized - Invalid token', 401);
        }

        // 2. Get file from form data
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return jsonError('No file provided', 400);
        }

        // 3. Validate file type
        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/gif',
            'video/mp4',
            'video/webm',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (!allowedTypes.includes(file.type)) {
            return jsonError(`File type not allowed: ${file.type}`, 400);
        }

        // 4. Validate file size (max 100MB)
        const maxSize = 100 * 1024 * 1024; // 100MB
        if (file.size > maxSize) {
            return jsonError('File too large (max 100MB)', 400);
        }

        // 5. Generate unique key
        const timestamp = Date.now();
        const randomId = crypto.randomUUID();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const key = `uploads/${user.userId}/${timestamp}-${randomId}-${sanitizedName}`;

        // 6. Upload to R2
        await env.R2_BUCKET.put(key, file.stream(), {
            httpMetadata: {
                contentType: file.type,
            },
            customMetadata: {
                uploadedBy: user.userId.toString(),
                uploadedAt: new Date().toISOString(),
                originalName: file.name,
                fileSize: file.size.toString(),
            }
        });

        // 7. Save to database
        const courseId = formData.get('courseId') || null;
        const title = formData.get('title') || file.name;
        const description = formData.get('description') || null;

        // Determine content type
        let contentType = 'other';
        if (file.type.startsWith('image/')) contentType = 'document';
        else if (file.type.startsWith('video/')) contentType = 'video';
        else if (file.type === 'application/pdf') contentType = 'document';
        else if (file.type.includes('presentation')) contentType = 'lecture';

        const result = await env.DB.prepare(`
      INSERT INTO content (
        title, type, file_url, file_key, upload_date, 
        uploader_id, course_id, file_size, mime_type, 
        description, is_approved, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, datetime('now'), ?, ?, ?, ?, ?, 0, datetime('now'), datetime('now'))
    `).bind(
            title,
            contentType,
            `${env.R2_PUBLIC_URL}/${key}`,
            key,
            user.userId,
            courseId,
            file.size,
            file.type,
            description
        ).run();

        return jsonResponse({
            success: true,
            message: 'File uploaded successfully',
            file: {
                id: result.meta.last_row_id,
                key,
                filename: file.name,
                size: file.size,
                type: file.type,
                url: `${env.R2_PUBLIC_URL}/${key}`,
                uploadedAt: new Date().toISOString()
            }
        });

    } catch (error: any) {
        console.error('Upload error:', error);
        return jsonError(error.message || 'Upload failed', 500);
    }
}
