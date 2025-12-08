@echo off
REM Tsharok LMS - Database Optimization Script
REM Run this to add performance indexes

echo ========================================
echo Tsharok LMS - Database Optimization
echo ========================================
echo.

echo WARNING: This will add indexes to your database.
echo Make sure you have a backup before proceeding!
echo.
pause

echo.
echo Adding performance indexes...
echo.

REM Run the optimization SQL script
mysql -u root --port=3307 -p tsharok < database\optimize-indexes.sql

echo.
echo ========================================
echo Optimization Complete!
echo ========================================
echo.
echo Indexes have been added to improve query performance.
echo.
echo Recommendations:
echo 1. Run ANALYZE TABLE on all tables (already done in script)
echo 2. Monitor query performance using EXPLAIN
echo 3. Review slow query log regularly
echo 4. Consider query caching for frequently accessed data
echo.

pause

