-- Complete Login System Schema
-- Tsharok LMS
-- Date: 2025-11-03

-- User Sessions Table
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_token VARCHAR(64) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    is_active TINYINT(1) DEFAULT 1,
    expires_at DATETIME NOT NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    logout_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_user_id (user_id),
    INDEX idx_session_token (session_token),
    INDEX idx_is_active (is_active),
    INDEX idx_expires_at (expires_at),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Password Resets Table
CREATE TABLE IF NOT EXISTS password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(64) UNIQUE NOT NULL,
    used TINYINT(1) DEFAULT 0 COMMENT '0=unused, 1=used, 2=expired',
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_user_id (user_id),
    INDEX idx_token (token),
    INDEX idx_used (used),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add comments
ALTER TABLE user_sessions COMMENT = 'Stores active user sessions for authentication';
ALTER TABLE password_resets COMMENT = 'Stores password reset tokens';

-- Sample Data for Testing (Optional)
-- Uncomment to insert test data

/*
-- Test User (password: Test1234)
INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active, created_at)
VALUES 
('testuser', 'test@tsharok.com', '$2y$12$LQv3c1yYqnxDWCJhKjBqLuXSL3qPqXj0cDnqKlMzFqKp4cRXqGK2C', 'Test', 'User', 'student', 1, NOW()),
('instructor1', 'instructor@tsharok.com', '$2y$12$LQv3c1yYqnxDWCJhKjBqLuXSL3qPqXj0cDnqKlMzFqKp4cRXqGK2C', 'John', 'Doe', 'instructor', 1, NOW());
*/

