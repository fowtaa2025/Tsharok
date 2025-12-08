@echo off
REM Tsharok LMS - Complete Deployment Preparation
REM Master script that runs all deployment preparation steps

echo.
echo ===============================================================================
echo   TSHAROK LMS - DEPLOYMENT PREPARATION
echo ===============================================================================
echo.
echo This script will prepare your application for production deployment by:
echo   1. Verifying production configuration
echo   2. Running pre-deployment validation
echo   3. Creating final database backup
echo   4. Cleaning up development files
echo   5. Creating deployment package
echo.
echo This process will take a few minutes.
echo.
echo Press any key to start...
pause >nul
echo.

REM Step 1: Verify Production Configuration
echo ===============================================================================
echo   STEP 1: Verifying Production Configuration
echo ===============================================================================
echo.

php deployment\verify-production-config.php

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [WARNING] Configuration issues detected!
    echo.
    set /p CONTINUE="Continue anyway? (yes/no): "
    if /i not "!CONTINUE!"=="yes" (
        echo.
        echo Deployment preparation cancelled.
        echo Fix configuration issues and try again.
        echo.
        pause
        exit /b 1
    )
)

echo.
echo Press any key to continue...
pause >nul
echo.

REM Step 2: Pre-Deployment Validation
echo ===============================================================================
echo   STEP 2: Running Pre-Deployment Validation
echo ===============================================================================
echo.

php deployment\pre-deployment-validation.php

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [WARNING] Critical issues detected!
    echo.
    set /p CONTINUE="Continue anyway? (yes/no): "
    if /i not "!CONTINUE!"=="yes" (
        echo.
        echo Deployment preparation cancelled.
        echo Fix critical issues and try again.
        echo.
        pause
        exit /b 1
    )
)

echo.
echo Press any key to continue...
pause >nul
echo.

REM Step 3: Create Final Database Backup
echo ===============================================================================
echo   STEP 3: Creating Final Database Backup
echo ===============================================================================
echo.
echo IMPORTANT: Creating a backup before proceeding...
echo.

call database\create-final-backup.bat

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [WARNING] Backup failed!
    echo.
    set /p CONTINUE="Continue without backup? (yes/no): "
    if /i not "!CONTINUE!"=="yes" (
        echo.
        echo Deployment preparation cancelled.
        echo Create a backup manually and try again.
        echo.
        pause
        exit /b 1
    )
)

echo.
echo Press any key to continue...
pause >nul
echo.

REM Step 4: Cleanup Development Files
echo ===============================================================================
echo   STEP 4: Cleaning Up Development Files
echo ===============================================================================
echo.

call deployment\cleanup-dev-files.bat

echo.
echo Press any key to continue...
pause >nul
echo.

REM Step 5: Create Deployment Package
echo ===============================================================================
echo   STEP 5: Creating Deployment Package
echo ===============================================================================
echo.

call deployment\create-deployment-package.bat

echo.
echo ===============================================================================
echo   DEPLOYMENT PREPARATION COMPLETE
echo ===============================================================================
echo.
echo Your application is ready for deployment!
echo.
echo Next Steps:
echo   1. Review deployment package in: deployment\packages\
echo   2. Transfer package to production server
echo   3. Extract and configure on server
echo   4. Test thoroughly before going live
echo.
echo Documentation:
echo   - DEPLOYMENT_GUIDE.txt (in package)
echo   - DEPLOYMENT_CHECKLIST.php
echo   - PROJECT_COMPLETE.php
echo.
echo Good luck with your deployment!
echo.

pause

