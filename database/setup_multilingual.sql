-- Setup Multilingual System
-- Tsharok LMS - Add language support

-- Add language column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS language VARCHAR(5) DEFAULT 'en' 
COMMENT 'User preferred language (en, ar, etc.)'
AFTER role;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_language ON users(language);

-- Update existing users to have default language based on their name
-- If Arabic characters detected in name, set to 'ar', otherwise 'en'
UPDATE users 
SET language = 'ar' 
WHERE (first_name REGEXP '[ء-ي]' OR last_name REGEXP '[ء-ي]')
AND (language IS NULL OR language = '');

-- Update remaining users to English
UPDATE users 
SET language = 'en' 
WHERE language IS NULL OR language = '';

-- Make sure column is not null
ALTER TABLE users 
MODIFY COLUMN language VARCHAR(5) NOT NULL DEFAULT 'en';

-- Verify setup
SELECT '=== Multilingual System Setup Complete ===' as status;

SELECT 
    language,
    COUNT(*) as user_count
FROM users
GROUP BY language;

SELECT '=== Language Preferences ===' as status;
SELECT 'en: English' as languages UNION ALL SELECT 'ar: Arabic';

SELECT '=== API Endpoints ===' as status;
SELECT 'GET /api/get-translations.php - Get translations' as endpoint
UNION ALL SELECT 'GET /api/get-available-languages.php - Get available languages'
UNION ALL SELECT 'POST /api/set-language.php - Set user language'
UNION ALL SELECT 'GET /api/admin-translations.php - Admin translation management';

