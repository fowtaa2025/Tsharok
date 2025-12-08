# Tsharok Project Setup Guide

## Prerequisites
- Git
- MySQL Server (5.7 or higher)
- PHP (7.4 or higher) - optional for now
- Web Server (Apache/Nginx) - optional for now

## Quick Setup

### 1. Git Setup

#### Option A: Using the provided script (Windows)
```cmd
setup_git.bat
```

#### Option B: Manual setup
```bash
# Initialize Git repository
git init

# Add all files
git add .

# Check status
git status

# Create first commit
git commit -m "Initial commit: MySQL schema and project structure"

# (Optional) Add remote repository
git remote add origin YOUR_REPO_URL

# (Optional) Push to remote
git push -u origin master
```

### 2. Database Setup

#### Option A: Using the provided script (Windows)
```cmd
setup_database.bat
```

#### Option B: Manual setup
```bash
# 1. Create database
mysql -u root -p -e "CREATE DATABASE tsharok CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. Import schema
mysql -u root -p tsharok < database/schema.sql

# 3. (Optional) Import seed data
mysql -u root -p tsharok < database/seed_data.sql
```

### 3. Configuration

1. Copy the example configuration file:
```bash
cp config/database.example.php config/database.php
```

2. Edit `config/database.php` and update with your database credentials:
```php
'host'      => 'localhost',
'database'  => 'tsharok',
'username'  => 'root',
'password'  => 'your_password',
```

## Project Structure

```
Tsharok/
├── .gitignore                      # Git ignore rules
├── setup_git.bat                   # Git setup script (Windows)
├── setup_database.bat              # Database setup script (Windows)
├── SETUP.md                        # This file
│
├── config/                         # Configuration files
│   └── database.example.php        # Database configuration template
│
├── database/                       # Database files
│   ├── schema.sql                  # Complete database schema
│   ├── seed_data.sql               # Sample data for testing
│   ├── README.txt                  # Database setup instructions
│   └── migrations/                 # Individual table migrations
│       ├── 001_create_users_table.sql
│       ├── 002_create_courses_table.sql
│       └── 003_create_enrollments_table.sql
│
└── src/                            # Source code
    ├── index.php                   # Main entry point
    └── config.php                  # Application configuration
```

## Database Schema

### Tables

#### 1. Users Table
Stores user information for students, instructors, and admins.

**Fields:**
- `user_id` (Primary Key)
- `username`, `email` (Unique)
- `password_hash`
- `first_name`, `last_name`
- `role` (student/instructor/admin)
- `phone`, `profile_image`, `bio`
- `is_active`
- `created_at`, `updated_at`, `last_login`

#### 2. Courses Table
Stores course information.

**Fields:**
- `course_id` (Primary Key)
- `course_code` (Unique)
- `title`, `description`
- `instructor_id` (Foreign Key → users)
- `category`, `level`
- `duration_weeks`, `max_students`
- `thumbnail`, `syllabus`, `prerequisites`, `learning_outcomes`
- `is_published`
- `start_date`, `end_date`
- `created_at`, `updated_at`

#### 3. Enrollments Table
Links students to courses with progress tracking.

**Fields:**
- `enrollment_id` (Primary Key)
- `student_id` (Foreign Key → users)
- `course_id` (Foreign Key → courses)
- `enrollment_date`
- `status` (active/completed/dropped/suspended)
- `progress_percentage`, `grade`
- `completion_date`, `last_accessed`
- `notes`

## Sample Data

The `seed_data.sql` file includes sample data:
- 1 Admin user
- 3 Instructors
- 4 Students
- 7 Courses (Computer Science, Mathematics, Data Science)
- Multiple enrollment records

### Test Credentials
All sample users have the password: `password123`

**Sample Accounts:**
- Admin: `admin@tsharok.com`
- Instructor: `john.doe@tsharok.com`
- Student: `jane.smith@tsharok.com`

## Verification

To verify the database setup:

```sql
-- Check if tables exist
SHOW TABLES;

-- Count records in each table
SELECT COUNT(*) AS users_count FROM users;
SELECT COUNT(*) AS courses_count FROM courses;
SELECT COUNT(*) AS enrollments_count FROM enrollments;

-- View sample data
SELECT * FROM users LIMIT 5;
SELECT * FROM courses LIMIT 5;
SELECT * FROM enrollments LIMIT 5;
```

## Troubleshooting

### Git Issues
- **Problem:** Git not found
  - **Solution:** Install Git from https://git-scm.com/

- **Problem:** Permission denied
  - **Solution:** Run terminal/command prompt as administrator

### Database Issues
- **Problem:** Access denied for user
  - **Solution:** Check MySQL credentials and user permissions

- **Problem:** Character encoding issues
  - **Solution:** Ensure MySQL is configured for UTF-8:
```sql
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
```

- **Problem:** Foreign key constraint fails
  - **Solution:** Import tables in order (users → courses → enrollments)

## Next Steps

1. ✅ Git initialized
2. ✅ Database schema created
3. TODO: Implement backend API
4. TODO: Create frontend interface
5. TODO: Add authentication system
6. TODO: Implement course management features
7. TODO: Add enrollment workflows

## Support

For issues or questions:
1. Check this documentation
2. Review database/README.txt
3. Check error logs
4. Contact project team

---

**Project:** Tsharok
**Version:** 1.0.0
**Last Updated:** November 3, 2025

