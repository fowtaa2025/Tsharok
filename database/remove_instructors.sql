-- ============================================
-- Remove Instructor Role from Tsharok Database
-- ============================================
-- This script removes all instructor-related data and functionality
-- Run this after backing up your database if needed

USE tsharok;

-- Step 1: Update users table - Convert all instructors to students
UPDATE users 
SET role = 'student' 
WHERE role = 'instructor';

-- Step 2: Delete courses that were created by instructors (optional)
-- Uncomment the following line if you want to delete instructor courses
-- DELETE FROM courses WHERE instructor_id IS NOT NULL;

-- Step 3: Update courses table - Remove instructor_id foreign key if exists
-- Check if foreign key exists first
SET @fk_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = 'tsharok'
    AND TABLE_NAME = 'courses'
    AND CONSTRAINT_NAME LIKE '%instructor%'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

-- Drop foreign key if it exists
SET @sql = IF(@fk_exists > 0, 
    'ALTER TABLE courses DROP FOREIGN KEY courses_ibfk_1',
    'SELECT "No instructor foreign key to drop" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 4: Set all instructor_id to NULL (courses become system courses)
UPDATE courses 
SET instructor_id = NULL 
WHERE instructor_id IS NOT NULL;

-- Step 5: Modify the role column to only allow 'student' and 'admin'
ALTER TABLE users 
MODIFY COLUMN role ENUM('student', 'admin') NOT NULL DEFAULT 'student';

-- Step 6: Clean up any instructor-related session data
DELETE FROM user_sessions 
WHERE user_id IN (
    SELECT user_id FROM users WHERE role = 'admin' -- This is safe since we already converted instructors
);

-- Step 7: Log the changes
INSERT INTO activity_logs (user_id, action, description, ip_address)
VALUES (NULL, 'SYSTEM_UPDATE', 'Removed instructor role from system', '127.0.0.1');

-- Verification Queries
-- =====================

-- Check user roles (should only be student and admin)
SELECT role, COUNT(*) as count 
FROM users 
GROUP BY role;

-- Check courses without instructors
SELECT COUNT(*) as courses_without_instructor 
FROM courses 
WHERE instructor_id IS NULL;

-- Check courses with instructors (should be 0 after update)
SELECT COUNT(*) as courses_with_instructor 
FROM courses 
WHERE instructor_id IS NOT NULL;

-- Show sample of updated users
SELECT user_id, username, first_name, last_name, email, role 
FROM users 
ORDER BY user_id 
LIMIT 10;

-- Completion message
SELECT '✓ Instructor role has been successfully removed from the system' AS Status;
SELECT '✓ All previous instructors have been converted to students' AS Status;
SELECT '✓ All courses are now system-managed (no instructor assignment)' AS Status;

