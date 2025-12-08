@echo off
REM Tsharok LMS - Restore Database Backup
REM Restores database from a backup file

echo.
echo ===============================================================================
echo   TSHAROK LMS - DATABASE RESTORE
echo ===============================================================================
echo.

REM Configuration
set DB_USER=root
set DB_PORT=3307
set BACKUP_DIR=database\backups

echo WARNING: This will restore the database from a backup file.
echo All current data will be replaced!
echo.
echo Available backup files:
echo -------------------------------------------------------------------------------
dir /b /o-d "%BACKUP_DIR%\*.sql" 2>nul
echo -------------------------------------------------------------------------------
echo.

REM Get backup file from user
set /p BACKUP_FILE="Enter the backup filename (or full path): "

REM Check if file exists
if not exist "%BACKUP_FILE%" (
    if exist "%BACKUP_DIR%\%BACKUP_FILE%" (
        set BACKUP_FILE=%BACKUP_DIR%\%BACKUP_FILE%
    ) else (
        echo.
        echo ERROR: Backup file not found: %BACKUP_FILE%
        echo.
        pause
        exit /b 1
    )
)

echo.
echo Backup file: %BACKUP_FILE%
echo.
echo WARNING: This operation will:
echo   1. Drop the existing database
echo   2. Recreate it from the backup
echo   3. All current data will be lost!
echo.
set /p CONFIRM="Are you sure you want to continue? (yes/no): "

if /i not "%CONFIRM%"=="yes" (
    echo.
    echo Restore cancelled.
    echo.
    pause
    exit /b 0
)

echo.
echo Please enter MySQL password when prompted...
echo.

REM Check if backup is compressed
if "%BACKUP_FILE:~-3%"==".gz" (
    echo Decompressing backup...
    where 7z >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        7z x "%BACKUP_FILE%" -o"%BACKUP_DIR%" -y >nul
        set "BACKUP_FILE=%BACKUP_FILE:~0,-3%"
    ) else (
        echo ERROR: 7zip not found. Cannot decompress backup.
        pause
        exit /b 1
    )
)

REM Restore database
mysql -u %DB_USER% --port=%DB_PORT% -p < "%BACKUP_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===============================================================================
    echo   RESTORE SUCCESSFUL
    echo ===============================================================================
    echo.
    echo Database restored successfully from: %BACKUP_FILE%
    echo.
) else (
    echo.
    echo ===============================================================================
    echo   RESTORE FAILED
    echo ===============================================================================
    echo.
    echo Error: Restore failed. Please check the backup file and try again.
    echo.
)

pause

