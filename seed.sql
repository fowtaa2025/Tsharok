-- Seed Data for Tsharok D1 Database
-- Initial data for testing
-- Password for all users: "Test123!" (SHA-256 hashed)

-- Insert Majors
INSERT INTO majors (name, description) VALUES
('Computer Science', 'Study of computation, programming, and software development'),
('Information Systems', 'Integration of technology and business processes'),
('Software Engineering', 'Systematic approach to software development and maintenance'),
('Data Science', 'Analysis and interpretation of complex data'),
('Cybersecurity', 'Protection of computer systems and networks'),
('Artificial Intelligence', 'Development of intelligent computer systems'),
('Network Engineering', 'Design and implementation of computer networks'),
('Mathematics', 'Study of numbers, structures, and patterns');

-- Insert Sample Admin User
-- Email: admin@tsharok.com
-- Password: Test123!
-- SHA-256 hash of "Test123!"
INSERT INTO users (username, email, password_hash, first_name, last_name, role, major_id, is_active) VALUES
('admin', 'admin@tsharok.com', '4a44dc15364204a80fe80e9039455cc1608281820fe2b24f1e5233ade6af1dd5', 'Admin', 'User', 'admin', 1, 1);

-- Insert Sample Student User
-- Email: student@uqu.edu.sa
-- Password: Test123!
INSERT INTO users (username, email, password_hash, first_name, last_name, role, major_id, is_active) VALUES
('student1', 'student@uqu.edu.sa', '4a44dc15364204a80fe80e9039455cc1608281820fe2b24f1e5233ade6af1dd5', 'Ahmed', 'Bamarouf', 'student', 1, 1);

-- Insert Sample Instructor User
-- Email: instructor@uqu.edu.sa
-- Password: Test123!
INSERT INTO users (username, email, password_hash, first_name, last_name, role, major_id, is_active) VALUES
('instructor1', 'instructor@uqu.edu.sa', '4a44dc15364204a80fe80e9039455cc1608281820fe2b24f1e5233ade6af1dd5', 'Dr. Mohammed', 'Ali', 'instructor', 1, 1);

-- Insert Sample Courses
INSERT INTO courses (course_code, title, description, instructor_id, category, level, is_published) VALUES
('CS101', 'Introduction to Programming', 'Learn the basics of programming using Python', 3, 'Programming', 'beginner', 1),
('CS201', 'Data Structures', 'Advanced data structures and algorithms', 3, 'Programming', 'intermediate', 1),
('CS301', 'Web Development', 'Full-stack web development with modern technologies', 3, 'Web', 'advanced', 1);
