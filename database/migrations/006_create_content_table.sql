-- Migration: Create Content Table
-- Version: 006
-- Date: 2025-11-03

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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (uploader_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_uploader_id (uploader_id),
    INDEX idx_course_id (course_id),
    INDEX idx_type (type),
    INDEX idx_is_approved (is_approved),
    INDEX idx_upload_date (upload_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

