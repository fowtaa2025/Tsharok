@echo off
REM Tsharok LMS - Cleanup Development Files
REM Removes all development and testing files for production deployment

echo.
echo ===============================================================================
echo   TSHAROK LMS - DEVELOPMENT FILES CLEANUP
echo ===============================================================================
echo.
echo This script will remove all development and testing files to prepare for
echo production deployment.
echo.
echo Files to be removed:
echo   - Test scripts and data
echo   - Development documentation
echo   - Example files
echo   - Temporary files
echo   - Debug files
echo.
echo WARNING: This action cannot be undone!
echo.
set /p CONFIRM="Are you sure you want to continue? (yes/no): "

if /i not "%CONFIRM%"=="yes" (
    echo.
    echo Cleanup cancelled.
    echo.
    pause
    exit /b 0
)

echo.
echo Starting cleanup...
echo ===============================================================================
echo.

REM Create cleanup log
set CLEANUP_LOG=deployment\cleanup-log.txt
echo Tsharok LMS - Development Files Cleanup > "%CLEANUP_LOG%"
echo Date: %date% %time% >> "%CLEANUP_LOG%"
echo ================================================== >> "%CLEANUP_LOG%"
echo. >> "%CLEANUP_LOG%"

REM Cleanup test directory
echo [1/10] Cleaning test files...
if exist "tests\" (
    echo   Removing tests\ directory...
    rmdir /s /q "tests\" 2>nul
    echo   - Removed tests\ directory >> "%CLEANUP_LOG%"
    echo   [SUCCESS] Tests removed
) else (
    echo   [SKIP] Tests directory not found
)
echo.

REM Remove test data files
echo [2/10] Cleaning test data...
if exist "tests\test-data-manifest.json" (
    del "tests\test-data-manifest.json" 2>nul
    echo   - Removed test data manifest >> "%CLEANUP_LOG%"
)
if exist "tests\*-results.json" (
    del "tests\*-results.json" 2>nul
    echo   - Removed test result files >> "%CLEANUP_LOG%"
)
echo   [SUCCESS] Test data cleaned
echo.

REM Remove development documentation
echo [3/10] Cleaning development documentation...
if exist "TESTING_COMPLETE.php" (
    del "TESTING_COMPLETE.php"
    echo   - Removed TESTING_COMPLETE.php >> "%CLEANUP_LOG%"
)
if exist "AUDIT_COMPLETE.php" (
    del "AUDIT_COMPLETE.php"
    echo   - Removed AUDIT_COMPLETE.php >> "%CLEANUP_LOG%"
)
if exist "QUICK-START-TESTING.bat" (
    del "QUICK-START-TESTING.bat"
    echo   - Removed QUICK-START-TESTING.bat >> "%CLEANUP_LOG%"
)
if exist "security-testing-guide.php" (
    del "security-testing-guide.php"
    echo   - Removed security-testing-guide.php >> "%CLEANUP_LOG%"
)
if exist "SECURITY_HARDENING_SUMMARY.php" (
    del "SECURITY_HARDENING_SUMMARY.php"
    echo   - Removed SECURITY_HARDENING_SUMMARY.php >> "%CLEANUP_LOG%"
)
if exist "SECURITY_QUICK_REFERENCE.php" (
    del "SECURITY_QUICK_REFERENCE.php"
    echo   - Removed SECURITY_QUICK_REFERENCE.php >> "%CLEANUP_LOG%"
)
echo   [SUCCESS] Development docs removed
echo.

REM Remove example files
echo [4/10] Cleaning example files...
if exist "includes\i18n-usage-example.php" (
    del "includes\i18n-usage-example.php"
    echo   - Removed i18n-usage-example.php >> "%CLEANUP_LOG%"
)
if exist "public\i18n-demo.html" (
    del "public\i18n-demo.html"
    echo   - Removed i18n-demo.html >> "%CLEANUP_LOG%"
)
echo   [SUCCESS] Example files removed
echo.

REM Clean logs directory
echo [5/10] Cleaning old logs...
if exist "logs\" (
    del "logs\*.log" 2>nul
    echo   - Cleared log files >> "%CLEANUP_LOG%"
    echo   [SUCCESS] Logs cleaned
) else (
    echo   [SKIP] Logs directory not found
)
echo.

REM Remove temporary backups
echo [6/10] Cleaning temporary backups...
if exist "database\backups\*.sql" (
    echo   Found backup files in database\backups\
    set /p DELETE_BACKUPS="  Delete temporary backups? (y/n): "
    if /i "!DELETE_BACKUPS!"=="y" (
        del "database\backups\*.sql" 2>nul
        echo   - Removed temporary backup files >> "%CLEANUP_LOG%"
        echo   [SUCCESS] Temporary backups removed
    ) else (
        echo   [SKIP] Backups preserved
    )
) else (
    echo   [SKIP] No temporary backups found
)
echo.

REM Remove database audit files
echo [7/10] Cleaning database audit files...
if exist "database\security-audit.sql" (
    del "database\security-audit.sql"
    echo   - Removed security-audit.sql >> "%CLEANUP_LOG%"
)
if exist "database\audit-compliance.sql" (
    del "database\audit-compliance.sql"
    echo   - Removed audit-compliance.sql >> "%CLEANUP_LOG%"
)
echo   [SUCCESS] Audit files removed
echo.

REM Remove development batch files
echo [8/10] Cleaning development scripts...
if exist "run-audit.bat" (
    del "run-audit.bat"
    echo   - Removed run-audit.bat >> "%CLEANUP_LOG%"
)
if exist "setup_admin_system.bat" (
    del "setup_admin_system.bat"
    echo   - Removed setup_admin_system.bat >> "%CLEANUP_LOG%"
)
if exist "setup_multilingual.bat" (
    del "setup_multilingual.bat"
    echo   - Removed setup_multilingual.bat >> "%CLEANUP_LOG%"
)
echo   [SUCCESS] Development scripts removed
echo.

REM Clean uploads staging area
echo [9/10] Cleaning uploads staging area...
if exist "uploads\staging\*.*" (
    set /p CLEAN_STAGING="  Clean staging uploads? (y/n): "
    if /i "!CLEAN_STAGING!"=="y" (
        del "uploads\staging\*.*" /q 2>nul
        echo   - Cleared staging uploads >> "%CLEANUP_LOG%"
        echo   [SUCCESS] Staging area cleaned
    ) else (
        echo   [SKIP] Staging preserved
    )
) else (
    echo   [SKIP] Staging area already empty
)
echo.

REM Remove git-related files (if any)
echo [10/10] Cleaning version control files...
if exist ".gitignore" (
    echo   Found .gitignore (keeping)
    echo   - Preserved .gitignore >> "%CLEANUP_LOG%"
)
if exist ".git\" (
    echo   WARNING: .git directory found
    echo   Consider removing if deploying without version control
    echo   - .git directory found >> "%CLEANUP_LOG%"
)
echo   [SUCCESS] Version control checked
echo.

REM Summary
echo ===============================================================================
echo   CLEANUP COMPLETE
echo ===============================================================================
echo.
echo Development files have been removed from the application.
echo.
echo Cleanup log saved to: %CLEANUP_LOG%
echo.
echo Remaining steps:
echo   1. Run: deployment\verify-production-config.php
echo   2. Run: deployment\create-deployment-package.bat
echo   3. Review: DEPLOYMENT_CHECKLIST.php
echo.
echo Your application is ready for production packaging!
echo.

pause

