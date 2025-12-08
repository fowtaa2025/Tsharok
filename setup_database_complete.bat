@echo off
echo ============================================
echo Tsharok Project - Complete Database Setup
echo ============================================
echo.

set /p DB_NAME="Enter database name (default: tsharok): " || set DB_NAME=tsharok
set /p DB_USER="Enter MySQL username (default: root): " || set DB_USER=root
set /p DB_PASS="Enter MySQL password: "
set /p DB_HOST="Enter MySQL host (default: localhost): " || set DB_HOST=localhost

echo.
echo Creating database...
mysql -h %DB_HOST% -u %DB_USER% -p%DB_PASS% -e "CREATE DATABASE IF NOT EXISTS %DB_NAME% CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

if errorlevel 1 (
    echo ERROR: Failed to create database
    pause
    exit /b 1
)

echo.
echo Importing complete schema...
mysql -h %DB_HOST% -u %DB_USER% -p%DB_PASS% %DB_NAME% < database\schema_complete.sql

if errorlevel 1 (
    echo ERROR: Failed to import schema
    pause
    exit /b 1
)

echo.
set /p SEED_DATA="Import seed data? (y/n): "
if /i "%SEED_DATA%"=="y" (
    echo Importing seed data...
    mysql -h %DB_HOST% -u %DB_USER% -p%DB_PASS% %DB_NAME% < database\seed_data_complete.sql
    if errorlevel 1 (
        echo ERROR: Failed to import seed data
        pause
        exit /b 1
    )
    echo Seed data imported successfully!
)

echo.
echo ============================================
echo Database setup completed successfully!
echo ============================================
echo.
echo Database: %DB_NAME%
echo Host: %DB_HOST%
echo User: %DB_USER%
echo.
echo Tables created:
echo - majors
echo - users
echo - courses
echo - enrollments
echo - content
echo - ratings
echo - comments
echo - downloads
echo - admin_actions
echo.
if /i "%SEED_DATA%"=="y" (
    echo Default test credentials:
    echo - Username: admin
    echo - Password: password123
    echo.
    echo Sample data includes:
    echo - 8 Majors
    echo - 11 Users (1 admin, 4 instructors, 6 students)
    echo - 8 Courses
    echo - Multiple enrollments, content items, ratings, comments
)
echo.
echo Next steps:
echo 1. Copy config\database.example.php to config\database.php
echo 2. Update config\database.php with your database credentials
echo.
pause

