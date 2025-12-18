/**
 * Internationalization (i18n) Handlers for Tsharok API
 * Handles multi-language support and translation management
 */

// Define Env interface to match the main worker
interface Env {
    DB: D1Database;
    BUCKET: R2Bucket;
}

/**
 * Handle GET /api/get-available-languages
 * Get list of available languages
 */
export async function handleGetAvailableLanguages(env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    try {
        const result = await env.DB.prepare(`
			SELECT 
				code,
				name,
				native_name,
				direction,
				is_active
			FROM languages
			WHERE is_active = 1
			ORDER BY name ASC
		`).all();

        const languages = result.results || [];

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Available languages retrieved successfully',
                data: {
                    languages: languages.map((lang: any) => ({
                        code: lang.code,
                        name: lang.name,
                        nativeName: lang.native_name,
                        direction: lang.direction || 'ltr',
                        isActive: lang.is_active === 1
                    })),
                    totalCount: languages.length
                }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Get available languages error:', error);
        return new Response(
            JSON.stringify({ success: false, message: 'Failed to retrieve languages', error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * Handle GET /api/get-translations?lang=en
 * Get translations for a specific language
 */
export async function handleGetTranslations(url: URL, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    try {
        const langCode = url.searchParams.get('lang') || 'en';

        // Validate language code
        const language = await env.DB.prepare(`
			SELECT code FROM languages WHERE code = ? AND is_active = 1 LIMIT 1
		`).bind(langCode).first();

        if (!language) {
            return new Response(
                JSON.stringify({ success: false, message: 'Invalid or inactive language code' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Get translations
        const result = await env.DB.prepare(`
			SELECT 
				translation_key,
				translation_value,
				category
			FROM translations
			WHERE language_code = ?
			ORDER BY category, translation_key
		`).bind(langCode).all();

        const translations = result.results || [];

        // Group translations by category
        const groupedTranslations: Record<string, Record<string, string>> = {};

        translations.forEach((trans: any) => {
            const category = trans.category || 'general';
            if (!groupedTranslations[category]) {
                groupedTranslations[category] = {};
            }
            groupedTranslations[category][trans.translation_key] = trans.translation_value;
        });

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Translations retrieved successfully',
                data: {
                    language: langCode,
                    translations: groupedTranslations,
                    totalCount: translations.length
                }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Get translations error:', error);
        return new Response(
            JSON.stringify({ success: false, message: 'Failed to retrieve translations', error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * Handle POST /api/set-language
 * Set user's preferred language
 */
export async function handleSetLanguage(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    try {
        const data = (await request.json()) as any;

        if (!data.userId || !data.languageCode) {
            return new Response(
                JSON.stringify({ success: false, message: 'userId and languageCode are required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const userId = parseInt(data.userId);
        const languageCode = data.languageCode;

        // Validate language code
        const language = await env.DB.prepare(`
			SELECT code, direction FROM languages WHERE code = ? AND is_active = 1 LIMIT 1
		`).bind(languageCode).first();

        if (!language) {
            return new Response(
                JSON.stringify({ success: false, message: 'Invalid or inactive language code' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Update user's language preference
        await env.DB.prepare(`
			UPDATE users
			SET preferred_language = ?, updated_at = datetime('now')
			WHERE user_id = ?
		`).bind(languageCode, userId).run();

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Language preference updated successfully',
                data: {
                    languageCode: language.code,
                    direction: language.direction || 'ltr'
                }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Set language error:', error);
        return new Response(
            JSON.stringify({ success: false, message: 'Failed to set language preference', error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * Handle POST /api/admin-translations
 * Admin endpoint for managing translations
 */
export async function handleAdminTranslations(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    try {
        // Verify admin role
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.includes('admin_')) {
            return new Response(
                JSON.stringify({ success: false, message: 'Admin authentication required' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const data = (await request.json()) as any;
        const action = data.action; // 'add', 'update', 'delete', 'list'

        switch (action) {
            case 'add':
            case 'update':
                return await addOrUpdateTranslation(data, env, corsHeaders);

            case 'delete':
                return await deleteTranslation(data, env, corsHeaders);

            case 'list':
                return await listAllTranslations(data, env, corsHeaders);

            default:
                return new Response(
                    JSON.stringify({ success: false, message: 'Invalid action. Allowed: add, update, delete, list' }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
        }
    } catch (error: any) {
        console.error('Admin translations error:', error);
        return new Response(
            JSON.stringify({ success: false, message: 'Failed to manage translations', error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * Add or update translation
 */
async function addOrUpdateTranslation(data: any, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    if (!data.languageCode || !data.key || !data.value) {
        return new Response(
            JSON.stringify({ success: false, message: 'languageCode, key, and value are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    const category = data.category || 'general';

    // Check if translation exists
    const existing = await env.DB.prepare(`
		SELECT id FROM translations
		WHERE language_code = ? AND translation_key = ?
	`).bind(data.languageCode, data.key).first();

    if (existing) {
        // Update existing
        await env.DB.prepare(`
			UPDATE translations
			SET translation_value = ?, category = ?, updated_at = datetime('now')
			WHERE language_code = ? AND translation_key = ?
		`).bind(data.value, category, data.languageCode, data.key).run();

        return new Response(
            JSON.stringify({ success: true, message: 'Translation updated successfully' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } else {
        // Insert new
        await env.DB.prepare(`
			INSERT INTO translations (language_code, translation_key, translation_value, category, created_at, updated_at)
			VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
		`).bind(data.languageCode, data.key, data.value, category).run();

        return new Response(
            JSON.stringify({ success: true, message: 'Translation added successfully' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * Delete translation
 */
async function deleteTranslation(data: any, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    if (!data.languageCode || !data.key) {
        return new Response(
            JSON.stringify({ success: false, message: 'languageCode and key are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    const result = await env.DB.prepare(`
		DELETE FROM translations
		WHERE language_code = ? AND translation_key = ?
	`).bind(data.languageCode, data.key).run();

    if (result.meta.changes === 0) {
        return new Response(
            JSON.stringify({ success: false, message: 'Translation not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
        JSON.stringify({ success: true, message: 'Translation deleted successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
}

/**
 * List all translations
 */
async function listAllTranslations(data: any, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    const languageCode = data.languageCode;

    let query = `
		SELECT language_code, translation_key, translation_value, category, updated_at
		FROM translations
	`;

    const params: any[] = [];

    if (languageCode) {
        query += ` WHERE language_code = ?`;
        params.push(languageCode);
    }

    query += ` ORDER BY language_code, category, translation_key`;

    const stmt = params.length > 0
        ? env.DB.prepare(query).bind(...params)
        : env.DB.prepare(query);

    const result = await stmt.all();

    return new Response(
        JSON.stringify({
            success: true,
            message: 'Translations retrieved successfully',
            data: {
                translations: result.results || [],
                totalCount: (result.results || []).length
            }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
}
