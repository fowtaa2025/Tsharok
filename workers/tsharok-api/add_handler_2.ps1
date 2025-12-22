# Add all remaining Phase 3 handlers
$targetPath = "C:\xampp\htdocs\Tsharok\workers\tsharok-api\src\index.ts"
$current = Get-Content $targetPath -Raw

$allHandlers = @'

/**
 * Handle GET /api/ratings?contentId=X
 */
async function handleGetRatings(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
	const url = new URL(request.url);
	const contentId = url.searchParams.get('contentId');
	if (!contentId) {
		return new Response(
			JSON.stringify({ success: false, message: 'contentId parameter is required' }),
			{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	}
	try {
		const result = await env.DB.prepare(`SELECT AVG(score) as averageRating, COUNT(*) as totalRatings FROM ratings WHERE content_id = ?`).bind(contentId).first();
		const averageRating = result ? (result.averageRating as number) || 0 : 0;
		const totalRatings = result ? (result.totalRatings as number) || 0 : 0;
		return new Response(
			JSON.stringify({ success: true, message: 'Ratings retrieved successfully', data: { averageRating, totalRatings } }),
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
'@

Set-Content $targetPath -Value ($current + $allHandlers)
Write-Host "✅ 2/10: Added handleGetRatings" -ForegroundColor Green
