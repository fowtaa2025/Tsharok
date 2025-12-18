/**
 * Content Management Handlers for Tsharok API
 * Handles file uploads, downloads, and content interactions
 */

// Define Env interface to match the main worker
interface Env {
    DB: D1Database;
    BUCKET: R2Bucket;
}

/**
 * Handle POST /api/content-interactions
 * Track downloads, views, and helpful marks
 */
export async function handleContentInteractions(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    try {
        const data = (await request.json()) as any;

        if (!data.action || !data.contentId) {
            return new Response(
                JSON.stringify({ success: false, message: 'action and contentId are required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const action = data.action; // 'download', 'view', 'helpful'
        const contentId = parseInt(data.contentId);
        const userId = parseInt(data.userId || '0');

        switch (action) {
            case 'download':
                return await recordDownload(contentId, userId, env, corsHeaders);

            case 'view':
                return await recordView(contentId, userId, env, corsHeaders);

            case 'helpful':
                return await markHelpful(contentId, userId, env, corsHeaders);

            default:
                return new Response(
                    JSON.stringify({ success: false, message: 'Invalid action. Allowed: download, view, helpful' }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
        }
    } catch (error: any) {
        console.error('Content interaction error:', error);
        return new Response(
            JSON.stringify({ success: false, message: 'Failed to process interaction', error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * Record download of content
 */
async function recordDownload(contentId: number, userId: number, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    try {
        // Verify content exists and is approved
        const content = await env.DB.prepare(`
			SELECT id, title, file_url, file_key
			FROM content
			WHERE id = ? AND is_approved = 1
		`).bind(contentId).first();

        if (!content) {
            return new Response(
                JSON.stringify({ success: false, message: 'Content not found or not approved' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Record download if user is logged in
        if (userId > 0) {
            await env.DB.prepare(`
				INSERT INTO downloads (user_id, content_id, downloaded_at)
				VALUES (?, ?, datetime('now'))
			`).bind(userId, contentId).run();
        }

        // Get file URL (from R2 or construct it)
        const fileUrl = content.file_url || `https://pub-cd42bce9da7242b69d703b8bf1e9e4b6.r2.dev/${content.file_key}`;

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Download recorded successfully',
                data: {
                    fileUrl: fileUrl,
                    filename: content.title,
                    contentId: contentId
                }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Record download error:', error);
        return new Response(
            JSON.stringify({ success: false, message: 'Failed to record download', error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * Record view of content
 */
async function recordView(contentId: number, userId: number, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    try {
        // Create/update a views table entry
        // For now, we'll use activity_logs
        if (userId > 0) {
            await env.DB.prepare(`
				INSERT INTO activity_logs (user_id, action, description, created_at)
				VALUES (?, 'content_view', ?, datetime('now'))
			`).bind(userId, `Viewed content ID: ${contentId}`).run();
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: 'View recorded successfully'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Record view error:', error);
        return new Response(
            JSON.stringify({ success: false, message: 'Failed to record view', error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * Mark content as helpful
 */
async function markHelpful(contentId: number, userId: number, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    try {
        if (userId <= 0) {
            return new Response(
                JSON.stringify({ success: false, message: 'Authentication required' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Check if already marked helpful (using ratings table with a special marker)
        const existing = await env.DB.prepare(`
			SELECT id FROM ratings
			WHERE user_id = ? AND content_id = ? AND score = 5
		`).bind(userId, contentId).first();

        if (existing) {
            return new Response(
                JSON.stringify({ success: false, message: 'Already marked as helpful' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Mark as helpful (score 5 with no comment means "helpful")
        await env.DB.prepare(`
			INSERT INTO ratings (user_id, content_id, score, created_at)
			VALUES (?, ?, 5, datetime('now'))
		`).bind(userId, contentId).run();

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Content marked as helpful'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Mark helpful error:', error);
        return new Response(
            JSON.stringify({ success: false, message: 'Failed to mark as helpful', error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * Handle POST /api/content-upload
 * Upload content with full metadata to D1 and R2
 */
export async function handleContentUpload(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    try {
        const formData = await request.formData();

        // Get form fields
        const file = formData.get('file') as File;
        const title = formData.get('title') as string;
        const courseId = formData.get('courseId') as string;
        const userId = formData.get('userId') as string;
        const description = formData.get('description') as string || '';
        const type = formData.get('type') as string || 'document';

        // Validate required fields
        if (!file || !title || !userId) {
            return new Response(
                JSON.stringify({ success: false, message: 'file, title, and userId are required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Validate file size (100MB max)
        const maxSize = 100 * 1024 * 1024;
        if (file.size > maxSize) {
            return new Response(
                JSON.stringify({ success: false, message: `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB` }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Validate file type
        const allowedTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain', 'application/zip', 'application/x-rar-compressed',
            'video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm'
        ];

        if (!allowedTypes.includes(file.type)) {
            return new Response(
                JSON.stringify({ success: false, message: `File type not allowed: ${file.type}` }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Generate unique filename
        const timestamp = Date.now();
        const extension = file.name.split('.').pop();
        const r2Key = courseId
            ? `uploads/${courseId}/${timestamp}-${file.name}`
            : `uploads/${timestamp}-${file.name}`;

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
				type, file_url, file_key, file_size, mime_type,
				is_approved, upload_date
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
		`).bind(
            courseId || null,
            userId,
            title,
            description,
            type,
            fileUrl,
            r2Key,
            file.size,
            file.type
        ).run();

        // Log activity
        await env.DB.prepare(`
			INSERT INTO activity_logs (user_id, action, description, created_at)
			VALUES (?, 'content_upload', ?, datetime('now'))
		`).bind(userId, `Uploaded "${title}"`).run();

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Content uploaded successfully',
                data: {
                    id: result.meta.last_row_id,
                    title: title,
                    fileUrl: fileUrl,
                    r2Key: r2Key,
                    size: file.size,
                    type: file.type
                }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Content upload error:', error);
        return new Response(
            JSON.stringify({ success: false, message: 'Upload failed', error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * Handle POST /api/file-upload-handler
 * Enhanced upload with validation and image processing support
 * This is a simplified version - full image processing would require additional libraries
 */
export async function handleFileUploadHandler(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    try {
        const formData = await request.formData();

        // Get form fields
        const file = formData.get('file') as File;
        const uploadType = (formData.get('upload_type') as string) || 'content';
        const courseId = formData.get('course_id') as string || null;
        const userId = (formData.get('user_id') as string) || '0';

        // Validate
        if (!file) {
            return new Response(
                JSON.stringify({ success: false, message: 'No file was uploaded' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // File size validation based on type
        const maxSizes = {
            image: 10 * 1024 * 1024, // 10MB
            video: 500 * 1024 * 1024, // 500MB
            document: 50 * 1024 * 1024, // 50MB
            default: 100 * 1024 * 1024  // 100MB
        };

        const fileType = file.type.startsWith('image/') ? 'image' :
            file.type.startsWith('video/') ? 'video' :
                'document';

        const maxSize = maxSizes[fileType] || maxSizes.default;

        if (file.size > maxSize) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB for ${fileType}s`
                }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        //Generate unique filename
        const timestamp = Date.now();
        const random = crypto.randomUUID().split('-')[0];
        const extension = file.name.split('.').pop();
        const uniqueFilename = `${userId}_${timestamp}_${random}.${extension}`;

        // Determine R2 key based on upload type
        let r2Key: string;
        switch (uploadType) {
            case 'profile':
                r2Key = `profiles/${uniqueFilename}`;
                break;
            case 'thumbnail':
                r2Key = `thumbnails/${uniqueFilename}`;
                break;
            default:
                r2Key = courseId ? `uploads/${courseId}/${uniqueFilename}` : `uploads/${uniqueFilename}`;
        }

        // Upload to R2
        await env.BUCKET.put(r2Key, file.stream(), {
            httpMetadata: {
                contentType: file.type,
            },
            customMetadata: {
                'upload-type': uploadType,
                'user-id': userId,
                'uploaded-at': new Date().toISOString()
            }
        });

        // Get public URL
        const fileUrl = `https://pub-cd42bce9da7242b69d703b8bf1e9e4b6.r2.dev/${r2Key}`;

        return new Response(
            JSON.stringify({
                success: true,
                message: 'File uploaded successfully',
                data: {
                    files: {
                        original: {
                            filename: uniqueFilename,
                            path: r2Key,
                            r2_key: r2Key,
                            url: fileUrl,
                            size: file.size,
                            storage_type: 'r2'
                        }
                    },
                    file_info: {
                        original_name: file.name,
                        size: file.size,
                        type: file.type,
                        extension: extension
                    },
                    upload_type: uploadType
                }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('File upload handler error:', error);
        return new Response(
            JSON.stringify({ success: false, message: 'Upload failed', error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}
