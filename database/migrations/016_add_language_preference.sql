-- Migration: Add Language Preference to Users
-- Version: 016
-- Date: 2025-11-19
-- Description: Add language column to users table for multilingual support

-- Add language column to users table
ALTER TABLE users 
ADD COLUMN language VARCHAR(5) DEFAULT 'en' 
COMMENT 'User preferred language (en, ar, etc.)'
AFTER role;

-- Add index for better query performance
CREATE INDEX idx_users_language ON users(language);

-- Update existing users to have default language based on their name
-- If Arabic characters detected in name, set to 'ar', otherwise 'en'
UPDATE users 
SET language = 'ar' 
WHERE first_name REGEXP '[ء-ي]' OR last_name REGEXP '[ء-ي]';

-- Update remaining users to English
UPDATE users 
SET language = 'en' 
WHERE language IS NULL OR language = '';

-- Make sure column is not null
ALTER TABLE users 
MODIFY COLUMN language VARCHAR(5) NOT NULL DEFAULT 'en';

