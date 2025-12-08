-- Create Admin User
-- Use this script to create an admin user for testing
-- Default password: Admin@123 (change after first login)

-- Insert admin user
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
    '$2y$12$LQv3c1ysdeLi4VCUH2MKH.aI3qpXBHjKiDdqBqsP5YJj8y5FGWXXW', -- Password: Admin@123
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

-- Verify admin user creation
SELECT 
    user_id,
    username,
    email,
    first_name,
    last_name,
    role,
    is_active,
    created_at
FROM users
WHERE role = 'admin';

-- Instructions:
-- 1. Run this script in your MySQL database
-- 2. Login with:
--    Username: admin
--    Password: Admin@123
-- 3. Change the password immediately after first login
-- 4. Access admin panel at: http://localhost:8000/admin-login.html

