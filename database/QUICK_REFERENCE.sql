-- ============================================
-- Tsharok Database - Quick Reference
-- Table Structures Overview
-- ============================================

-- TABLE 1: MAJORS
-- Purpose: Academic majors/departments
CREATE TABLE majors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

-- TABLE 2: USERS
-- Purpose: System users (students, instructors, admins)
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role ENUM('student', 'instructor', 'admin') NOT NULL DEFAULT 'student',
    major_id INT NULL,
    phone VARCHAR(20),
    profile_image VARCHAR(255),
    bio TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (major_id) REFERENCES majors(id)
);

-- TABLE 3: COURSES
-- Purpose: Course information
CREATE TABLE courses (
    course_id INT AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    instructor_id INT NOT NULL,
    category VARCHAR(50),
    level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
    duration_weeks INT,
    max_students INT,
    is_published BOOLEAN DEFAULT FALSE,
    start_date DATE,
    end_date DATE,
    semester VARCHAR(20),
    FOREIGN KEY (instructor_id) REFERENCES users(user_id)
);

-- TABLE 4: ENROLLMENTS
-- Purpose: Student course enrollments
CREATE TABLE enrollments (
    enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'completed', 'dropped', 'suspended') DEFAULT 'active',
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    grade DECIMAL(5,2),
    FOREIGN KEY (student_id) REFERENCES users(user_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id),
    UNIQUE KEY (student_id, course_id)
);

-- TABLE 5: CONTENT
-- Purpose: Course materials (lectures, videos, assignments, etc.)
CREATE TABLE content (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    type ENUM('lecture', 'assignment', 'video', 'document', 'quiz', 'other') NOT NULL,
    file_url VARCHAR(255),
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploader_id INT NOT NULL,
    course_id INT NOT NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    description TEXT,
    file_size INT,
    mime_type VARCHAR(100),
    FOREIGN KEY (uploader_id) REFERENCES users(user_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id)
);

-- TABLE 6: RATINGS
-- Purpose: User ratings on content (1-5 stars)
CREATE TABLE ratings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    content_id INT NOT NULL,
    score DECIMAL(3,2) NOT NULL CHECK (score >= 0 AND score <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (content_id) REFERENCES content(id),
    UNIQUE KEY (user_id, content_id)
);

-- TABLE 7: COMMENTS
-- Purpose: User comments on content
CREATE TABLE comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (content_id) REFERENCES content(id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- TABLE 8: DOWNLOADS
-- Purpose: Content download tracking
CREATE TABLE downloads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    content_id INT NOT NULL,
    downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (content_id) REFERENCES content(id)
);

-- TABLE 9: ADMIN_ACTIONS
-- Purpose: Administrative action logs
CREATE TABLE admin_actions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    action_type ENUM('create', 'update', 'delete', 'approve', 'reject', 'ban', 'unban', 'other') NOT NULL,
    target_type ENUM('user', 'course', 'content', 'comment', 'other') NOT NULL,
    target_id INT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    FOREIGN KEY (admin_id) REFERENCES users(user_id)
);

-- ============================================
-- Common Queries Cheat Sheet
-- ============================================

-- Get user by email
SELECT * FROM users WHERE email = 'user@example.com';

-- Get user's enrolled courses
SELECT c.* FROM courses c
INNER JOIN enrollments e ON c.course_id = e.course_id
WHERE e.student_id = ? AND e.status = 'active';

-- Get course content
SELECT * FROM content 
WHERE course_id = ? AND is_approved = TRUE
ORDER BY upload_date DESC;

-- Get content with average rating
SELECT co.*, AVG(r.score) as avg_rating, COUNT(r.id) as rating_count
FROM content co
LEFT JOIN ratings r ON co.id = r.content_id
WHERE co.id = ?
GROUP BY co.id;

-- Get recent comments on content
SELECT cm.*, u.username, u.first_name, u.last_name
FROM comments cm
INNER JOIN users u ON cm.user_id = u.user_id
WHERE cm.content_id = ?
ORDER BY cm.created_at DESC
LIMIT 10;

-- Track download
INSERT INTO downloads (user_id, content_id) VALUES (?, ?);

-- Check if user already rated content
SELECT id FROM ratings WHERE user_id = ? AND content_id = ?;

-- Add or update rating
INSERT INTO ratings (user_id, content_id, score) 
VALUES (?, ?, ?)
ON DUPLICATE KEY UPDATE score = ?, updated_at = NOW();

-- Get student progress
SELECT 
    e.course_id,
    c.title,
    e.status,
    e.progress_percentage,
    e.grade
FROM enrollments e
INNER JOIN courses c ON e.course_id = c.course_id
WHERE e.student_id = ?;

-- ============================================
-- Indexes Summary
-- ============================================

-- Primary Keys (automatic indexes):
-- majors.id, users.user_id, courses.course_id, enrollments.enrollment_id,
-- content.id, ratings.id, comments.id, downloads.id, admin_actions.id

-- Unique Indexes:
-- users.username, users.email, courses.course_code
-- enrollments(student_id, course_id), ratings(user_id, content_id)

-- Foreign Key Indexes (automatic):
-- All FK columns are automatically indexed

-- Additional Performance Indexes:
-- users: role, major_id
-- courses: instructor_id, category, level, is_published
-- enrollments: status
-- content: uploader_id, course_id, type, is_approved
-- ratings: score
-- All timestamp/date columns

-- ============================================
-- Data Constraints Summary
-- ============================================

-- NOT NULL fields:
-- All entity IDs, usernames, emails, passwords, names, titles

-- UNIQUE constraints:
-- username, email, course_code
-- (student_id, course_id) in enrollments
-- (user_id, content_id) in ratings

-- CHECK constraints:
-- ratings.score: 0 to 5

-- ENUM constraints:
-- users.role: student, instructor, admin
-- courses.level: beginner, intermediate, advanced
-- enrollments.status: active, completed, dropped, suspended
-- content.type: lecture, assignment, video, document, quiz, other
-- admin_actions.action_type: create, update, delete, approve, reject, ban, unban, other
-- admin_actions.target_type: user, course, content, comment, other

-- DEFAULT values:
-- Timestamps: CURRENT_TIMESTAMP
-- Boolean flags: FALSE/TRUE as appropriate
-- Numeric: 0.00 for percentages/grades

-- ============================================
-- Foreign Key Cascade Actions
-- ============================================

-- ON DELETE CASCADE (auto-delete related records):
-- enrollments, content, ratings, comments, downloads, admin_actions

-- ON DELETE RESTRICT (prevent deletion):
-- courses.instructor_id (can't delete instructor with courses)

-- ON DELETE SET NULL (nullify reference):
-- users.major_id (can delete major, sets users to NULL)

