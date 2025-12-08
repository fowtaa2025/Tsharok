-- ============================================
-- Tsharok Database Schema
-- Core Tables: Users, Courses, Enrollments
-- ============================================

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS users;

-- ============================================
-- Users Table
-- ============================================
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role ENUM('student', 'instructor', 'admin') NOT NULL DEFAULT 'student',
    phone VARCHAR(20),
    profile_image VARCHAR(255),
    bio TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Courses Table
-- ============================================
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
    thumbnail VARCHAR(255),
    syllabus TEXT,
    prerequisites TEXT,
    learning_outcomes TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (instructor_id) REFERENCES users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    
    INDEX idx_course_code (course_code),
    INDEX idx_instructor_id (instructor_id),
    INDEX idx_category (category),
    INDEX idx_level (level),
    INDEX idx_is_published (is_published),
    INDEX idx_start_date (start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Enrollments Table
-- ============================================
CREATE TABLE enrollments (
    enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'completed', 'dropped', 'suspended') NOT NULL DEFAULT 'active',
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    grade DECIMAL(5,2),
    completion_date TIMESTAMP NULL,
    last_accessed TIMESTAMP NULL,
    notes TEXT,
    
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    UNIQUE KEY unique_enrollment (student_id, course_id),
    INDEX idx_student_id (student_id),
    INDEX idx_course_id (course_id),
    INDEX idx_status (status),
    INDEX idx_enrollment_date (enrollment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Sample Data (Optional - for testing)
-- ============================================

-- Insert sample users
INSERT INTO users (username, email, password_hash, first_name, last_name, role) VALUES
('admin', 'admin@tsharok.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'User', 'admin'),
('john_doe', 'john.doe@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John', 'Doe', 'instructor'),
('jane_smith', 'jane.smith@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jane', 'Smith', 'student');

-- Insert sample courses
INSERT INTO courses (course_code, title, description, instructor_id, category, level, duration_weeks, max_students, is_published, start_date, end_date) VALUES
('CS101', 'Introduction to Computer Science', 'Learn the basics of computer science and programming', 2, 'Computer Science', 'beginner', 12, 30, TRUE, '2025-01-15', '2025-04-15'),
('MATH201', 'Advanced Mathematics', 'Deep dive into calculus and linear algebra', 2, 'Mathematics', 'advanced', 16, 25, TRUE, '2025-02-01', '2025-05-30');

-- Insert sample enrollments
INSERT INTO enrollments (student_id, course_id, status, progress_percentage) VALUES
(3, 1, 'active', 45.50),
(3, 2, 'active', 20.00);

