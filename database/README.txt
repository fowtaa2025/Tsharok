Database Setup Instructions
===========================

Quick Setup (Recommended):
---------------------------
Run the automated setup script:
   setup_database_complete.bat

Manual Setup:
-------------

1. Create Database:
   CREATE DATABASE tsharok CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

2. Import Complete Schema:
   mysql -u root -p tsharok < schema_complete.sql

3. (Optional) Import Seed Data:
   mysql -u root -p tsharok < seed_data_complete.sql

4. Configure Database Connection:
   - Copy config/database.example.php to config/database.php
   - Update with your database credentials

Database Tables:
----------------
1. majors - Academic majors/departments
2. users - System users (students, instructors, admins)
3. courses - Course information
4. enrollments - Student course enrollments
5. content - Course materials and content
6. ratings - User ratings on content
7. comments - User comments on content
8. downloads - Content download tracking
9. admin_actions - Admin activity logs

Migration Files:
----------------
- migrations/001_create_users_table.sql
- migrations/002_create_courses_table.sql
- migrations/003_create_enrollments_table.sql
- migrations/004_create_majors_table.sql
- migrations/005_alter_users_add_major.sql
- migrations/006_create_content_table.sql
- migrations/007_create_ratings_table.sql
- migrations/008_create_comments_table.sql
- migrations/009_create_downloads_table.sql
- migrations/010_create_admin_actions_table.sql

Sample Data:
------------
- 8 Majors
- 11 Users (1 admin, 4 instructors, 6 students)
- 8 Courses across multiple subjects
- 20+ Content items
- Ratings, comments, downloads, and admin actions

Default Test Credentials:
-------------------------
- Username: admin
- Password: password123

Verification:
-------------
After setup, verify with:
   mysql -u root -p tsharok -e "SHOW TABLES;"
   mysql -u root -p tsharok -e "SELECT COUNT(*) FROM users;"

