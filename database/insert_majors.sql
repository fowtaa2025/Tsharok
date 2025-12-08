-- Insert majors data
-- Run this in phpMyAdmin or MySQL client

USE tsharok;

-- Check if majors exist
SELECT COUNT(*) as major_count FROM majors;

-- Insert majors if table is empty
INSERT IGNORE INTO majors (id, name, description) VALUES
(1, 'Computer Science', 'Study of computation, programming, and software development'),
(2, 'Information Systems', 'Integration of technology and business processes'),
(3, 'Software Engineering', 'Systematic approach to software development and maintenance'),
(4, 'Data Science', 'Analysis and interpretation of complex data'),
(5, 'Cybersecurity', 'Protection of computer systems and networks'),
(6, 'Artificial Intelligence', 'Development of intelligent computer systems'),
(7, 'Network Engineering', 'Design and implementation of computer networks'),
(8, 'Mathematics', 'Study of numbers, structures, and patterns');

-- Verify insertion
SELECT * FROM majors;

