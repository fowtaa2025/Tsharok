-- ============================================
-- Tsharok Database - Verification Script
-- Run this after setup to verify everything
-- ============================================

-- Check database exists and is selected
SELECT DATABASE() as current_database;

-- ============================================
-- 1. Verify All Tables Exist
-- ============================================
SHOW TABLES;

-- Expected output: 9 tables
-- admin_actions, comments, content, courses, downloads, 
-- enrollments, majors, ratings, users

-- ============================================
-- 2. Verify Table Structures
-- ============================================

-- Check majors table
DESCRIBE majors;

-- Check users table
DESCRIBE users;

-- Check courses table
DESCRIBE courses;

-- Check enrollments table
DESCRIBE enrollments;

-- Check content table
DESCRIBE content;

-- Check ratings table
DESCRIBE ratings;

-- Check comments table
DESCRIBE comments;

-- Check downloads table
DESCRIBE downloads;

-- Check admin_actions table
DESCRIBE admin_actions;

-- ============================================
-- 3. Verify Foreign Keys
-- ============================================

SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'tsharok' 
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, CONSTRAINT_NAME;

-- ============================================
-- 4. Verify Indexes
-- ============================================

SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    NON_UNIQUE
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = 'tsharok'
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

-- ============================================
-- 5. Count Records (if seed data loaded)
-- ============================================

SELECT 'majors' as table_name, COUNT(*) as record_count FROM majors
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'courses', COUNT(*) FROM courses
UNION ALL
SELECT 'enrollments', COUNT(*) FROM enrollments
UNION ALL
SELECT 'content', COUNT(*) FROM content
UNION ALL
SELECT 'ratings', COUNT(*) FROM ratings
UNION ALL
SELECT 'comments', COUNT(*) FROM comments
UNION ALL
SELECT 'downloads', COUNT(*) FROM downloads
UNION ALL
SELECT 'admin_actions', COUNT(*) FROM admin_actions;

-- Expected counts with seed data:
-- majors: 8
-- users: 11
-- courses: 8
-- enrollments: 12
-- content: 20
-- ratings: 20
-- comments: 15
-- downloads: 20+
-- admin_actions: 12

-- ============================================
-- 6. Verify User Roles Distribution
-- ============================================

SELECT role, COUNT(*) as count
FROM users
GROUP BY role;

-- Expected:
-- admin: 1
-- instructor: 4
-- student: 6

-- ============================================
-- 7. Verify Course Levels
-- ============================================

SELECT level, COUNT(*) as count
FROM courses
GROUP BY level;

-- ============================================
-- 8. Verify Content Types
-- ============================================

SELECT type, COUNT(*) as count
FROM content
GROUP BY type
ORDER BY count DESC;

-- ============================================
-- 9. Verify Enrollment Status
-- ============================================

SELECT status, COUNT(*) as count
FROM enrollments
GROUP BY status;

-- ============================================
-- 10. Check Data Integrity
-- ============================================

-- Verify all courses have valid instructors
SELECT c.course_id, c.title, c.instructor_id, u.username
FROM courses c
LEFT JOIN users u ON c.instructor_id = u.user_id
WHERE u.user_id IS NULL OR u.role != 'instructor';
-- Should return 0 rows

-- Verify all enrollments have valid students
SELECT e.enrollment_id, e.student_id, e.course_id
FROM enrollments e
LEFT JOIN users u ON e.student_id = u.user_id
WHERE u.user_id IS NULL OR u.role != 'student';
-- Should return 0 rows

-- Verify all content has valid courses and uploaders
SELECT co.id, co.title, co.course_id, co.uploader_id
FROM content co
LEFT JOIN courses c ON co.course_id = c.course_id
LEFT JOIN users u ON co.uploader_id = u.user_id
WHERE c.course_id IS NULL OR u.user_id IS NULL;
-- Should return 0 rows

-- Verify all ratings are in valid range
SELECT id, score
FROM ratings
WHERE score < 0 OR score > 5;
-- Should return 0 rows

-- Verify unique constraints
-- Check for duplicate usernames
SELECT username, COUNT(*) as count
FROM users
GROUP BY username
HAVING count > 1;
-- Should return 0 rows

-- Check for duplicate emails
SELECT email, COUNT(*) as count
FROM users
GROUP BY email
HAVING count > 1;
-- Should return 0 rows

-- Check for duplicate enrollments
SELECT student_id, course_id, COUNT(*) as count
FROM enrollments
GROUP BY student_id, course_id
HAVING count > 1;
-- Should return 0 rows

-- ============================================
-- 11. Test Sample Queries
-- ============================================

-- Get a student's dashboard data
SELECT 
    (SELECT COUNT(*) FROM enrollments WHERE student_id = 6 AND status = 'active') as active_courses,
    (SELECT COUNT(*) FROM enrollments WHERE student_id = 6 AND status = 'completed') as completed_courses,
    (SELECT AVG(progress_percentage) FROM enrollments WHERE student_id = 6 AND status = 'active') as avg_progress,
    (SELECT COUNT(*) FROM downloads WHERE user_id = 6) as total_downloads,
    (SELECT COUNT(*) FROM comments WHERE user_id = 6) as total_comments,
    (SELECT COUNT(*) FROM ratings WHERE user_id = 6) as total_ratings;

-- Get content with ratings
SELECT co.id, co.title, co.type,
       AVG(r.score) as avg_rating,
       COUNT(r.id) as rating_count,
       COUNT(DISTINCT cm.id) as comment_count,
       COUNT(DISTINCT d.id) as download_count
FROM content co
LEFT JOIN ratings r ON co.id = r.content_id
LEFT JOIN comments cm ON co.id = cm.content_id
LEFT JOIN downloads d ON co.id = d.content_id
WHERE co.course_id = 1
GROUP BY co.id;

-- Get instructor's courses with student counts
SELECT c.course_id, c.course_code, c.title,
       COUNT(DISTINCT e.student_id) as enrolled_students,
       COUNT(DISTINCT co.id) as content_count
FROM courses c
LEFT JOIN enrollments e ON c.course_id = e.course_id
LEFT JOIN content co ON c.course_id = co.course_id
WHERE c.instructor_id = 2
GROUP BY c.course_id;

-- ============================================
-- 12. Performance Check
-- ============================================

-- Check table sizes
SELECT 
    table_name AS 'Table',
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.TABLES
WHERE table_schema = 'tsharok'
ORDER BY (data_length + index_length) DESC;

-- Check index usage (requires server permissions)
-- SHOW INDEX FROM users;
-- SHOW INDEX FROM courses;
-- SHOW INDEX FROM content;

-- ============================================
-- 13. Security Checks
-- ============================================

-- Verify password hashes exist (not plain text)
SELECT user_id, username, 
       LENGTH(password_hash) as password_length,
       password_hash LIKE '$2y$%' as is_bcrypt
FROM users;
-- password_length should be 60 for bcrypt
-- is_bcrypt should be 1 (true)

-- ============================================
-- 14. Summary Report
-- ============================================

SELECT 'DATABASE SETUP VERIFICATION COMPLETE' as status;

SELECT 
    'Total Tables' as metric, 
    COUNT(*) as value 
FROM information_schema.TABLES 
WHERE table_schema = 'tsharok'
UNION ALL
SELECT 
    'Total Users', 
    COUNT(*) 
FROM users
UNION ALL
SELECT 
    'Total Courses', 
    COUNT(*) 
FROM courses
UNION ALL
SELECT 
    'Total Content Items', 
    COUNT(*) 
FROM content
UNION ALL
SELECT 
    'Total Enrollments', 
    COUNT(*) 
FROM enrollments
UNION ALL
SELECT 
    'Total Ratings', 
    COUNT(*) 
FROM ratings
UNION ALL
SELECT 
    'Total Comments', 
    COUNT(*) 
FROM comments;

-- ============================================
-- All checks completed!
-- Review output for any unexpected results
-- ============================================

