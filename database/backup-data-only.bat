@echo off
REM Tsharok LMS - Data-Only Backup
REM Creates a backup of database data without structure

echo.
echo ===============================================================================
echo   TSHAROK LMS - DATA-ONLY BACKUP
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
set BACKUP_FILE=%BACKUP_DIR%\tsharok_data_%TIMESTAMP%.sql

echo Backing up database data: %DB_NAME%
echo Backup file: %BACKUP_FILE%
echo.
echo Please enter MySQL password when prompted...
echo.

REM Create data-only backup (no schema)
mysqldump -u %DB_USER% --port=%DB_PORT% -p ^
    --databases %DB_NAME% ^
    --no-create-info ^
    --no-create-db ^
    --skip-triggers ^
    --complete-insert ^
    --single-transaction ^
    --set-charset ^
    --default-character-set=utf8mb4 ^
    --result-file="%BACKUP_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===============================================================================
    echo   DATA BACKUP SUCCESSFUL
    echo ===============================================================================
    echo.
    echo Data backup completed successfully!
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

