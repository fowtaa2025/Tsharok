@echo off
REM Tsharok LMS - Schema-Only Backup
REM Creates a backup of database structure without data

echo.
echo ===============================================================================
echo   TSHAROK LMS - SCHEMA-ONLY BACKUP
echo ===============================================================================
echo.

REM Configuration
set DB_NAME=tsharok
set DB_USER=root
set DB_PORT=3307
set BACKUP_DIR=database\backups
set TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

REM Create backup directory if it doesn't exist
if not exist "%BACKUP_DIR%" (
    mkdir "%BACKUP_DIR%"
)

REM Set backup filename
set BACKUP_FILE=%BACKUP_DIR%\tsharok_schema_%TIMESTAMP%.sql

echo Backing up database schema: %DB_NAME%
echo Backup file: %BACKUP_FILE%
echo.
echo Please enter MySQL password when prompted...
echo.

REM Create schema-only backup (no data)
mysqldump -u %DB_USER% --port=%DB_PORT% -p ^
    --databases %DB_NAME% ^
    --no-data ^
    --add-drop-database ^
    --add-drop-table ^
    --routines ^
    --triggers ^
    --events ^
    --set-charset ^
    --default-character-set=utf8mb4 ^
    --result-file="%BACKUP_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===============================================================================
    echo   SCHEMA BACKUP SUCCESSFUL
    echo ===============================================================================
    echo.
    echo Schema backup completed successfully!
    echo File: %BACKUP_FILE%
    echo.
) else (
    echo.
    echo ===============================================================================
    echo   BACKUP FAILED
    echo ===============================================================================
    echo.
)

pause

