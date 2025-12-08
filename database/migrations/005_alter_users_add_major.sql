-- Migration: Alter Users Table - Add Major Foreign Key
-- Version: 005
-- Date: 2025-11-03

ALTER TABLE users 
ADD COLUMN major_id INT NULL AFTER role,
ADD FOREIGN KEY (major_id) REFERENCES majors(id) ON DELETE SET NULL ON UPDATE CASCADE,
ADD INDEX idx_major_id (major_id);

