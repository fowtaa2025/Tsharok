@echo off
REM Login System Setup Script
REM Tsharok LMS

echo ============================================
echo Tsharok - Login System Setup
echo ============================================
echo.

REM Check for MySQL
echo Checking for MySQL...
where mysql >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: MySQL not found!
    echo Please install MySQL or add it to your PATH
    pause
    exit /b 1
)

echo MySQL found!
echo.

REM Get database credentials
set /p DB_HOST="Enter database host (default: localhost): " || set DB_HOST=localhost
set /p DB_NAME="Enter database name (default: tsharok_lms): " || set DB_NAME=tsharok_lms
set /p DB_USER="Enter database username (default: root): " || set DB_USER=root
set /p DB_PASS="Enter database password: "

echo.
echo ============================================
echo Running Login System Migrations
echo ============================================
echo.

echo Creating user_sessions table...
mysql -u%DB_USER% -p%DB_PASS% -h%DB_HOST% %DB_NAME% < "database\migrations\013_create_user_sessions_table.sql"
if %errorlevel% neq 0 (
    echo ERROR: Failed to create user_sessions table
    pause
    exit /b 1
)

echo Creating password_resets table...
mysql -u%DB_USER% -p%DB_PASS% -h%DB_HOST% %DB_NAME% < "database\migrations\014_create_password_resets_table.sql"
if %errorlevel% neq 0 (
    echo ERROR: Failed to create password_resets table
    pause
    exit /b 1
)

echo.
echo ============================================
echo Login System Setup Complete!
echo ============================================
echo.
echo Tables created:
echo - user_sessions
echo - password_resets
echo.
echo Next steps:
echo 1. Verify your SMTP settings in includes/email.php
echo 2. Test the login system by visiting public/login.html
echo 3. Test the registration system by visiting public/register.html
echo.

pause

