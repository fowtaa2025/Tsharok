-- ============================================
-- Seed Data for Tsharok Database - Complete Version
-- ============================================

-- Clear existing data
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE admin_actions;
TRUNCATE TABLE downloads;
TRUNCATE TABLE comments;
TRUNCATE TABLE ratings;
TRUNCATE TABLE content;
TRUNCATE TABLE enrollments;
TRUNCATE TABLE courses;
TRUNCATE TABLE users;
TRUNCATE TABLE majors;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- Seed Majors
-- ============================================
INSERT INTO majors (name, description) VALUES
('Computer Science', 'Study of computation, algorithms, and information systems'),
('Information Systems', 'Study of information technology and business processes'),
('Software Engineering', 'Study of software design, development, and maintenance'),
('Data Science', 'Study of data analysis, machine learning, and statistics'),
('Cybersecurity', 'Study of protecting systems and networks from digital attacks'),
('Artificial Intelligence', 'Study of intelligent agents and machine learning'),
('Network Engineering', 'Study of computer networks and telecommunications'),
('Mathematics', 'Study of numbers, patterns, and abstract structures');

-- ============================================
-- Seed Users
-- ============================================
-- Default password for all users: 'password123'
-- Password hash generated using bcrypt

INSERT INTO users (username, email, password_hash, first_name, last_name, role, major_id, phone, bio, is_active) VALUES
-- Admin Users
('admin', 'admin@tsharok.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'User', 'admin', NULL, '+966501234567', 'System Administrator', TRUE),

-- Instructors
('john_doe', 'john.doe@tsharok.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John', 'Doe', 'instructor', 1, '+966502345678', 'Computer Science Professor with 10 years of experience', TRUE),
('sarah_wilson', 'sarah.wilson@tsharok.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sarah', 'Wilson', 'instructor', 8, '+966503456789', 'Mathematics expert and passionate educator', TRUE),
('ahmed_ali', 'ahmed.ali@tsharok.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ahmed', 'Ali', 'instructor', 4, '+966504567890', 'Data Science and AI specialist', TRUE),
('fatima_omar', 'fatima.omar@tsharok.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Fatima', 'Omar', 'instructor', 3, '+966505678901', 'Software Engineering expert', TRUE),

-- Students
('jane_smith', 'jane.smith@tsharok.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jane', 'Smith', 'student', 1, '+966506789012', 'Computer Science student', TRUE),
('mohammed_khan', 'mohammed.khan@tsharok.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Mohammed', 'Khan', 'student', 1, '+966507890123', 'Engineering student interested in programming', TRUE),
('fatima_hassan', 'fatima.hassan@tsharok.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Fatima', 'Hassan', 'student', 8, '+966508901234', 'Mathematics major', TRUE),
('abdullah_omar', 'abdullah.omar@tsharok.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Abdullah', 'Omar', 'student', 4, '+966509012345', 'Data Science enthusiast', TRUE),
('noura_salem', 'noura.salem@tsharok.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Noura', 'Salem', 'student', 2, '+966510123456', 'Information Systems student', TRUE),
('khalid_rashid', 'khalid.rashid@tsharok.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Khalid', 'Rashid', 'student', 5, '+966511234567', 'Cybersecurity enthusiast', TRUE);

-- ============================================
-- Seed Courses
-- ============================================

INSERT INTO courses (course_code, title, description, instructor_id, category, level, duration_weeks, max_students, is_published, start_date, end_date, semester, prerequisites, learning_outcomes) VALUES
-- Computer Science Courses
('CS101', 'Introduction to Computer Science', 'Learn the fundamentals of computer science, including programming basics, algorithms, and problem-solving techniques.', 2, 'Computer Science', 'beginner', 12, 30, TRUE, '2025-01-15', '2025-04-15', 'Spring 2025', 'None', 'Understand basic programming concepts; Write simple programs; Understand algorithms and data structures'),

('CS201', 'Data Structures and Algorithms', 'Deep dive into essential data structures and algorithms used in software development.', 2, 'Computer Science', 'intermediate', 14, 25, TRUE, '2025-02-01', '2025-05-15', 'Spring 2025', 'CS101 or equivalent programming experience', 'Implement common data structures; Analyze algorithm complexity; Solve complex programming problems'),

('CS301', 'Database Systems', 'Comprehensive coverage of database design, SQL, and database management systems.', 2, 'Computer Science', 'advanced', 10, 20, TRUE, '2025-03-01', '2025-05-30', 'Spring 2025', 'CS201 or equivalent', 'Design normalized databases; Write complex SQL queries; Understand transaction management'),

-- Mathematics Courses
('MATH201', 'Advanced Mathematics', 'Deep dive into calculus, linear algebra, and their applications.', 3, 'Mathematics', 'advanced', 16, 25, TRUE, '2025-02-01', '2025-05-30', 'Spring 2025', 'Basic Calculus', 'Master advanced calculus concepts; Understand linear algebra; Apply mathematical concepts to real-world problems'),

('MATH101', 'Introduction to Statistics', 'Learn statistical methods and their applications in data analysis.', 3, 'Mathematics', 'beginner', 8, 35, TRUE, '2025-01-20', '2025-03-20', 'Spring 2025', 'Basic Mathematics', 'Understand statistical concepts; Perform data analysis; Interpret statistical results'),

-- Data Science Courses
('DS301', 'Machine Learning Fundamentals', 'Introduction to machine learning algorithms and their practical applications.', 4, 'Data Science', 'intermediate', 12, 20, TRUE, '2025-02-15', '2025-05-15', 'Spring 2025', 'Python programming and Statistics', 'Understand ML algorithms; Build predictive models; Apply ML to real-world problems'),

('DS401', 'Deep Learning and Neural Networks', 'Advanced course on deep learning architectures and applications.', 4, 'Data Science', 'advanced', 14, 15, TRUE, '2025-03-01', '2025-06-15', 'Spring 2025', 'Machine Learning Fundamentals', 'Build neural networks; Implement deep learning models; Work with modern frameworks'),

-- Software Engineering Course
('SE301', 'Software Engineering Principles', 'Learn software development lifecycle, design patterns, and best practices.', 5, 'Software Engineering', 'intermediate', 12, 25, TRUE, '2025-02-10', '2025-05-10', 'Spring 2025', 'Programming experience', 'Understand SDLC; Apply design patterns; Build scalable applications');

-- ============================================
-- Seed Enrollments
-- ============================================

INSERT INTO enrollments (student_id, course_id, status, progress_percentage, grade, last_accessed) VALUES
-- Jane Smith enrollments
(6, 1, 'active', 65.50, NULL, NOW()),
(6, 2, 'active', 30.00, NULL, NOW()),

-- Mohammed Khan enrollments
(7, 1, 'completed', 100.00, 92.50, NOW()),
(7, 2, 'active', 45.00, NULL, NOW()),
(7, 3, 'active', 15.00, NULL, NOW()),

-- Fatima Hassan enrollments
(8, 4, 'active', 80.00, NULL, NOW()),
(8, 5, 'completed', 100.00, 95.00, NOW()),

-- Abdullah Omar enrollments
(9, 5, 'completed', 100.00, 88.00, NOW()),
(9, 6, 'active', 55.00, NULL, NOW()),
(9, 7, 'active', 20.00, NULL, NOW()),

-- Noura Salem enrollments
(10, 1, 'active', 40.00, NULL, NOW()),
(10, 8, 'active', 35.00, NULL, NOW()),

-- Khalid Rashid enrollments
(11, 2, 'active', 50.00, NULL, NOW()),
(11, 3, 'active', 25.00, NULL, NOW());

-- ============================================
-- Seed Content
-- ============================================

INSERT INTO content (title, type, file_url, uploader_id, course_id, is_approved, description, file_size, mime_type) VALUES
-- CS101 Content
('Introduction to Programming - Lecture 1', 'lecture', '/uploads/cs101/lecture1.pdf', 2, 1, TRUE, 'Introduction to programming concepts and paradigms', 2048576, 'application/pdf'),
('Variables and Data Types', 'video', '/uploads/cs101/variables.mp4', 2, 1, TRUE, 'Video tutorial on variables and data types', 52428800, 'video/mp4'),
('Assignment 1: Hello World', 'assignment', '/uploads/cs101/assignment1.pdf', 2, 1, TRUE, 'First programming assignment', 524288, 'application/pdf'),
('Control Structures Quiz', 'quiz', '/uploads/cs101/quiz1.json', 2, 1, TRUE, 'Quiz on if statements and loops', 102400, 'application/json'),

-- CS201 Content
('Arrays and Linked Lists', 'lecture', '/uploads/cs201/lecture1.pdf', 2, 2, TRUE, 'Introduction to data structures', 3145728, 'application/pdf'),
('Binary Search Trees', 'video', '/uploads/cs201/bst.mp4', 2, 2, TRUE, 'Video explanation of BST operations', 73400320, 'video/mp4'),
('Sorting Algorithms Assignment', 'assignment', '/uploads/cs201/sorting.pdf', 2, 2, TRUE, 'Implement various sorting algorithms', 1048576, 'application/pdf'),

-- CS301 Content
('Database Design Principles', 'lecture', '/uploads/cs301/db_design.pdf', 2, 3, TRUE, 'ER diagrams and normalization', 4194304, 'application/pdf'),
('SQL Basics Tutorial', 'video', '/uploads/cs301/sql_basics.mp4', 2, 3, TRUE, 'Introduction to SQL queries', 62914560, 'video/mp4'),
('Database Project', 'assignment', '/uploads/cs301/project.pdf', 2, 3, TRUE, 'Design and implement a database system', 2097152, 'application/pdf'),

-- MATH201 Content
('Calculus Review', 'lecture', '/uploads/math201/calculus.pdf', 3, 4, TRUE, 'Review of calculus concepts', 2621440, 'application/pdf'),
('Linear Algebra Introduction', 'document', '/uploads/math201/linear_algebra.pdf', 3, 4, TRUE, 'Introduction to matrices and vectors', 3670016, 'application/pdf'),

-- MATH101 Content
('Statistics Fundamentals', 'lecture', '/uploads/math101/stats.pdf', 3, 5, TRUE, 'Introduction to statistical concepts', 1572864, 'application/pdf'),
('Probability Distributions', 'video', '/uploads/math101/probability.mp4', 3, 5, TRUE, 'Understanding probability distributions', 41943040, 'video/mp4'),

-- DS301 Content
('Introduction to Machine Learning', 'lecture', '/uploads/ds301/ml_intro.pdf', 4, 6, TRUE, 'Overview of ML concepts and algorithms', 5242880, 'application/pdf'),
('Linear Regression Tutorial', 'video', '/uploads/ds301/linear_reg.mp4', 4, 6, TRUE, 'Step-by-step linear regression tutorial', 83886080, 'video/mp4'),
('ML Project: Prediction Model', 'assignment', '/uploads/ds301/project1.pdf', 4, 6, TRUE, 'Build a prediction model using real data', 1048576, 'application/pdf'),

-- DS401 Content
('Neural Networks Basics', 'lecture', '/uploads/ds401/nn_basics.pdf', 4, 7, TRUE, 'Introduction to neural network architecture', 6291456, 'application/pdf'),
('CNN Tutorial', 'video', '/uploads/ds401/cnn.mp4', 4, 7, TRUE, 'Convolutional Neural Networks explained', 104857600, 'video/mp4'),

-- SE301 Content
('Software Development Lifecycle', 'lecture', '/uploads/se301/sdlc.pdf', 5, 8, TRUE, 'Overview of SDLC phases', 2097152, 'application/pdf'),
('Design Patterns', 'document', '/uploads/se301/patterns.pdf', 5, 8, TRUE, 'Common design patterns in software engineering', 3145728, 'application/pdf');

-- ============================================
-- Seed Ratings
-- ============================================

INSERT INTO ratings (user_id, content_id, score) VALUES
-- Ratings from students on various content
(6, 1, 4.50),
(6, 2, 5.00),
(6, 3, 4.00),
(7, 1, 5.00),
(7, 2, 4.75),
(7, 5, 4.50),
(7, 6, 5.00),
(8, 11, 5.00),
(8, 12, 4.75),
(8, 13, 4.50),
(9, 13, 4.00),
(9, 14, 4.50),
(9, 15, 5.00),
(9, 16, 4.75),
(10, 1, 4.25),
(10, 2, 4.50),
(10, 19, 4.00),
(11, 5, 4.75),
(11, 6, 5.00),
(11, 7, 4.50);

-- ============================================
-- Seed Comments
-- ============================================

INSERT INTO comments (content_id, user_id, content) VALUES
-- Comments on CS101 content
(1, 6, 'Great introduction to programming! Very clear and easy to follow.'),
(1, 7, 'This lecture helped me understand the basics. Thank you!'),
(2, 6, 'The video quality is excellent. The explanations are very detailed.'),
(3, 7, 'The assignment was challenging but fair. Learned a lot from it.'),

-- Comments on CS201 content
(5, 7, 'The explanation of linked lists was very clear.'),
(6, 7, 'Great visualization of BST operations!'),
(7, 11, 'Could you provide more examples for quicksort?'),

-- Comments on MATH courses
(11, 8, 'The calculus review was exactly what I needed.'),
(13, 8, 'The examples in this lecture are very helpful.'),
(14, 9, 'Great tutorial on probability!'),

-- Comments on DS courses
(15, 9, 'Best ML introduction I have seen so far.'),
(16, 9, 'The linear regression tutorial is very practical.'),
(18, 9, 'Looking forward to learning more about neural networks!'),

-- Comments on SE course
(19, 10, 'The SDLC explanation is comprehensive and clear.'),
(20, 10, 'The design patterns document is a great resource!');

-- ============================================
-- Seed Downloads
-- ============================================

INSERT INTO downloads (user_id, content_id, downloaded_at) VALUES
-- Jane Smith downloads
(6, 1, '2025-01-15 10:30:00'),
(6, 2, '2025-01-16 14:20:00'),
(6, 3, '2025-01-20 09:15:00'),

-- Mohammed Khan downloads
(7, 1, '2025-01-15 11:00:00'),
(7, 2, '2025-01-16 15:30:00'),
(7, 5, '2025-02-01 10:00:00'),
(7, 6, '2025-02-05 13:45:00'),
(7, 7, '2025-02-10 16:20:00'),

-- Fatima Hassan downloads
(8, 11, '2025-02-01 09:30:00'),
(8, 12, '2025-02-02 11:15:00'),
(8, 13, '2025-01-20 14:00:00'),
(8, 14, '2025-01-25 10:30:00'),

-- Abdullah Omar downloads
(9, 13, '2025-01-20 15:00:00'),
(9, 14, '2025-01-26 11:30:00'),
(9, 15, '2025-02-15 10:00:00'),
(9, 16, '2025-02-20 14:30:00'),
(9, 17, '2025-02-25 09:45:00'),

-- Noura Salem downloads
(10, 1, '2025-01-15 13:00:00'),
(10, 2, '2025-01-17 10:30:00'),
(10, 19, '2025-02-10 15:20:00'),

-- Khalid Rashid downloads
(11, 5, '2025-02-01 11:30:00'),
(11, 6, '2025-02-06 14:00:00'),
(11, 7, '2025-02-12 09:30:00'),
(11, 8, '2025-03-01 10:15:00');

-- ============================================
-- Seed Admin Actions
-- ============================================

INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, description) VALUES
-- Admin approving content
(1, 'approve', 'content', 1, 'Approved CS101 lecture content'),
(1, 'approve', 'content', 2, 'Approved CS101 video content'),
(1, 'approve', 'content', 3, 'Approved CS101 assignment'),
(1, 'approve', 'content', 4, 'Approved CS101 quiz'),
(1, 'approve', 'content', 5, 'Approved CS201 lecture content'),
(1, 'approve', 'course', 1, 'Published CS101 course'),
(1, 'approve', 'course', 2, 'Published CS201 course'),
(1, 'approve', 'course', 3, 'Published CS301 course'),

-- Admin creating courses
(1, 'create', 'course', 1, 'Created Introduction to Computer Science course'),
(1, 'create', 'course', 2, 'Created Data Structures and Algorithms course'),

-- Admin updating users
(1, 'update', 'user', 2, 'Updated instructor profile for John Doe'),
(1, 'update', 'user', 3, 'Updated instructor profile for Sarah Wilson');

