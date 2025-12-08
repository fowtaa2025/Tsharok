-- Security & Performance Audit Script
-- Tsharok LMS - Check database configuration and security compliance
-- Run this script to audit your database setup

USE tsharok;

-- ============================================
-- 1. Check Database Engine
-- ============================================

SELECT 
    TABLE_NAME,
    ENGINE,
    TABLE_COLLATION
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'tsharok'
ORDER BY TABLE_NAME;

-- ============================================
-- 2. Check Character Set and Collation
-- ============================================

SELECT 
    DEFAULT_CHARACTER_SET_NAME,
    DEFAULT_COLLATION_NAME
FROM information_schema.SCHEMATA
WHERE SCHEMA_NAME = 'tsharok';

-- ============================================
-- 3. Check for Missing Indexes
-- ============================================

-- Tables without primary keys (should be none)
SELECT 
    t.TABLE_NAME
FROM information_schema.TABLES t
LEFT JOIN information_schema.TABLE_CONSTRAINTS tc
    ON t.TABLE_SCHEMA = tc.TABLE_SCHEMA
    AND t.TABLE_NAME = tc.TABLE_NAME
    AND tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
WHERE t.TABLE_SCHEMA = 'tsharok'
    AND t.TABLE_TYPE = 'BASE TABLE'
    AND tc.CONSTRAINT_NAME IS NULL;

-- Foreign keys without indexes
SELECT 
    kcu.TABLE_NAME,
    kcu.COLUMN_NAME,
    kcu.CONSTRAINT_NAME
FROM information_schema.KEY_COLUMN_USAGE kcu
WHERE kcu.TABLE_SCHEMA = 'tsharok'
    AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
    AND NOT EXISTS (
        SELECT 1
        FROM information_schema.STATISTICS s
        WHERE s.TABLE_SCHEMA = kcu.TABLE_SCHEMA
            AND s.TABLE_NAME = kcu.TABLE_NAME
            AND s.COLUMN_NAME = kcu.COLUMN_NAME
            AND s.SEQ_IN_INDEX = 1
    );

-- ============================================
-- 4. Check Index Usage
-- ============================================

SELECT 
    TABLE_NAME,
    INDEX_NAME,
    CARDINALITY,
    INDEX_TYPE
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'tsharok'
    AND INDEX_NAME != 'PRIMARY'
ORDER BY TABLE_NAME, INDEX_NAME;

-- ============================================
-- 5. Check for NULL Values in Important Columns
-- ============================================

-- Check users table
SELECT 
    COUNT(*) as null_email_count
FROM users
WHERE email IS NULL OR email = '';

SELECT 
    COUNT(*) as null_username_count
FROM users
WHERE username IS NULL OR username = '';

-- Check courses table
SELECT 
    COUNT(*) as courses_without_instructor
FROM courses
WHERE instructor_id IS NULL;

-- ============================================
-- 6. Check Password Security
-- ============================================

-- Check for weak password hashes (should all use bcrypt/argon2)
SELECT 
    user_id,
    username,
    LENGTH(password_hash) as hash_length,
    SUBSTRING(password_hash, 1, 7) as hash_prefix
FROM users
WHERE LENGTH(password_hash) < 60 -- bcrypt hashes should be 60 chars
LIMIT 10;

-- ============================================
-- 7. Check User Account Security
-- ============================================

-- Check for inactive/unverified accounts older than 30 days
SELECT 
    COUNT(*) as unverified_old_accounts
FROM users
WHERE is_active = 0
    AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Check for accounts without last login
SELECT 
    COUNT(*) as never_logged_in
FROM users
WHERE last_login IS NULL
    AND is_active = 1;

-- ============================================
-- 8. Check Session Security
-- ============================================

-- Check for expired active sessions
SELECT 
    COUNT(*) as expired_active_sessions
FROM sessions
WHERE is_active = 1
    AND expires_at < NOW();

-- ============================================
-- 9. Check File Upload Security
-- ============================================

-- Check for suspicious file types
SELECT 
    type,
    mime_type,
    COUNT(*) as count
FROM content
WHERE mime_type LIKE '%script%'
    OR mime_type LIKE '%executable%'
GROUP BY type, mime_type;

-- ============================================
-- 10. Check Data Integrity
-- ============================================

-- Orphaned enrollments (user or course deleted)
SELECT COUNT(*) as orphaned_enrollments
FROM enrollments e
LEFT JOIN users u ON e.user_id = u.user_id
LEFT JOIN courses c ON e.course_id = c.course_id
WHERE u.user_id IS NULL OR c.course_id IS NULL;

-- Orphaned content (uploader deleted)
SELECT COUNT(*) as orphaned_content
FROM content ct
LEFT JOIN users u ON ct.uploader_id = u.user_id
WHERE u.user_id IS NULL;

-- Orphaned ratings
SELECT COUNT(*) as orphaned_ratings
FROM ratings r
LEFT JOIN users u ON r.user_id = u.user_id
WHERE u.user_id IS NULL;

-- ============================================
-- 11. Check for Performance Issues
-- ============================================

-- Large tables without indexes on foreign keys
SELECT 
    t.TABLE_NAME,
    t.TABLE_ROWS,
    t.AVG_ROW_LENGTH,
    ROUND(((t.DATA_LENGTH + t.INDEX_LENGTH) / 1024 / 1024), 2) AS size_mb
FROM information_schema.TABLES t
WHERE t.TABLE_SCHEMA = 'tsharok'
    AND t.TABLE_ROWS > 1000
ORDER BY t.TABLE_ROWS DESC;

-- ============================================
-- 12. Check FULLTEXT Indexes
-- ============================================

SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'tsharok'
    AND INDEX_TYPE = 'FULLTEXT'
ORDER BY TABLE_NAME;

-- ============================================
-- 13. Security Recommendations
-- ============================================

-- This section shows recommended improvements
SELECT 'AUDIT COMPLETE' as Status,
       'Review the results above for security and performance issues' as Recommendation;

-- Add recommendations for missing indexes
SELECT 
    'ADD INDEX' as Action,
    CONCAT('ADD INDEX idx_', LOWER(TABLE_NAME), '_', LOWER(COLUMN_NAME), 
           ' ON ', TABLE_NAME, '(', COLUMN_NAME, ')') as SQL_Command
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'tsharok'
    AND COLUMN_KEY = ''
    AND COLUMN_NAME LIKE '%_id'
    AND TABLE_NAME NOT IN ('migrations', 'sessions');

