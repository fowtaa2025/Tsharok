@echo off
echo ============================================
echo Tsharok - Multilingual System Setup
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

echo Setting up multilingual support...
echo.

REM Run the setup SQL script
"%MYSQL_EXE%" -h %MYSQL_HOST% -P %MYSQL_PORT% -u %MYSQL_USER% %MYSQL_PASS% %MYSQL_DB% < database\setup_multilingual.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo Multilingual System Setup Complete!
    echo ============================================
    echo.
    echo Supported Languages:
    echo - English (en)
    echo - Arabic (ar)
    echo.
    echo API Endpoints:
    echo - GET  /api/get-translations.php
    echo - GET  /api/get-available-languages.php
    echo - POST /api/set-language.php
    echo - *    /api/admin-translations.php (Admin only)
    echo.
    echo Language Files Location:
    echo - languages/en/*.json
    echo - languages/ar/*.json
    echo.
    echo JavaScript Helper:
    echo - public/assets/js/i18n-client.js
    echo.
    echo PHP Helper:
    echo - includes/i18n.php
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

