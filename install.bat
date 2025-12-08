@echo off
echo ============================================
echo Tsharok - Installing Dependencies
echo ============================================
echo.

echo Checking for Composer...
where composer >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Composer not found!
    echo Please install Composer from https://getcomposer.org/
    pause
    exit /b 1
)

echo Installing PHP dependencies...
composer install

if %errorlevel% equ 0 (
    echo.
    echo ============================================
    echo Dependencies installed successfully!
    echo ============================================
    echo.
    echo Next steps:
    echo 1. Configure your SMTP settings in includes/email.php
    echo 2. Update database credentials in config/database.php
    echo 3. Run database migrations
    echo 4. Start your server with start-server.bat
    echo.
) else (
    echo.
    echo ERROR: Failed to install dependencies
    echo.
)

pause
