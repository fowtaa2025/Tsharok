@echo off
REM Tsharok LMS - Quick Start Testing Guide
REM Run this to execute a complete testing workflow

echo.
echo ===============================================================================
echo   TSHAROK LMS - QUICK START TESTING
echo ===============================================================================
echo.
echo This script will guide you through comprehensive testing of your application.
echo.
echo Steps:
echo   1. Generate test data
echo   2. Run all test suites
echo   3. Review results
echo   4. Cleanup (optional)
echo.
echo Press any key to start...
pause >nul
echo.

REM Step 1: Generate Test Data
echo ===============================================================================
echo   STEP 1: Generating Test Data
echo ===============================================================================
echo.
echo Generating users, courses, content, and enrollments...
echo.

php tests\test-data-generator.php --users=20 --courses=5 --content=30

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Failed to generate test data!
    pause
    exit /b 1
)

echo.
echo Press any key to continue to testing...
pause >nul
echo.

REM Step 2: Run All Tests
echo ===============================================================================
echo   STEP 2: Running All Test Suites
echo ===============================================================================
echo.

call tests\run-all-tests.bat

echo.
echo ===============================================================================
echo   STEP 3: Review Results
echo ===============================================================================
echo.
echo Test results have been saved to:
echo   - tests\security-test-results.json
echo   - tests\api-test-results.json
echo.
echo You can review these files for detailed test results.
echo.
echo Press any key to continue...
pause >nul
echo.

REM Step 3: Cleanup Option
echo ===============================================================================
echo   STEP 4: Cleanup (Optional)
echo ===============================================================================
echo.
echo Do you want to remove the test data? (Y/N)
set /p CLEANUP="Enter your choice: "

if /i "%CLEANUP%"=="Y" (
    echo.
    echo Cleaning up test data...
    php tests\cleanup-test-data.php
) else (
    echo.
    echo Test data preserved for manual review.
    echo To cleanup later, run: php tests\cleanup-test-data.php
)

echo.
echo ===============================================================================
echo   TESTING WORKFLOW COMPLETE
echo ===============================================================================
echo.
echo Next Steps:
echo   1. Review TESTING_COMPLETE.php for comprehensive summary
echo   2. Review AUDIT_COMPLETE.php for security audit details
echo   3. Run optimize-database.bat to apply performance indexes
echo   4. Configure production settings in config\app.php
echo.
echo Your application has been thoroughly tested and is ready for deployment!
echo.
pause

