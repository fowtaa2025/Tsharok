-- ============================================
-- Seed Data for Tsharok Database
-- ============================================

-- Clear existing data
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE enrollments;
TRUNCATE TABLE courses;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- Seed Users
-- ============================================
-- Default password for all users: 'password123'
-- Password hash generated using bcrypt

INSERT INTO users (username, email, password_hash, first_name, last_name, role, phone, bio, is_active) VALUES
-- Admin Users
('admin', 'admin@tsharok.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'User', 'admin', '+966501234567', 'System Administrator', TRUE),

-- Instructors
('john_doe', 'john.doe@tsharok.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John', 'Doe', 'instructor', '+966502345678', 'Computer Science Professor with 10 years of experience', TRUE),
('sarah_wilson', 'sarah.wilson@tsharok.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sarah', 'Wilson', 'instructor', '+966503456789', 'Mathematics expert and passionate educator', TRUE),
('ahmed_ali', 'ahmed.ali@tsharok.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ahmed', 'Ali', 'instructor', '+966504567890', 'Data Science and AI specialist', TRUE),

-- Students
('jane_smith', 'jane.smith@tsharok.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jane', 'Smith', 'student', '+966505678901', 'Computer Science student', TRUE),
('mohammed_khan', 'mohammed.khan@tsharok.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Mohammed', 'Khan', 'student', '+966506789012', 'Engineering student interested in programming', TRUE),
('fatima_hassan', 'fatima.hassan@tsharok.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Fatima', 'Hassan', 'student', '+966507890123', 'Mathematics major', TRUE),
('abdullah_omar', 'abdullah.omar@tsharok.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Abdullah', 'Omar', 'student', '+966508901234', 'Data Science enthusiast', TRUE);

-- ============================================
-- Seed Courses
-- ============================================

INSERT INTO courses (course_code, title, description, instructor_id, category, level, duration_weeks, max_students, is_published, start_date, end_date, prerequisites, learning_outcomes) VALUES
-- Computer Science Courses
('CS101', 'Introduction to Computer Science', 'Learn the fundamentals of computer science, including programming basics, algorithms, and problem-solving techniques.', 2, 'Computer Science', 'beginner', 12, 30, TRUE, '2025-01-15', '2025-04-15', 'None', 'Understand basic programming concepts; Write simple programs; Understand algorithms and data structures'),

('CS201', 'Data Structures and Algorithms', 'Deep dive into essential data structures and algorithms used in software development.', 2, 'Computer Science', 'intermediate', 14, 25, TRUE, '2025-02-01', '2025-05-15', 'CS101 or equivalent programming experience', 'Implement common data structures; Analyze algorithm complexity; Solve complex programming problems'),

('CS301', 'Database Systems', 'Comprehensive coverage of database design, SQL, and database management systems.', 2, 'Computer Science', 'advanced', 10, 20, TRUE, '2025-03-01', '2025-05-30', 'CS201 or equivalent', 'Design normalized databases; Write complex SQL queries; Understand transaction management'),

-- Mathematics Courses
('MATH201', 'Advanced Mathematics', 'Deep dive into calculus, linear algebra, and their applications.', 3, 'Mathematics', 'advanced', 16, 25, TRUE, '2025-02-01', '2025-05-30', 'Basic Calculus', 'Master advanced calculus concepts; Understand linear algebra; Apply mathematical concepts to real-world problems'),

('MATH101', 'Introduction to Statistics', 'Learn statistical methods and their applications in data analysis.', 3, 'Mathematics', 'beginner', 8, 35, TRUE, '2025-01-20', '2025-03-20', 'Basic Mathematics', 'Understand statistical concepts; Perform data analysis; Interpret statistical results'),

-- Data Science Courses
('DS301', 'Machine Learning Fundamentals', 'Introduction to machine learning algorithms and their practical applications.', 4, 'Data Science', 'intermediate', 12, 20, TRUE, '2025-02-15', '2025-05-15', 'Python programming and Statistics', 'Understand ML algorithms; Build predictive models; Apply ML to real-world problems'),

('DS401', 'Deep Learning and Neural Networks', 'Advanced course on deep learning architectures and applications.', 4, 'Data Science', 'advanced', 14, 15, TRUE, '2025-03-01', '2025-06-15', 'Machine Learning Fundamentals', 'Build neural networks; Implement deep learning models; Work with modern frameworks');

-- ============================================
-- Seed Enrollments
-- ============================================

INSERT INTO enrollments (student_id, course_id, status, progress_percentage, grade, last_accessed) VALUES
-- Jane Smith enrollments
(5, 1, 'active', 65.50, NULL, NOW()),
(5, 2, 'active', 30.00, NULL, NOW()),

-- Mohammed Khan enrollments
(6, 1, 'completed', 100.00, 92.50, NOW()),
(6, 2, 'active', 45.00, NULL, NOW()),
(6, 3, 'active', 15.00, NULL, NOW()),

-- Fatima Hassan enrollments
(7, 4, 'active', 80.00, NULL, NOW()),
(7, 5, 'completed', 100.00, 95.00, NOW()),

-- Abdullah Omar enrollments
(8, 5, 'completed', 100.00, 88.00, NOW()),
(8, 6, 'active', 55.00, NULL, NOW()),
(8, 7, 'active', 20.00, NULL, NOW());

