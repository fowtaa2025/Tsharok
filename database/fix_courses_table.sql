USE tsharok;

-- Make instructor_id nullable since we removed instructor role
ALTER TABLE courses 
MODIFY COLUMN instructor_id INT(11) NULL;

-- Also make course_code nullable for easier insertion
ALTER TABLE courses 
MODIFY COLUMN course_code VARCHAR(20) NULL;

-- Verify changes
DESCRIBE courses;

