USE tsharok;

-- Insert sample courses for testing
INSERT INTO courses (title, description, category, level, duration_weeks, start_date, end_date, is_published, created_at) VALUES
('Introduction to Programming', 'Learn the fundamentals of programming using Python. This course covers variables, data types, control structures, functions, and basic algorithms.', 'Computer Science', 'Beginner', 12, '2025-02-01', '2025-04-30', 1, NOW()),

('Web Development Bootcamp', 'Master full-stack web development with HTML, CSS, JavaScript, Node.js, and React. Build real-world projects and deploy them to production.', 'Computer Science', 'Intermediate', 16, '2025-02-15', '2025-06-15', 1, NOW()),

('Data Structures and Algorithms', 'Deep dive into essential data structures (arrays, linked lists, trees, graphs) and algorithms (sorting, searching, dynamic programming).', 'Computer Science', 'Advanced', 14, '2025-03-01', '2025-06-01', 1, NOW()),

('Database Management Systems', 'Learn about relational databases, SQL, database design, normalization, transactions, and query optimization.', 'Information Systems', 'Intermediate', 10, '2025-02-10', '2025-04-30', 1, NOW()),

('Machine Learning Fundamentals', 'Introduction to machine learning concepts, supervised and unsupervised learning, neural networks, and practical applications using Python.', 'Artificial Intelligence', 'Advanced', 15, '2025-03-15', '2025-06-30', 1, NOW()),

('Cybersecurity Basics', 'Understand cybersecurity principles, network security, cryptography, ethical hacking, and how to protect systems from threats.', 'Cybersecurity', 'Beginner', 10, '2025-02-20', '2025-05-01', 1, NOW()),

('Mobile App Development', 'Create native mobile applications for iOS and Android. Learn Swift, Kotlin, and cross-platform development with React Native.', 'Software Engineering', 'Intermediate', 14, '2025-03-01', '2025-06-15', 1, NOW()),

('Cloud Computing with AWS', 'Master Amazon Web Services (AWS) including EC2, S3, Lambda, and deploy scalable cloud applications.', 'Computer Science', 'Advanced', 12, '2025-02-25', '2025-05-30', 1, NOW()),

('UI/UX Design Principles', 'Learn user interface and user experience design, wireframing, prototyping, and creating user-centered designs.', 'Software Engineering', 'Beginner', 8, '2025-02-15', '2025-04-15', 1, NOW()),

('Calculus I', 'Fundamental calculus concepts including limits, derivatives, integrals, and their applications in science and engineering.', 'Mathematics', 'Beginner', 16, '2025-02-01', '2025-06-01', 1, NOW()),

('Linear Algebra', 'Study vectors, matrices, vector spaces, eigenvalues, and their applications in computer graphics and machine learning.', 'Mathematics', 'Intermediate', 12, '2025-03-01', '2025-05-30', 1, NOW()),

('Computer Networks', 'Understand network protocols, TCP/IP, routing, switching, network security, and wireless communications.', 'Network Engineering', 'Intermediate', 12, '2025-02-10', '2025-05-10', 1, NOW());

-- Verify insertion
SELECT COUNT(*) as total_courses FROM courses;
SELECT title, category, level FROM courses ORDER BY created_at DESC LIMIT 5;

