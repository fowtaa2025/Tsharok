-- ===============================================================================
-- TSHAROK LMS - DATABASE BACKUP INSTRUCTIONS
-- ===============================================================================
-- This file contains instructions and SQL commands for database backup/restore
-- 
-- IMPORTANT: Read this file before performing backup or restore operations
-- ===============================================================================

-- ===============================================================================
-- QUICK START
-- ===============================================================================

/*
CREATE FINAL BACKUP (Recommended):
-----------------------------------
1. Double-click: database\create-final-backup.bat
2. Enter MySQL password when prompted
3. Wait for backup to complete
4. Backup will be in: database\final-backup\

RESTORE FROM BACKUP:
--------------------
1. Double-click: database\restore-backup.bat
2. Select backup file from list
3. Confirm restoration (WARNING: This will replace all data!)
4. Enter MySQL password
5. Wait for restoration to complete

VERIFY BACKUP:
--------------
php database\verify-backup.php database\backups\[backup-file.sql]
*/

-- ===============================================================================
-- MANUAL BACKUP COMMANDS
-- ===============================================================================

/*
FULL BACKUP (Schema + Data):
-----------------------------
mysqldump -u root --port=3307 -p \
  --databases tsharok \
  --add-drop-database \
  --add-drop-table \
  --routines \
  --triggers \
  --events \
  --single-transaction \
  --set-charset \
  --default-character-set=utf8mb4 \
  --complete-insert \
  --result-file=backup.sql

SCHEMA ONLY:
------------
mysqldump -u root --port=3307 -p \
  --databases tsharok \
  --no-data \
  --routines \
  --triggers \
  --events \
  --result-file=schema.sql

DATA ONLY:
----------
mysqldump -u root --port=3307 -p \
  --databases tsharok \
  --no-create-info \
  --skip-triggers \
  --complete-insert \
  --result-file=data.sql

SPECIFIC TABLES:
----------------
mysqldump -u root --port=3307 -p \
  tsharok users courses enrollments \
  --result-file=tables.sql

COMPRESSED BACKUP:
------------------
mysqldump -u root --port=3307 -p \
  --databases tsharok \
  --single-transaction | gzip > backup.sql.gz
*/

-- ===============================================================================
-- MANUAL RESTORE COMMANDS
-- ===============================================================================

/*
RESTORE FROM BACKUP:
--------------------
mysql -u root --port=3307 -p < backup.sql

RESTORE COMPRESSED:
-------------------
gunzip < backup.sql.gz | mysql -u root --port=3307 -p

RESTORE SPECIFIC DATABASE:
---------------------------
mysql -u root --port=3307 -p tsharok < backup.sql

RESTORE WITH VERBOSE OUTPUT:
-----------------------------
mysql -u root --port=3307 -p --verbose < backup.sql
*/

-- ===============================================================================
-- BACKUP VERIFICATION QUERIES
-- ===============================================================================

-- Check database size
SELECT 
    table_schema AS 'Database',
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables 
WHERE table_schema = 'tsharok'
GROUP BY table_schema;

-- Count records in all tables
SELECT 
    table_name AS 'Table',
    table_rows AS 'Rows'
FROM information_schema.tables
WHERE table_schema = 'tsharok'
ORDER BY table_rows DESC;

-- Check last backup date (if you maintain a backup log table)
-- SELECT MAX(backup_date) AS 'Last Backup' FROM backup_log;

-- List all tables
SHOW TABLES FROM tsharok;

-- Check table structure
SHOW CREATE TABLE tsharok.users;
SHOW CREATE TABLE tsharok.courses;
SHOW CREATE TABLE tsharok.content;

-- Check stored procedures
SHOW PROCEDURE STATUS WHERE Db = 'tsharok';

-- Check triggers
SELECT 
    TRIGGER_NAME,
    EVENT_MANIPULATION,
    EVENT_OBJECT_TABLE
FROM information_schema.TRIGGERS
WHERE TRIGGER_SCHEMA = 'tsharok';

-- ===============================================================================
-- BACKUP BEST PRACTICES
-- ===============================================================================

/*
1. BACKUP FREQUENCY:
   - Production: Daily backups (automated)
   - Development: Before major changes
   - Before deployment: Always

2. BACKUP RETENTION:
   - Keep daily backups for 7 days
   - Keep weekly backups for 1 month
   - Keep monthly backups for 1 year
   - Keep pre-deployment backups indefinitely

3. BACKUP STORAGE:
   - Store in multiple locations
   - Use external storage (USB, cloud)
   - Encrypt sensitive backups
   - Test restoration regularly

4. BACKUP VERIFICATION:
   - Verify backup immediately after creation
   - Test restore on non-production server
   - Check backup file size and integrity
   - Validate table counts match

5. AUTOMATION:
   - Use scheduled tasks (database\schedule-backups.bat)
   - Monitor backup success/failure
   - Alert on backup failures
   - Log all backup operations

6. SECURITY:
   - Protect backup files with passwords
   - Limit access to backup files
   - Encrypt backups containing sensitive data
   - Secure backup transfer (SFTP, encrypted)

7. DOCUMENTATION:
   - Document backup procedures
   - Keep backup manifest files
   - Track backup versions
   - Note any special restoration requirements
*/

-- ===============================================================================
-- EMERGENCY RECOVERY PROCEDURE
-- ===============================================================================

/*
IN CASE OF DATABASE FAILURE:

1. ASSESS THE SITUATION:
   - Identify what data was lost
   - Determine when the failure occurred
   - Find the most recent backup before failure

2. PREPARE FOR RESTORATION:
   - Stop application (stop web server)
   - Backup current state (even if corrupted)
   - Verify backup file integrity
   - Test on non-production first (if possible)

3. RESTORE DATABASE:
   - Run: database\restore-backup.bat
   - Select most recent valid backup
   - Wait for restoration to complete
   - Verify restoration success

4. VERIFY DATA INTEGRITY:
   - Check table counts
   - Verify critical user accounts
   - Test application functionality
   - Check for missing data

5. RESUME OPERATIONS:
   - Restart application
   - Monitor for errors
   - Inform users if needed
   - Document the incident

6. POST-RECOVERY:
   - Investigate cause of failure
   - Improve backup strategy if needed
   - Update recovery documentation
   - Consider increased backup frequency
*/

-- ===============================================================================
-- BACKUP FILE NAMING CONVENTION
-- ===============================================================================

/*
Format: tsharok_[type]_YYYYMMDD_HHMMSS.sql

Types:
- full     : Complete backup (schema + data)
- schema   : Structure only
- data     : Data only
- final    : Production-ready backup

Examples:
- tsharok_full_20250119_140532.sql
- tsharok_schema_20250119_140532.sql
- tsharok_final_backup_20250119_140532.sql
- tsharok_final_backup_20250119_140532.zip (compressed)

Manifest File:
- backup_manifest_20250119_140532.txt
*/

-- ===============================================================================
-- MAINTENANCE QUERIES
-- ===============================================================================

-- Optimize all tables
USE tsharok;
SELECT CONCAT('OPTIMIZE TABLE ', table_name, ';') 
FROM information_schema.tables 
WHERE table_schema = 'tsharok';

-- Check table status
CHECK TABLE users, courses, content, enrollments;

-- Analyze tables for query optimization
ANALYZE TABLE users, courses, content, enrollments;

-- Repair tables if corrupted (use with caution!)
-- REPAIR TABLE table_name;

-- ===============================================================================
-- END OF BACKUP INSTRUCTIONS
-- ===============================================================================

-- For questions or issues, refer to:
-- - Database administrator
-- - System documentation
-- - Backup verification script: database\verify-backup.php

