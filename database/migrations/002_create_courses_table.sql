-- Migration: Create Courses Table
-- Version: 002
-- Date: 2025-11-03

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

