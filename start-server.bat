@echo off
echo ============================================
echo Tsharok - Starting Development Server
echo ============================================
echo.

echo Starting PHP built-in server on http://localhost:8000
echo Press Ctrl+C to stop the server
echo.
echo Available pages:
echo - http://localhost:8000 (Homepage)
echo - http://localhost:8000/login.html (Login)
echo - http://localhost:8000/register.html (Register)
echo - http://localhost:8000/admin-login.html (Admin Login)
echo - http://localhost:8000/dashboard/moderation.html (Moderation Panel)
echo - http://localhost:8000/i18n-demo.html (Multilingual Demo)
echo.

set "PHP_EXE=php"

if exist "%~dp0php\php.exe" set "PHP_EXE=%~dp0php\php.exe"
if exist "C:\xampp\php\php.exe" set "PHP_EXE=C:\xampp\php\php.exe"

if not exist "%PHP_EXE%" (
    echo.
    echo ERROR: Could not find php.exe. Please install PHP and add it to PATH.
    echo You can update PHP_EXE in start-server.bat to point to your php.exe.
    goto :EOF
)

"%PHP_EXE%" -S localhost:8000 router.php

pause
