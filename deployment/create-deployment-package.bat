@echo off
REM Tsharok LMS - Create Deployment Package
REM Creates a clean, production-ready package for deployment

echo.
echo ===============================================================================
echo   TSHAROK LMS - CREATE DEPLOYMENT PACKAGE
echo ===============================================================================
echo.

REM Check if 7zip is available
where 7z >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: 7zip is required for creating deployment packages.
    echo Please install 7zip and try again.
    echo Download: https://www.7-zip.org/
    echo.
    pause
    exit /b 1
)

REM Configuration
set TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set PACKAGE_NAME=tsharok_deployment_%TIMESTAMP%
set PACKAGE_DIR=deployment\packages
set TEMP_DIR=%PACKAGE_DIR%\temp_%TIMESTAMP%

echo Creating deployment package: %PACKAGE_NAME%
echo.

REM Create directories
if not exist "%PACKAGE_DIR%" mkdir "%PACKAGE_DIR%"
if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%"
mkdir "%TEMP_DIR%"

echo Step 1: Copying application files...
echo -------------------------------------------------------------------------------

REM Copy main directories
echo   - Copying api\...
xcopy /E /I /Q "api\" "%TEMP_DIR%\api\" >nul

echo   - Copying config\...
xcopy /E /I /Q "config\" "%TEMP_DIR%\config\" >nul

echo   - Copying includes\...
xcopy /E /I /Q "includes\" "%TEMP_DIR%\includes\" >nul

echo   - Copying public\...
xcopy /E /I /Q "public\" "%TEMP_DIR%\public\" >nul

echo   - Copying database\...
xcopy /E /I /Q "database\" "%TEMP_DIR%\database\" >nul
REM Remove backup files from package
if exist "%TEMP_DIR%\database\backups\*.sql" del "%TEMP_DIR%\database\backups\*.sql" >nul 2>&1
if exist "%TEMP_DIR%\database\final-backup\*.sql" del "%TEMP_DIR%\database\final-backup\*.sql" >nul 2>&1

echo   - Copying languages\...
xcopy /E /I /Q "languages\" "%TEMP_DIR%\languages\" >nul

REM Copy root files
echo   - Copying configuration files...
copy "start-server.bat" "%TEMP_DIR%\" >nul
copy ".htaccess" "%TEMP_DIR%\" >nul 2>nul
copy "cleanup-scripts.php" "%TEMP_DIR%\" >nul 2>nul

REM Create required directories
echo   - Creating required directories...
mkdir "%TEMP_DIR%\uploads\staging" 2>nul
mkdir "%TEMP_DIR%\uploads\content" 2>nul
mkdir "%TEMP_DIR%\uploads\rejected" 2>nul
mkdir "%TEMP_DIR%\uploads\backup" 2>nul
mkdir "%TEMP_DIR%\logs" 2>nul

REM Create .htaccess for uploads
echo ^<Files "*"^> > "%TEMP_DIR%\uploads\.htaccess"
echo   Order Allow,Deny >> "%TEMP_DIR%\uploads\.htaccess"
echo   Deny from all >> "%TEMP_DIR%\uploads\.htaccess"
echo ^</Files^> >> "%TEMP_DIR%\uploads\.htaccess"

echo.
echo Step 2: Creating deployment documentation...
echo -------------------------------------------------------------------------------

REM Create deployment instructions
set DEPLOY_GUIDE=%TEMP_DIR%\DEPLOYMENT_GUIDE.txt

echo TSHAROK LMS - DEPLOYMENT GUIDE > "%DEPLOY_GUIDE%"
echo ================================================== >> "%DEPLOY_GUIDE%"
echo. >> "%DEPLOY_GUIDE%"
echo Package Created: %date% %time% >> "%DEPLOY_GUIDE%"
echo Version: 1.0 >> "%DEPLOY_GUIDE%"
echo. >> "%DEPLOY_GUIDE%"
echo ================================================== >> "%DEPLOY_GUIDE%"
echo QUICK START >> "%DEPLOY_GUIDE%"
echo ================================================== >> "%DEPLOY_GUIDE%"
echo. >> "%DEPLOY_GUIDE%"
echo 1. Extract this package to your web server >> "%DEPLOY_GUIDE%"
echo 2. Configure database connection in config/database.php >> "%DEPLOY_GUIDE%"
echo 3. Set production settings in config/app.php >> "%DEPLOY_GUIDE%"
echo 4. Import database schema: database/schema_complete.sql >> "%DEPLOY_GUIDE%"
echo 5. Set directory permissions (755 for dirs, 644 for files) >> "%DEPLOY_GUIDE%"
echo 6. Ensure uploads/ and logs/ are writable >> "%DEPLOY_GUIDE%"
echo 7. Point web server document root to public/ >> "%DEPLOY_GUIDE%"
echo 8. Enable HTTPS/SSL >> "%DEPLOY_GUIDE%"
echo 9. Test the application >> "%DEPLOY_GUIDE%"
echo 10. Set up scheduled backups >> "%DEPLOY_GUIDE%"
echo. >> "%DEPLOY_GUIDE%"
echo ================================================== >> "%DEPLOY_GUIDE%"
echo PRODUCTION CONFIGURATION >> "%DEPLOY_GUIDE%"
echo ================================================== >> "%DEPLOY_GUIDE%"
echo. >> "%DEPLOY_GUIDE%"
echo Edit config/app.php: >> "%DEPLOY_GUIDE%"
echo   - Set APP_ENV to 'production' >> "%DEPLOY_GUIDE%"
echo   - Set APP_DEBUG to false >> "%DEPLOY_GUIDE%"
echo   - Generate secure APP_KEY >> "%DEPLOY_GUIDE%"
echo   - Configure CORS_ALLOWED_ORIGINS >> "%DEPLOY_GUIDE%"
echo   - Set SESSION_COOKIE_SECURE to true >> "%DEPLOY_GUIDE%"
echo. >> "%DEPLOY_GUIDE%"
echo Edit config/database.php: >> "%DEPLOY_GUIDE%"
echo   - Update DB_HOST >> "%DEPLOY_GUIDE%"
echo   - Update DB_NAME >> "%DEPLOY_GUIDE%"
echo   - Update DB_USER >> "%DEPLOY_GUIDE%"
echo   - Update DB_PASS (use strong password) >> "%DEPLOY_GUIDE%"
echo. >> "%DEPLOY_GUIDE%"
echo ================================================== >> "%DEPLOY_GUIDE%"
echo DIRECTORY STRUCTURE >> "%DEPLOY_GUIDE%"
echo ================================================== >> "%DEPLOY_GUIDE%"
echo. >> "%DEPLOY_GUIDE%"
echo /api/              - API endpoints >> "%DEPLOY_GUIDE%"
echo /config/           - Configuration files >> "%DEPLOY_GUIDE%"
echo /database/         - Database scripts >> "%DEPLOY_GUIDE%"
echo /includes/         - PHP libraries >> "%DEPLOY_GUIDE%"
echo /languages/        - Translation files >> "%DEPLOY_GUIDE%"
echo /logs/             - Application logs (writable) >> "%DEPLOY_GUIDE%"
echo /public/           - Public web files (document root) >> "%DEPLOY_GUIDE%"
echo /uploads/          - User uploads (writable) >> "%DEPLOY_GUIDE%"
echo. >> "%DEPLOY_GUIDE%"
echo ================================================== >> "%DEPLOY_GUIDE%"
echo SECURITY CHECKLIST >> "%DEPLOY_GUIDE%"
echo ================================================== >> "%DEPLOY_GUIDE%"
echo. >> "%DEPLOY_GUIDE%"
echo [_] Enable HTTPS/SSL >> "%DEPLOY_GUIDE%"
echo [_] Configure firewall >> "%DEPLOY_GUIDE%"
echo [_] Set strong database password >> "%DEPLOY_GUIDE%"
echo [_] Restrict database user permissions >> "%DEPLOY_GUIDE%"
echo [_] Set proper file permissions >> "%DEPLOY_GUIDE%"
echo [_] Enable PHP security settings >> "%DEPLOY_GUIDE%"
echo [_] Configure CORS for specific domains >> "%DEPLOY_GUIDE%"
echo [_] Set up automated backups >> "%DEPLOY_GUIDE%"
echo [_] Enable error logging >> "%DEPLOY_GUIDE%"
echo [_] Test all security features >> "%DEPLOY_GUIDE%"
echo. >> "%DEPLOY_GUIDE%"
echo ================================================== >> "%DEPLOY_GUIDE%"
echo SUPPORT >> "%DEPLOY_GUIDE%"
echo ================================================== >> "%DEPLOY_GUIDE%"
echo. >> "%DEPLOY_GUIDE%"
echo For issues or questions: >> "%DEPLOY_GUIDE%"
echo - Review DEPLOYMENT_CHECKLIST.php >> "%DEPLOY_GUIDE%"
echo - Check logs/ directory for errors >> "%DEPLOY_GUIDE%"
echo - Verify database connectivity >> "%DEPLOY_GUIDE%"
echo - Ensure all requirements are met >> "%DEPLOY_GUIDE%"
echo. >> "%DEPLOY_GUIDE%"

echo   - Created DEPLOYMENT_GUIDE.txt

REM Copy deployment checklist
if exist "DEPLOYMENT_CHECKLIST.php" (
    copy "DEPLOYMENT_CHECKLIST.php" "%TEMP_DIR%\" >nul
    echo   - Copied DEPLOYMENT_CHECKLIST.php
)

REM Copy project complete summary
if exist "PROJECT_COMPLETE.php" (
    copy "PROJECT_COMPLETE.php" "%TEMP_DIR%\" >nul
    echo   - Copied PROJECT_COMPLETE.php
)

echo.
echo Step 3: Creating package manifest...
echo -------------------------------------------------------------------------------

set MANIFEST=%TEMP_DIR%\MANIFEST.txt

echo TSHAROK LMS - DEPLOYMENT PACKAGE MANIFEST > "%MANIFEST%"
echo ================================================== >> "%MANIFEST%"
echo. >> "%MANIFEST%"
echo Package: %PACKAGE_NAME% >> "%MANIFEST%"
echo Created: %date% %time% >> "%MANIFEST%"
echo. >> "%MANIFEST%"
echo INCLUDED FILES: >> "%MANIFEST%"
echo. >> "%MANIFEST%"

REM Count files in package
for /f %%i in ('dir /s /b /a-d "%TEMP_DIR%" ^| find /c /v ""') do set FILE_COUNT=%%i
echo Total Files: %FILE_COUNT% >> "%MANIFEST%"
echo. >> "%MANIFEST%"

echo Directories: >> "%MANIFEST%"
dir /b /ad "%TEMP_DIR%" >> "%MANIFEST%"
echo. >> "%MANIFEST%"

echo CHECKSUMS: >> "%MANIFEST%"
echo (Use for integrity verification) >> "%MANIFEST%"
echo. >> "%MANIFEST%"

echo   - Created MANIFEST.txt
echo   - Package contains %FILE_COUNT% files

echo.
echo Step 4: Compressing package...
echo -------------------------------------------------------------------------------

REM Create ZIP archive
echo   Creating ZIP archive...
7z a -tzip "%PACKAGE_DIR%\%PACKAGE_NAME%.zip" "%TEMP_DIR%\*" -mx9 >nul

if %ERRORLEVEL% EQU 0 (
    echo   [SUCCESS] Package created successfully!
    
    REM Get package size
    for %%A in ("%PACKAGE_DIR%\%PACKAGE_NAME%.zip") do set PACKAGE_SIZE=%%~zA
    set /a PACKAGE_SIZE_MB=%PACKAGE_SIZE% / 1048576
    
    echo.
    echo Step 5: Cleaning up temporary files...
    echo -------------------------------------------------------------------------------
    rmdir /s /q "%TEMP_DIR%"
    echo   [SUCCESS] Cleanup complete
    
    echo.
    echo ===============================================================================
    echo   DEPLOYMENT PACKAGE CREATED
    echo ===============================================================================
    echo.
    echo Package: %PACKAGE_NAME%.zip
    echo Location: %PACKAGE_DIR%\%PACKAGE_NAME%.zip
    echo Size: %PACKAGE_SIZE_MB% MB
    echo Files: %FILE_COUNT%
    echo.
    echo Next Steps:
    echo   1. Review DEPLOYMENT_GUIDE.txt inside the package
    echo   2. Transfer package to production server
    echo   3. Extract and configure
    echo   4. Import database
    echo   5. Test thoroughly
    echo.
    echo Package is ready for deployment!
    echo.
) else (
    echo   [ERROR] Failed to create package
    echo.
)

pause

