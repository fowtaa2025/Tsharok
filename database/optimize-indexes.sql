-- Database Optimization: Indexes
-- Tsharok LMS - Performance optimization indexes
-- Run this file to add missing indexes for better query performance

USE tsharok;

-- ============================================
-- Users Table Indexes
-- ============================================

-- Index for login queries (email/username lookup)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Composite index for active user lookups
CREATE INDEX IF NOT EXISTS idx_users_email_active ON users(email, is_active);
CREATE INDEX IF NOT EXISTS idx_users_username_active ON users(username, is_active);

-- Index for last login tracking
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);

-- ============================================
-- Courses Table Indexes
-- ============================================

-- Index for course searches
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_level ON courses(level);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_major ON courses(major_id);

-- FULLTEXT index for search functionality
CREATE FULLTEXT INDEX IF NOT EXISTS idx_courses_fulltext ON courses(title, description);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_courses_published_category ON courses(is_published, category);
CREATE INDEX IF NOT EXISTS idx_courses_published_level ON courses(is_published, level);

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_courses_created ON courses(created_at);
CREATE INDEX IF NOT EXISTS idx_courses_dates ON courses(start_date, end_date);

-- ============================================
-- Enrollments Table Indexes
-- ============================================

-- Index for enrollment lookups
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);

-- Composite index for user course lookup
CREATE INDEX IF NOT EXISTS idx_enrollments_user_course ON enrollments(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_status ON enrollments(course_id, status);

-- Index for enrollment date
CREATE INDEX IF NOT EXISTS idx_enrollments_date ON enrollments(enrollment_date);

-- ============================================
-- Content Table Indexes
-- ============================================

-- Index for content queries
CREATE INDEX IF NOT EXISTS idx_content_course ON content(course_id);
CREATE INDEX IF NOT EXISTS idx_content_uploader ON content(uploader_id);
CREATE INDEX IF NOT EXISTS idx_content_type ON content(type);
CREATE INDEX IF NOT EXISTS idx_content_approved ON content(is_approved);

-- Composite index for moderation queries
CREATE INDEX IF NOT EXISTS idx_content_course_approved ON content(course_id, is_approved);
CREATE INDEX IF NOT EXISTS idx_content_approved_date ON content(is_approved, upload_date);

-- FULLTEXT index for content search
CREATE FULLTEXT INDEX IF NOT EXISTS idx_content_fulltext ON content(title, description);

-- ============================================
-- Ratings Table Indexes
-- ============================================

-- Index for rating queries
CREATE INDEX IF NOT EXISTS idx_ratings_course ON ratings(course_id);
CREATE INDEX IF NOT EXISTS idx_ratings_content ON ratings(content_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user ON ratings(user_id);

-- Composite indexes for rating aggregation
CREATE INDEX IF NOT EXISTS idx_ratings_course_rating ON ratings(course_id, rating);
CREATE INDEX IF NOT EXISTS idx_ratings_course_score ON ratings(course_id, score);

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_ratings_created ON ratings(created_at);

-- ============================================
-- Comments Table Indexes
-- ============================================

-- Index for comment queries
CREATE INDEX IF NOT EXISTS idx_comments_course ON comments(course_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);

-- Index for threaded comments
CREATE INDEX IF NOT EXISTS idx_comments_course_parent ON comments(course_id, parent_id);

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_comments_created ON comments(created_at);

-- ============================================
-- Sessions Table Indexes
-- ============================================

-- Index for session lookups
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(is_active);

-- Index for session cleanup
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- Composite index for active session lookup
CREATE INDEX IF NOT EXISTS idx_sessions_token_active ON sessions(session_token, is_active);

-- ============================================
-- Admin Actions Table Indexes
-- ============================================

-- Index for admin action queries
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_type ON admin_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target ON admin_actions(target_type, target_id);

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_admin_actions_timestamp ON admin_actions(timestamp);

-- Composite index for admin activity
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_date ON admin_actions(admin_id, timestamp);

-- ============================================
-- Email Verifications Table Indexes
-- ============================================

-- Index for verification lookups
CREATE INDEX IF NOT EXISTS idx_email_verifications_user ON email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token);

-- Index for cleanup
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires ON email_verifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_email_verifications_verified ON email_verifications(verified_at);

-- ============================================
-- Password Resets Table Indexes
-- ============================================

-- Index for reset lookups
CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);

-- Index for cleanup
CREATE INDEX IF NOT EXISTS idx_password_resets_expires ON password_resets(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_resets_used ON password_resets(used_at);

-- ============================================
-- Activity Log Table Indexes (if exists)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_type ON activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at);

-- Composite index for user activity timeline
CREATE INDEX IF NOT EXISTS idx_activity_log_user_date ON activity_log(user_id, created_at);

-- ============================================
-- Analyze Tables for Query Optimization
-- ============================================

ANALYZE TABLE users;
ANALYZE TABLE courses;
ANALYZE TABLE enrollments;
ANALYZE TABLE content;
ANALYZE TABLE ratings;
ANALYZE TABLE comments;
ANALYZE TABLE sessions;
ANALYZE TABLE admin_actions;
ANALYZE TABLE email_verifications;
ANALYZE TABLE password_resets;

-- ============================================
-- Show Index Statistics
-- ============================================

SELECT 
    TABLE_NAME,
    INDEX_NAME,
    SEQ_IN_INDEX,
    COLUMN_NAME,
    CARDINALITY,
    INDEX_TYPE
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'tsharok'
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

