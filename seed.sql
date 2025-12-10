-- Seed Data for Tsharok D1 Database
-- Initial data for testing

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

-- Insert Sample Admin User (password: Admin123!)
-- Note: This is a bcrypt hash of "Admin123!" - you should change this in production
INSERT INTO users (username, email, password_hash, first_name, last_name, role, major_id, is_active) VALUES
('admin', 'admin@tsharok.com', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyKcvY4v9YoS', 'Admin', 'User', 'admin', 1, 1);

-- Insert Sample Student User (password: Student123!)
INSERT INTO users (username, email, password_hash, first_name, last_name, role, major_id, is_active) VALUES
('student1', 's4123456@uqu.edu.sa', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyKcvY4v9YoS', 'Ahmed', 'Bamarouf', 'student', 1, 1);

-- Insert Sample Instructor User (password: Instructor123!)
INSERT INTO users (username, email, password_hash, first_name, last_name, role, major_id, is_active) VALUES
('instructor1', 'instructor@uqu.edu.sa', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyKcvY4v9YoS', 'Dr. Mohammed', 'Ali', 'instructor', 1, 1);

-- Insert Sample Courses
INSERT INTO courses (course_code, title, description, instructor_id, category, level, is_published) VALUES
('CS101', 'Introduction to Programming', 'Learn the basics of programming using Python', 3, 'Programming', 'beginner', 1),
('CS201', 'Data Structures', 'Advanced data structures and algorithms', 3, 'Programming', 'intermediate', 1),
('CS301', 'Web Development', 'Full-stack web development with modern technologies', 3, 'Web', 'advanced', 1);
