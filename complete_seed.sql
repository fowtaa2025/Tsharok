-- Complete Database Seed with All Courses
-- This replaces the existing seed.sql with comprehensive course data
-- Updated schema: course_id is nullable in content table

-- Clear existing data
DELETE FROM content;
DELETE FROM enrollments;
DELETE FROM courses;
DELETE FROM users;
DELETE FROM majors;

-- Insert Majors
INSERT INTO majors (id, name, description) VALUES
(1, 'Computer Science', 'Bachelor of Science in Computer Science'),
(2, 'Information Technology', 'Bachelor of Science in Information Technology'),
(3, 'Software Engineering', 'Bachelor of Science in Software Engineering');

-- Insert Users (Admin, Instructors, Students)
-- Password for all: Test123! (hashed with SHA-256)
INSERT INTO users (user_id, username, email, password_hash, first_name, last_name, role, major_id, is_active) VALUES
-- Admin
(1, 'admin', 'admin@uqu.edu.sa', '8bb6118f8fd6935ad0876a3be34a717d32708ffd', 'Admin', 'User', 'admin', NULL, 1),

-- Instructors
(2, 'dr.ahmed', 'ahmed.instructor@uqu.edu.sa', '8bb6118f8fd6935ad0876a3be34a717d32708ffd', 'Dr. Ahmed', 'Al-Malki', 'instructor', 1, 1),
(3, 'dr.fatima', 'fatima.instructor@uqu.edu.sa', '8bb6118f8fd6935ad0876a3be34a717d32708ffd', 'Dr. Fatima', 'Al-Zahrani', 'instructor', 1, 1),
(4, 'dr.mohammed', 'mohammed.instructor@uqu.edu.sa', '8bb6118f8fd6935ad0876a3be34a717d32708ffd', 'Dr. Mohammed', 'Al-Ghamdi', 'instructor', 1, 1),

-- Students
(5, 'student1', 'student@uqu.edu.sa', '8bb6118f8fd6935ad0876a3be34a717d32708ffd', 'Student', 'User', 'student', 1, 1);

-- Insert All 66 Courses
INSERT INTO courses (course_id, course_code, title, description, instructor_id, level, is_published, semester) VALUES
-- Level 1
(1, '48021400-4', 'Calculus (1)', 'Introduction to limits, derivatives, and their applications in solving real-world problems.', 2, 'beginner', 1, 'Fall 2024'),
(2, '48021700-6', 'English Language (1)', 'Basic English skills: reading, writing, listening, and speaking for academic purposes.', 3, 'beginner', 1, 'Fall 2024'),
(3, '48021503-3', 'Computer Programming Skills', 'Introduction to programming logic and problem-solving using a programming language.', 2, 'beginner', 1, 'Fall 2024'),
(4, '48021200-4', 'General Chemistry (1)', 'Fundamentals of chemistry: atomic structure, chemical bonding, and reactions.', 4, 'beginner', 1, 'Fall 2024'),

-- Level 2
(5, '48021300-4', 'General Physics (1)', 'Mechanics, motion, forces, energy, and basic thermodynamics.', 4, 'beginner', 1, 'Spring 2025'),
(6, '48021701-4', 'Technical English', 'English for technical writing and scientific communication.', 3, 'beginner', 1, 'Spring 2025'),
(7, '48021002-3', 'Learning Skills', 'Study techniques, time management, and effective learning strategies.', 3, 'beginner', 1, 'Spring 2025'),
(8, '48021401-4', 'Calculus (2)', 'Integration techniques, series, and applications of integral calculus.', 2, 'intermediate', 1, 'Spring 2025'),

-- Level 3
(9, '14011801-3', 'Discrete Structures I', 'Logic, sets, relations, functions, and graph theory for computer science.', 2, 'intermediate', 1, 'Fall 2024'),
(10, '4042301-3', 'Elements of Statistics and Probability', 'Probability theory, random variables, and statistical data analysis.', 2, 'intermediate', 1, 'Fall 2024'),
(11, '14031201-4', 'Digital Logic Design', 'Boolean algebra, logic gates, combinational and sequential circuits design.', 4, 'intermediate', 1, 'Fall 2024'),
(12, '605101-2', 'The Holy Quran I', '', 3, 'beginner', 1, 'Fall 2024'),
(13, '14011101-4', 'Computer Programming', 'Fundamentals of programming using a high-level language like C++ or Java.', 2, 'intermediate', 1, 'Fall 2024'),

-- Level 4
(14, '14011102-4', 'Object Oriented Programming', 'OOP concepts: classes, inheritance, polymorphism, and encapsulation.', 2, 'intermediate', 1, 'Spring 2025'),
(15, '4042402-4', 'Linear Algebra (1)', 'Vectors, matrices, linear equations, eigenvalues and eigenvectors.', 2, 'intermediate', 1, 'Spring 2025'),
(16, '14032205-4', 'Computer Organization & Architecture', 'CPU design, memory systems, instruction sets, and computer architecture.', 4, 'intermediate', 1, 'Spring 2025'),
(17, '14011802-3', 'Discrete Structures II', 'Advanced topics: counting, recurrence relations, and graph algorithms.', 2, 'intermediate', 1, 'Spring 2025'),

-- Level 5
(18, '14032401-4', 'Numerical Methods for Computing', 'Numerical solutions for equations, interpolation, and numerical integration.', 2, 'intermediate', 1, 'Fall 2024'),
(19, '14012301-3', 'Database I', 'Relational database design, SQL queries, and normalization.', 2, 'intermediate', 1, 'Fall 2024'),
(20, '14012401-3', 'Data Structures', 'Arrays, linked lists, stacks, queues, trees, graphs, and their implementations.', 2, 'advanced', 1, 'Fall 2024'),
(21, '14012203-4', 'Operating Systems', 'Process management, memory management, file systems, and scheduling.', 4, 'advanced', 1, 'Fall 2024'),
(22, '601101-2', 'Islamic Culture I', '', 3, 'beginner', 1, 'Fall 2024'),

-- Level 6
(23, '605201-2', 'The Holy Quran II', '', 3, 'beginner', 1, 'Spring 2025'),
(24, '14012109-3', 'Compilers Construction', 'Lexical analysis, parsing, semantic analysis, and code generation.', 2, 'advanced', 1, 'Spring 2025'),
(25, '14012402-4', 'Algorithms', 'Algorithm design, complexity analysis, sorting, searching, and optimization.', 2, 'advanced', 1, 'Spring 2025'),
(26, '14012501-3', 'Computer Graphics', '2D/3D graphics, transformations, rendering, and visualization techniques.', 4, 'advanced', 1, 'Spring 2025'),
(27, '14033103-4', 'Computer Networks', 'Network architecture, OSI model, TCP/IP protocols, and data communication.', 4, 'advanced', 1, 'Spring 2025'),

-- Level 7
(28, '14013303-3', 'Software Engineering I', 'Software development lifecycle, requirements analysis, and project management.', 2, 'advanced', 1, 'Fall 2024'),
(29, '14013701-4', 'Artificial Intelligence', 'AI concepts, search algorithms, knowledge representation, and machine learning basics.', 2, 'advanced', 1, 'Fall 2024'),
(30, '601201-2', 'Islamic Culture II', '', 3, 'beginner', 1, 'Fall 2024'),
(31, '14013104-3', 'Internet Applications', 'Web development, client-server architecture, and internet technologies.', 2, 'advanced', 1, 'Fall 2024'),
(32, '14013103-4', 'Advanced Programming', 'Advanced programming concepts, design patterns, and software development.', 2, 'advanced', 1, 'Fall 2024'),

-- Level 8
(33, '14013888-2', 'Summer Training', '', 3, 'intermediate', 1, 'Summer 2024'),
(34, '14013602-3', 'Computer Security', 'Security fundamentals, cryptography, authentication, and network security.', 4, 'advanced', 1, 'Spring 2025'),
(35, '14013502-3', 'User Interface Design', 'UI/UX principles, usability, prototyping, and user-centered design.', 3, 'advanced', 1, 'Spring 2025'),
(36, '14013304-3', 'Software Engineering II', 'Advanced software engineering: testing, maintenance, and quality assurance.', 2, 'advanced', 1, 'Spring 2025'),
(37, '14013204-3', 'Parallel Computing', 'Parallel algorithms, multithreading, and distributed computing concepts.', 4, 'advanced', 1, 'Spring 2025'),
(38, '605301-2', 'The Holy Quran III', '', 3, 'beginner', 1, 'Spring 2025'),

-- Level 9
(39, '14014902-4', 'Graduation Project I', '', 2, 'advanced', 1, 'Fall 2024'),
(40, '14014305-2', 'Computers and Society', 'Social, ethical, and professional issues in computing and technology.', 3, 'intermediate', 1, 'Fall 2024'),
(41, '605401-2', 'The Holy Quran (IV)', '', 3, 'beginner', 1, 'Fall 2024'),
(42, '601301-3', 'Islamic Culture III', '', 3, 'beginner', 1, 'Fall 2024'),

-- Level 10
(43, '102101-2', 'Biography of the Prophet', '', 3, 'beginner', 1, 'Spring 2025'),
(44, '14014903-4', 'Graduation Project II', '', 2, 'advanced', 1, 'Spring 2025'),
(45, '501101-2', 'Arabic Language I', '', 3, 'beginner', 1, 'Spring 2025'),
(46, '601401-2', 'Islamic Culture (iv)', '', 3, 'beginner', 1, 'Spring 2025'),

-- Elective Courses
(47, '14014905-3', 'Special Topics I', 'Advanced topics in computer science selected by the instructor.', 2, 'advanced', 1, 'Fall 2024'),
(48, '14014106-3', 'Programming Languages', 'Programming paradigms, language design principles, and comparison of languages.', 2, 'advanced', 1, 'Fall 2024'),
(49, '14014604-3', 'Introduction to Cryptography', 'Encryption algorithms, hash functions, digital signatures, and security protocols.', 4, 'advanced', 1, 'Fall 2024'),
(50, '14014605-3', 'Forensics Computing', 'Digital forensics, evidence collection, and cybercrime investigation.', 4, 'advanced', 1, 'Fall 2024'),
(51, '14014702-3', 'Artificial Neural Networks', 'Neural network architectures, training algorithms, and deep learning.', 2, 'advanced', 1, 'Spring 2025'),
(52, '14014703-3', 'Pattern Recognition', 'Classification, feature extraction, and machine learning for pattern analysis.', 2, 'advanced', 1, 'Spring 2025'),
(53, '14014704-3', 'Natural Language Processing', 'Text processing, sentiment analysis, and language understanding by computers.', 2, 'advanced', 1, 'Spring 2025'),
(54, '14014803-3', 'Theory of Computing', 'Automata theory, formal languages, Turing machines, and computability.', 2, 'advanced', 1, 'Spring 2025'),
(55, '14014305-3', 'Big Data Analytics', 'Large-scale data processing, Hadoop, Spark, and data mining techniques.', 2, 'advanced', 1, 'Fall 2024'),
(56, '14014306-3', 'Software Testing', 'Testing methodologies, test case design, automation, and quality assurance.', 2, 'advanced', 1, 'Fall 2024'),
(57, '14014307-3', 'Software Architecture', 'Architectural patterns, design principles, and system design.', 2, 'advanced', 1, 'Fall 2024'),
(58, '14014308-3', 'Information Retrieval Systems', 'Search engines, indexing, ranking algorithms, and text retrieval.', 2, 'advanced', 1, 'Fall 2024'),
(59, '14014404-3', 'Bioinformatics', 'Computational methods for biological data analysis and genomics.', 4, 'advanced', 1, 'Spring 2025'),
(60, '14014503-3', 'Image Processing', 'Digital image processing, filtering, segmentation, and computer vision.', 4, 'advanced', 1, 'Spring 2025'),
(61, '14014105-3', 'Mobile Applications', 'Mobile app development for Android and iOS platforms.', 2, 'advanced', 1, 'Spring 2025'),
(62, '14014906-3', 'Special Topics II', 'Advanced topics in computer science selected by the instructor.', 2, 'advanced', 1, 'Spring 2025'),
(63, '14014108-3', 'Game Programming', 'Game development, game engines, physics, and graphics programming.', 4, 'advanced', 1, 'Spring 2025'),
(64, '14014110-3', 'Advanced Web Programming', 'Modern web frameworks, APIs, and full-stack development.', 2, 'advanced', 1, 'Spring 2025'),
(65, '14014205-3', 'Cloud Computing', 'Cloud services, virtualization, containerization, and distributed systems.', 4, 'advanced', 1, 'Fall 2024'),
(66, '14014302-3', 'Database II', 'Advanced database: transactions, concurrency, optimization, and NoSQL.', 2, 'advanced', 1, 'Fall 2024');
