@echo off
REM Tsharok LMS - Database Audit Script
REM Run this to audit database security and performance

echo ========================================
echo Tsharok LMS - Security & Performance Audit
echo ========================================
echo.

echo Running database audit...
echo.

REM Run the audit SQL script
mysql -u root --port=3307 -p tsharok < database\audit-compliance.sql

echo.
echo ========================================
echo Audit Complete!
echo ========================================
echo.
echo Please review the output above for:
echo - Missing indexes
echo - Security issues
echo - Performance problems
echo - Data integrity issues
echo.
echo Next steps:
echo 1. Run optimize-indexes.sql if indexes are missing
echo 2. Review AUDIT_COMPLETE.php for full report
echo 3. Schedule cleanup-scripts.php to run weekly
echo.

pause

