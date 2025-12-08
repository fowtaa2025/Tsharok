-- Add review features to existing tables
-- Run this if helpful_count, title, or would_recommend columns are missing

USE tsharok;

-- Add helpful_count column to comments table if not exists
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS helpful_count INT DEFAULT 0 AFTER comment;

-- Add title column to comments table if not exists
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS title VARCHAR(200) NULL AFTER comment;

-- Add would_recommend column to comments table if not exists
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS would_recommend TINYINT(1) DEFAULT 0 AFTER title;

-- Add updated_at to comments if not exists
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

-- Add updated_at to ratings if not exists
ALTER TABLE ratings 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

-- Add index for better performance
ALTER TABLE comments ADD INDEX IF NOT EXISTS idx_course_created (course_id, created_at);
ALTER TABLE comments ADD INDEX IF NOT EXISTS idx_helpful (helpful_count);
ALTER TABLE ratings ADD INDEX IF NOT EXISTS idx_course_rating (course_id, rating);

-- Verify columns
DESCRIBE comments;
DESCRIBE ratings;

