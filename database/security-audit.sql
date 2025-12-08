-- Security Audit Queries
-- Tsharok LMS - Check for potential security issues

-- ============================================
-- USER SECURITY CHECKS
-- ============================================

-- Check for users with weak passwords (less than 8 characters in hash - shouldn't happen with bcrypt)
SELECT 
    user_id, 
    username, 
    email,
    LENGTH(password_hash) as hash_length,
    created_at
FROM users
WHERE LENGTH(password_hash) < 60
ORDER BY created_at DESC;

-- Check for inactive but not deleted users
SELECT 
    user_id,
    username,
    email,
    role,
    is_active,
    last_login,
    created_at
FROM users
WHERE is_active = 0
ORDER BY last_login DESC;

-- Check for users with multiple active sessions
SELECT 
    u.user_id,
    u.username,
    u.email,
    COUNT(us.session_id) as active_sessions
FROM users u
INNER JOIN user_sessions us ON u.user_id = us.user_id
WHERE us.is_active = 1 AND us.expires_at > NOW()
GROUP BY u.user_id
HAVING active_sessions > 3
ORDER BY active_sessions DESC;

-- ============================================
-- CONTENT SECURITY CHECKS
-- ============================================

-- Check for content uploaded but never approved or rejected
SELECT 
    c.id,
    c.title,
    c.type,
    c.file_url,
    c.is_approved,
    c.upload_date,
    DATEDIFF(NOW(), c.upload_date) as days_pending,
    u.username as uploader
FROM content c
INNER JOIN users u ON c.uploader_id = u.user_id
WHERE c.is_approved = 0 AND DATEDIFF(NOW(), c.upload_date) > 30
ORDER BY c.upload_date ASC;

-- Check for suspicious file uploads (very large files)
SELECT 
    c.id,
    c.title,
    c.type,
    c.file_size,
    ROUND(c.file_size / 1024 / 1024, 2) as size_mb,
    c.mime_type,
    c.upload_date,
    u.username as uploader
FROM content c
INNER JOIN users u ON c.uploader_id = u.user_id
WHERE c.file_size > 100 * 1024 * 1024 -- > 100MB
ORDER BY c.file_size DESC;

-- ============================================
-- AUTHENTICATION SECURITY CHECKS
-- ============================================

-- Check for expired sessions that are still marked active
SELECT 
    session_id,
    user_id,
    session_token,
    expires_at,
    created_at,
    last_activity,
    is_active
FROM user_sessions
WHERE is_active = 1 AND expires_at < NOW()
ORDER BY expires_at DESC;

-- Check for old password reset tokens not used
SELECT 
    id,
    user_id,
    token,
    expires_at,
    created_at,
    used_at
FROM password_resets
WHERE used_at IS NULL AND expires_at < NOW()
ORDER BY created_at DESC;

-- Check for unverified email accounts older than 7 days
SELECT 
    ev.id,
    ev.user_id,
    u.username,
    u.email,
    ev.created_at,
    DATEDIFF(NOW(), ev.created_at) as days_unverified
FROM email_verifications ev
INNER JOIN users u ON ev.user_id = u.user_id
WHERE ev.verified_at IS NULL 
AND DATEDIFF(NOW(), ev.created_at) > 7
ORDER BY ev.created_at ASC;

-- ============================================
-- ADMIN ACTIONS AUDIT
-- ============================================

-- Check recent admin actions (last 7 days)
SELECT 
    aa.id,
    aa.action_type,
    aa.target_type,
    aa.target_id,
    aa.timestamp,
    aa.description,
    u.username as admin_username,
    u.email as admin_email
FROM admin_actions aa
INNER JOIN users u ON aa.admin_id = u.user_id
WHERE aa.timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY aa.timestamp DESC
LIMIT 100;

-- Check for bulk rejections (potential abuse)
SELECT 
    aa.admin_id,
    u.username,
    COUNT(*) as rejection_count,
    DATE(aa.timestamp) as date
FROM admin_actions aa
INNER JOIN users u ON aa.admin_id = u.user_id
WHERE aa.action_type = 'reject'
AND aa.timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY aa.admin_id, DATE(aa.timestamp)
HAVING rejection_count > 20
ORDER BY rejection_count DESC;

-- ============================================
-- ACTIVITY LOGS AUDIT
-- ============================================

-- Check for failed login attempts
SELECT 
    log_id,
    user_id,
    action,
    description,
    ip_address,
    created_at
FROM activity_logs
WHERE action = 'login_failed'
AND created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
ORDER BY created_at DESC;

-- Check for suspicious activity from same IP
SELECT 
    ip_address,
    COUNT(DISTINCT user_id) as different_users,
    COUNT(*) as total_actions,
    GROUP_CONCAT(DISTINCT action) as actions
FROM activity_logs
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
GROUP BY ip_address
HAVING different_users > 5 OR total_actions > 100
ORDER BY total_actions DESC;

-- ============================================
-- DATABASE INTEGRITY CHECKS
-- ============================================

-- Check for orphaned content (course deleted)
SELECT 
    c.id,
    c.title,
    c.course_id,
    c.upload_date
FROM content c
LEFT JOIN courses co ON c.course_id = co.course_id
WHERE co.course_id IS NULL;

-- Check for orphaned enrollments (course or student deleted)
SELECT 
    e.enrollment_id,
    e.student_id,
    e.course_id,
    e.enrollment_date
FROM enrollments e
LEFT JOIN users u ON e.student_id = u.user_id
LEFT JOIN courses c ON e.course_id = c.course_id
WHERE u.user_id IS NULL OR c.course_id IS NULL;

-- Check for orphaned ratings
SELECT 
    r.id,
    r.user_id,
    r.content_id,
    r.created_at
FROM ratings r
LEFT JOIN users u ON r.user_id = u.user_id
LEFT JOIN content c ON r.content_id = c.id
WHERE u.user_id IS NULL OR c.id IS NULL;

-- ============================================
-- RECOMMENDATIONS
-- ============================================

-- Cleanup orphaned records
-- DELETE FROM content WHERE course_id NOT IN (SELECT course_id FROM courses);
-- DELETE FROM enrollments WHERE student_id NOT IN (SELECT user_id FROM users);

-- Deactivate old expired sessions
-- UPDATE user_sessions SET is_active = 0 WHERE is_active = 1 AND expires_at < NOW();

-- Delete old unverified accounts
-- DELETE FROM users WHERE user_id IN (
--   SELECT user_id FROM email_verifications 
--   WHERE verified_at IS NULL AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
-- );

SELECT '=== Security Audit Complete ===' as status;
SELECT 'Review results above for potential security issues' as recommendation;

