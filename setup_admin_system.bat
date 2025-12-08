@echo off
echo ============================================
echo Tsharok - Admin System Setup
echo ============================================
echo.

REM Set MySQL connection details
set "MYSQL_USER=root"
set "MYSQL_PASS="
set "MYSQL_HOST=127.0.0.1"
set "MYSQL_PORT=3307"
set "MYSQL_DB=tsharok"

REM Check if MySQL is available
set "MYSQL_EXE=mysql"
if exist "C:\xampp\mysql\bin\mysql.exe" set "MYSQL_EXE=C:\xampp\mysql\bin\mysql.exe"

if not exist "%MYSQL_EXE%" (
    echo ERROR: Could not find mysql.exe
    echo Please install MySQL/XAMPP or update MYSQL_EXE path
    pause
    exit /b 1
)

echo Setting up admin system...
echo.

REM Run the setup SQL script
"%MYSQL_EXE%" -h %MYSQL_HOST% -P %MYSQL_PORT% -u %MYSQL_USER% %MYSQL_PASS% %MYSQL_DB% < database\setup_admin_system.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo Admin System Setup Complete!
    echo ============================================
    echo.
    echo Admin Login Details:
    echo - URL: http://localhost:8000/admin-login.html
    echo - Username: admin
    echo - Password: Admin@123
    echo.
    echo IMPORTANT: Change the default password after first login!
    echo.
    echo Moderation Panel:
    echo - URL: http://localhost:8000/dashboard/moderation.html
    echo.
) else (
    echo.
    echo ============================================
    echo ERROR: Setup failed!
    echo ============================================
    echo Please check:
    echo 1. MySQL is running
    echo 2. Database 'tsharok' exists
    echo 3. Connection details are correct
    echo.
)

pause

