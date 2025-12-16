/**
 * Tsharok API - Cloudflare Worker
 * Handles backend API requests for the Tsharok LMS
 */

export interface Env {
	DB: D1Database;
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
			// Route: GET /api/view-materials?course_id=1
			if (url.pathname === '/api/view-materials' && request.method === 'GET') {
				return await handleViewMaterials(url, env, corsHeaders);
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
		// Query D1 database - simplified without user join for now
		const result = await env.DB.prepare(`
			SELECT 
				id,
				title,
				type,
				file_url,
				upload_date,
				description,
				file_size,
				mime_type,
				is_approved,
				uploader_id
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
