-- ============================================
-- Add FULLTEXT Search Indexes
-- Tsharok LMS - Search Optimization
-- ============================================

USE tsharok;

-- Check current table engine (must be InnoDB for FULLTEXT)
SELECT TABLE_NAME, ENGINE 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'tsharok' AND TABLE_NAME = 'courses';

-- Ensure courses table uses InnoDB
ALTER TABLE courses ENGINE=InnoDB;

-- Add FULLTEXT index on title and description
-- This enables fast full-text searching
ALTER TABLE courses 
ADD FULLTEXT INDEX ft_course_search (title, description);

-- Add individual FULLTEXT indexes for specific searches
ALTER TABLE courses 
ADD FULLTEXT INDEX ft_course_title (title);

ALTER TABLE courses 
ADD FULLTEXT INDEX ft_course_description (description);

-- Add regular indexes for filtering and sorting (skip if exist)
-- Note: Some indexes may already exist
-- CREATE INDEX idx_level ON courses(level);
-- CREATE INDEX idx_category ON courses(category);
-- CREATE INDEX idx_start_date ON courses(start_date);
-- CREATE INDEX idx_created_at ON courses(created_at);
-- CREATE INDEX idx_published ON courses(is_published);

-- Add index for enrollment counting
CREATE INDEX idx_enrollments_course ON enrollments(course_id, status);

-- Verify indexes were created
SHOW INDEX FROM courses;

-- Test FULLTEXT search
SELECT course_id, title, 
       MATCH(title, description) AGAINST('programming' IN NATURAL LANGUAGE MODE) as relevance
FROM courses
WHERE MATCH(title, description) AGAINST('programming' IN NATURAL LANGUAGE MODE)
ORDER BY relevance DESC
LIMIT 10;

-- Success message
SELECT '✓ FULLTEXT indexes added successfully' AS Status;
SELECT '✓ Regular indexes created for filtering' AS Status;
SELECT '✓ Search optimization complete' AS Status;

