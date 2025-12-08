-- ============================================
-- Tsharok Database - Example Queries
-- Common queries for the application
-- ============================================

-- ============================================
-- USER QUERIES
-- ============================================

-- Get all students with their majors
SELECT u.user_id, u.username, u.email, u.first_name, u.last_name, m.name as major_name
FROM users u
LEFT JOIN majors m ON u.major_id = m.id
WHERE u.role = 'student'
ORDER BY u.last_name, u.first_name;

-- Get all instructors with course count
SELECT u.user_id, u.username, u.first_name, u.last_name, COUNT(c.course_id) as course_count
FROM users u
LEFT JOIN courses c ON u.user_id = c.instructor_id
WHERE u.role = 'instructor'
GROUP BY u.user_id
ORDER BY course_count DESC;

-- Get user profile with complete information
SELECT u.*, m.name as major_name, m.description as major_description
FROM users u
LEFT JOIN majors m ON u.major_id = m.id
WHERE u.user_id = 1;

-- ============================================
-- COURSE QUERIES
-- ============================================

-- Get all published courses with instructor info
SELECT c.course_id, c.course_code, c.title, c.category, c.level, 
       u.first_name, u.last_name, u.email as instructor_email
FROM courses c
INNER JOIN users u ON c.instructor_id = u.user_id
WHERE c.is_published = TRUE
ORDER BY c.start_date DESC;

-- Get course details with enrollment count
SELECT c.*, COUNT(e.enrollment_id) as enrolled_students, u.first_name, u.last_name
FROM courses c
LEFT JOIN enrollments e ON c.course_id = e.course_id AND e.status = 'active'
INNER JOIN users u ON c.instructor_id = u.user_id
WHERE c.course_id = 1
GROUP BY c.course_id;

-- Get courses by category with stats
SELECT c.category, COUNT(DISTINCT c.course_id) as course_count, 
       COUNT(DISTINCT e.student_id) as total_students,
       AVG(e.progress_percentage) as avg_progress
FROM courses c
LEFT JOIN enrollments e ON c.course_id = e.course_id
WHERE c.is_published = TRUE
GROUP BY c.category
ORDER BY course_count DESC;

-- ============================================
-- ENROLLMENT QUERIES
-- ============================================

-- Get student's enrolled courses with progress
SELECT c.course_code, c.title, c.category, e.status, e.progress_percentage, 
       e.grade, e.enrollment_date, u.first_name as instructor_first_name, 
       u.last_name as instructor_last_name
FROM enrollments e
INNER JOIN courses c ON e.course_id = c.course_id
INNER JOIN users u ON c.instructor_id = u.user_id
WHERE e.student_id = 6
ORDER BY e.enrollment_date DESC;

-- Get course enrollment list with student details
SELECT u.user_id, u.username, u.first_name, u.last_name, u.email,
       e.enrollment_date, e.status, e.progress_percentage, e.grade
FROM enrollments e
INNER JOIN users u ON e.student_id = u.user_id
WHERE e.course_id = 1
ORDER BY e.enrollment_date DESC;

-- Get student performance summary
SELECT u.first_name, u.last_name, 
       COUNT(e.enrollment_id) as total_courses,
       SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) as completed_courses,
       AVG(e.progress_percentage) as avg_progress,
       AVG(e.grade) as avg_grade
FROM users u
INNER JOIN enrollments e ON u.user_id = e.student_id
WHERE u.user_id = 7
GROUP BY u.user_id;

-- ============================================
-- CONTENT QUERIES
-- ============================================

-- Get all content for a course with ratings
SELECT co.id, co.title, co.type, co.upload_date, co.is_approved,
       u.first_name, u.last_name, 
       AVG(r.score) as avg_rating, COUNT(r.id) as rating_count,
       COUNT(DISTINCT d.id) as download_count
FROM content co
INNER JOIN users u ON co.uploader_id = u.user_id
LEFT JOIN ratings r ON co.id = r.content_id
LEFT JOIN downloads d ON co.id = d.content_id
WHERE co.course_id = 1
GROUP BY co.id
ORDER BY co.upload_date DESC;

-- Get pending content for approval
SELECT co.id, co.title, co.type, co.upload_date, 
       c.course_code, c.title as course_title,
       u.first_name, u.last_name
FROM content co
INNER JOIN courses c ON co.course_id = c.course_id
INNER JOIN users u ON co.uploader_id = u.user_id
WHERE co.is_approved = FALSE
ORDER BY co.upload_date ASC;

-- Get most popular content by downloads
SELECT co.id, co.title, co.type, c.course_code, c.title as course_title,
       COUNT(d.id) as download_count,
       AVG(r.score) as avg_rating
FROM content co
INNER JOIN courses c ON co.course_id = c.course_id
LEFT JOIN downloads d ON co.id = d.content_id
LEFT JOIN ratings r ON co.id = r.content_id
WHERE co.is_approved = TRUE
GROUP BY co.id
ORDER BY download_count DESC
LIMIT 10;

-- ============================================
-- RATING QUERIES
-- ============================================

-- Get content ratings with user info
SELECT r.id, r.score, r.created_at, u.username, u.first_name, u.last_name
FROM ratings r
INNER JOIN users u ON r.user_id = u.user_id
WHERE r.content_id = 1
ORDER BY r.created_at DESC;

-- Get average ratings by content type
SELECT co.type, COUNT(r.id) as rating_count, 
       AVG(r.score) as avg_rating,
       MIN(r.score) as min_rating,
       MAX(r.score) as max_rating
FROM content co
LEFT JOIN ratings r ON co.id = r.content_id
WHERE co.is_approved = TRUE
GROUP BY co.type
ORDER BY avg_rating DESC;

-- Get user's rating activity
SELECT u.username, COUNT(r.id) as ratings_given, AVG(r.score) as avg_rating_given
FROM users u
INNER JOIN ratings r ON u.user_id = r.user_id
WHERE u.user_id = 6
GROUP BY u.user_id;

-- ============================================
-- COMMENT QUERIES
-- ============================================

-- Get comments for content with user info
SELECT cm.id, cm.content as comment_text, cm.created_at,
       u.username, u.first_name, u.last_name
FROM comments cm
INNER JOIN users u ON cm.user_id = u.user_id
WHERE cm.content_id = 1
ORDER BY cm.created_at DESC;

-- Get recent comments across all content
SELECT cm.id, cm.content as comment_text, cm.created_at,
       u.username, u.first_name, u.last_name,
       co.title as content_title, c.course_code
FROM comments cm
INNER JOIN users u ON cm.user_id = u.user_id
INNER JOIN content co ON cm.content_id = co.id
INNER JOIN courses c ON co.course_id = c.course_id
ORDER BY cm.created_at DESC
LIMIT 20;

-- Get most commented content
SELECT co.id, co.title, co.type, c.course_code,
       COUNT(cm.id) as comment_count
FROM content co
INNER JOIN courses c ON co.course_id = c.course_id
LEFT JOIN comments cm ON co.id = cm.content_id
WHERE co.is_approved = TRUE
GROUP BY co.id
ORDER BY comment_count DESC
LIMIT 10;

-- ============================================
-- DOWNLOAD QUERIES
-- ============================================

-- Get user's download history
SELECT d.id, d.downloaded_at, co.title, co.type, c.course_code, c.title as course_title
FROM downloads d
INNER JOIN content co ON d.content_id = co.id
INNER JOIN courses c ON co.course_id = c.course_id
WHERE d.user_id = 7
ORDER BY d.downloaded_at DESC;

-- Get download statistics by course
SELECT c.course_code, c.title, COUNT(d.id) as total_downloads
FROM courses c
INNER JOIN content co ON c.course_id = co.course_id
LEFT JOIN downloads d ON co.id = d.content_id
WHERE c.is_published = TRUE
GROUP BY c.course_id
ORDER BY total_downloads DESC;

-- Get download trends (daily downloads last 30 days)
SELECT DATE(d.downloaded_at) as download_date, COUNT(d.id) as downloads
FROM downloads d
WHERE d.downloaded_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(d.downloaded_at)
ORDER BY download_date DESC;

-- ============================================
-- ADMIN ACTION QUERIES
-- ============================================

-- Get recent admin actions
SELECT aa.id, aa.action_type, aa.target_type, aa.target_id, aa.timestamp, aa.description,
       u.username as admin_username, u.first_name, u.last_name
FROM admin_actions aa
INNER JOIN users u ON aa.admin_id = u.user_id
ORDER BY aa.timestamp DESC
LIMIT 50;

-- Get admin actions by admin user
SELECT aa.action_type, aa.target_type, COUNT(aa.id) as action_count
FROM admin_actions aa
WHERE aa.admin_id = 1
GROUP BY aa.action_type, aa.target_type
ORDER BY action_count DESC;

-- Get actions on specific content
SELECT aa.*, u.username as admin_username, u.first_name, u.last_name
FROM admin_actions aa
INNER JOIN users u ON aa.admin_id = u.user_id
WHERE aa.target_type = 'content' AND aa.target_id = 1
ORDER BY aa.timestamp DESC;

-- ============================================
-- DASHBOARD & STATISTICS QUERIES
-- ============================================

-- System overview statistics
SELECT 
    (SELECT COUNT(*) FROM users WHERE role = 'student') as total_students,
    (SELECT COUNT(*) FROM users WHERE role = 'instructor') as total_instructors,
    (SELECT COUNT(*) FROM courses WHERE is_published = TRUE) as total_courses,
    (SELECT COUNT(*) FROM enrollments WHERE status = 'active') as active_enrollments,
    (SELECT COUNT(*) FROM content WHERE is_approved = TRUE) as approved_content,
    (SELECT COUNT(*) FROM content WHERE is_approved = FALSE) as pending_content;

-- Student dashboard data
SELECT 
    (SELECT COUNT(*) FROM enrollments WHERE student_id = 6 AND status = 'active') as active_courses,
    (SELECT COUNT(*) FROM enrollments WHERE student_id = 6 AND status = 'completed') as completed_courses,
    (SELECT AVG(progress_percentage) FROM enrollments WHERE student_id = 6 AND status = 'active') as avg_progress,
    (SELECT AVG(grade) FROM enrollments WHERE student_id = 6 AND grade IS NOT NULL) as avg_grade,
    (SELECT COUNT(*) FROM downloads WHERE user_id = 6) as total_downloads,
    (SELECT COUNT(*) FROM comments WHERE user_id = 6) as total_comments;

-- Instructor dashboard data
SELECT 
    (SELECT COUNT(*) FROM courses WHERE instructor_id = 2) as total_courses,
    (SELECT COUNT(DISTINCT e.student_id) FROM enrollments e INNER JOIN courses c ON e.course_id = c.course_id WHERE c.instructor_id = 2) as total_students,
    (SELECT COUNT(*) FROM content co INNER JOIN courses c ON co.course_id = c.course_id WHERE c.instructor_id = 2) as total_content,
    (SELECT COUNT(*) FROM content co INNER JOIN courses c ON co.course_id = c.course_id WHERE c.instructor_id = 2 AND co.is_approved = FALSE) as pending_content;

-- Course analytics
SELECT c.course_id, c.course_code, c.title,
       COUNT(DISTINCT e.student_id) as enrolled_students,
       COUNT(DISTINCT co.id) as content_count,
       AVG(e.progress_percentage) as avg_progress,
       AVG(r.score) as avg_content_rating
FROM courses c
LEFT JOIN enrollments e ON c.course_id = e.course_id
LEFT JOIN content co ON c.course_id = co.course_id
LEFT JOIN ratings r ON co.id = r.content_id
WHERE c.is_published = TRUE
GROUP BY c.course_id
ORDER BY enrolled_students DESC;

