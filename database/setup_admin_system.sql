-- Setup Admin System
-- Complete setup script for admin moderation system
-- Tsharok LMS

-- 1. Update content table to support rejection status
ALTER TABLE content 
MODIFY COLUMN is_approved TINYINT DEFAULT 0 
COMMENT '0=pending, 1=approved, -1=rejected';

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_content_approval_status ON content(is_approved);

-- 2. Ensure admin_actions table exists with correct structure
CREATE TABLE IF NOT EXISTS admin_actions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    action_type ENUM('create', 'update', 'delete', 'approve', 'reject', 'ban', 'unban', 'other') NOT NULL,
    target_type ENUM('user', 'course', 'content', 'comment', 'other') NOT NULL,
    target_id INT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    
    FOREIGN KEY (admin_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_admin_id (admin_id),
    INDEX idx_action_type (action_type),
    INDEX idx_target_type (target_type),
    INDEX idx_target_id (target_id),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Create admin user (password: Admin@123)
INSERT INTO users (
    username, 
    email, 
    password_hash, 
    first_name, 
    last_name, 
    role, 
    major_id, 
    is_active, 
    created_at
) VALUES (
    'admin',
    'admin@tsharok.com',
    '$2y$12$LQv3c1ysdeLi4VCUH2MKH.aI3qpXBHjKiDdqBqsP5YJj8y5FGWXXW',
    'System',
    'Administrator',
    'admin',
    NULL,
    1,
    NOW()
)
ON DUPLICATE KEY UPDATE 
    role = 'admin',
    is_active = 1;

-- 4. Verify setup
SELECT '=== Admin User Created ===' as status;
SELECT 
    user_id,
    username,
    email,
    role,
    is_active
FROM users
WHERE role = 'admin';

SELECT '=== Content Statistics ===' as status;
SELECT 
    COUNT(*) as total_content,
    SUM(CASE WHEN is_approved = 0 THEN 1 ELSE 0 END) as pending,
    SUM(CASE WHEN is_approved = 1 THEN 1 ELSE 0 END) as approved,
    SUM(CASE WHEN is_approved = -1 THEN 1 ELSE 0 END) as rejected
FROM content;

SELECT '=== Admin System Setup Complete ===' as status;
SELECT 'Login at: http://localhost:8000/admin-login.html' as next_step;
SELECT 'Username: admin' as credentials;
SELECT 'Password: Admin@123' as default_password;

