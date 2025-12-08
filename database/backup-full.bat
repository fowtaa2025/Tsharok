@echo off
REM Tsharok LMS - Full Database Backup (Schema + Data)
REM Creates a complete backup of the database

echo.
echo ===============================================================================
echo   TSHAROK LMS - FULL DATABASE BACKUP
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
    echo Created backup directory: %BACKUP_DIR%
)

REM Set backup filename
set BACKUP_FILE=%BACKUP_DIR%\tsharok_full_%TIMESTAMP%.sql

echo Backing up database: %DB_NAME%
echo Backup file: %BACKUP_FILE%
echo.
echo Please enter MySQL password when prompted...
echo.

REM Create full backup (schema + data)
mysqldump -u %DB_USER% --port=%DB_PORT% -p ^
    --databases %DB_NAME% ^
    --add-drop-database ^
    --add-drop-table ^
    --routines ^
    --triggers ^
    --events ^
    --single-transaction ^
    --set-charset ^
    --default-character-set=utf8mb4 ^
    --comments ^
    --dump-date ^
    --result-file="%BACKUP_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===============================================================================
    echo   BACKUP SUCCESSFUL
    echo ===============================================================================
    echo.
    echo Backup completed successfully!
    echo.
    
    REM Get file size
    for %%A in ("%BACKUP_FILE%") do set FILESIZE=%%~zA
    set /a FILESIZE_MB=%FILESIZE% / 1048576
    
    echo File: %BACKUP_FILE%
    echo Size: %FILESIZE_MB% MB
    echo.
    
    REM Compress backup (optional - requires 7zip)
    where 7z >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo Compressing backup...
        7z a -tgzip "%BACKUP_FILE%.gz" "%BACKUP_FILE%" -mx9 >nul
        if %ERRORLEVEL% EQU 0 (
            echo Compressed: %BACKUP_FILE%.gz
            del "%BACKUP_FILE%"
        )
    )
    
    echo.
    echo Backup location: %BACKUP_DIR%\
    echo.
    
) else (
    echo.
    echo ===============================================================================
    echo   BACKUP FAILED
    echo ===============================================================================
    echo.
    echo Error: Backup failed. Please check your database connection.
    echo.
)

pause

