@echo off
REM Tsharok LMS - Create Final Production Backup
REM Creates a comprehensive backup with verification

echo.
echo ===============================================================================
echo   TSHAROK LMS - FINAL PRODUCTION BACKUP
echo ===============================================================================
echo.
echo This script will create a comprehensive backup of your database including:
echo   - Complete database schema
echo   - All data
echo   - Stored procedures and triggers
echo   - Verification of backup integrity
echo.
echo Press any key to start backup...
pause >nul
echo.

REM Configuration
set DB_NAME=tsharok
set DB_USER=root
set DB_PORT=3307
set BACKUP_DIR=database\backups
set FINAL_DIR=database\final-backup
set TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

REM Create directories
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
if not exist "%FINAL_DIR%" mkdir "%FINAL_DIR%"

echo ===============================================================================
echo   STEP 1: Creating Full Database Backup
echo ===============================================================================
echo.

set BACKUP_FILE=%FINAL_DIR%\tsharok_final_backup_%TIMESTAMP%.sql

echo Backing up database: %DB_NAME%
echo Target file: %BACKUP_FILE%
echo.
echo Please enter MySQL password when prompted...
echo.

REM Create full backup with all options
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
    --hex-blob ^
    --complete-insert ^
    --comments ^
    --dump-date ^
    --order-by-primary ^
    --result-file="%BACKUP_FILE%"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Backup failed!
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Full backup completed!
echo.

REM Get file size
for %%A in ("%BACKUP_FILE%") do set FILESIZE=%%~zA
set /a FILESIZE_MB=%FILESIZE% / 1048576

echo File: %BACKUP_FILE%
echo Size: %FILESIZE_MB% MB
echo.

echo ===============================================================================
echo   STEP 2: Creating Schema-Only Backup
echo ===============================================================================
echo.

set SCHEMA_FILE=%FINAL_DIR%\tsharok_schema_%TIMESTAMP%.sql

mysqldump -u %DB_USER% --port=%DB_PORT% -p ^
    --databases %DB_NAME% ^
    --no-data ^
    --routines ^
    --triggers ^
    --events ^
    --result-file="%SCHEMA_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Schema backup completed!
    echo File: %SCHEMA_FILE%
) else (
    echo [WARNING] Schema backup failed (non-critical)
)

echo.
echo ===============================================================================
echo   STEP 3: Verifying Backup Integrity
echo ===============================================================================
echo.

php database\verify-backup.php "%BACKUP_FILE%"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [WARNING] Backup verification found issues!
    echo Review the output above and proceed with caution.
    echo.
) else (
    echo.
    echo [SUCCESS] Backup verified successfully!
    echo.
)

echo ===============================================================================
echo   STEP 4: Creating Backup Manifest
echo ===============================================================================
echo.

REM Create manifest file
set MANIFEST_FILE=%FINAL_DIR%\backup_manifest_%TIMESTAMP%.txt

echo TSHAROK LMS - FINAL BACKUP MANIFEST > "%MANIFEST_FILE%"
echo ================================================== >> "%MANIFEST_FILE%"
echo. >> "%MANIFEST_FILE%"
echo Backup Date: %date% %time% >> "%MANIFEST_FILE%"
echo Database: %DB_NAME% >> "%MANIFEST_FILE%"
echo. >> "%MANIFEST_FILE%"
echo Files Created: >> "%MANIFEST_FILE%"
echo   - Full Backup: %BACKUP_FILE% (%FILESIZE_MB% MB) >> "%MANIFEST_FILE%"
echo   - Schema Only: %SCHEMA_FILE% >> "%MANIFEST_FILE%"
echo. >> "%MANIFEST_FILE%"
echo Backup Includes: >> "%MANIFEST_FILE%"
echo   - Complete database schema >> "%MANIFEST_FILE%"
echo   - All table data >> "%MANIFEST_FILE%"
echo   - Stored procedures and functions >> "%MANIFEST_FILE%"
echo   - Triggers >> "%MANIFEST_FILE%"
echo   - Events >> "%MANIFEST_FILE%"
echo. >> "%MANIFEST_FILE%"
echo To Restore: >> "%MANIFEST_FILE%"
echo   mysql -u root --port=3307 -p ^< "%BACKUP_FILE%" >> "%MANIFEST_FILE%"
echo. >> "%MANIFEST_FILE%"

echo [SUCCESS] Manifest created: %MANIFEST_FILE%
echo.

echo ===============================================================================
echo   STEP 5: Compressing Backup (Optional)
echo ===============================================================================
echo.

where 7z >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Compressing backup files...
    7z a -tzip "%FINAL_DIR%\tsharok_final_backup_%TIMESTAMP%.zip" "%BACKUP_FILE%" "%SCHEMA_FILE%" "%MANIFEST_FILE%" -mx9 >nul
    
    if %ERRORLEVEL% EQU 0 (
        echo [SUCCESS] Backup compressed!
        
        for %%A in ("%FINAL_DIR%\tsharok_final_backup_%TIMESTAMP%.zip") do set ZIPSIZE=%%~zA
        set /a ZIPSIZE_MB=%ZIPSIZE% / 1048576
        
        echo Compressed file: tsharok_final_backup_%TIMESTAMP%.zip
        echo Compressed size: %ZIPSIZE_MB% MB
        echo.
        
        echo Delete uncompressed files? (Y/N)
        set /p DELETE_UNCOMPRESSED="Enter your choice: "
        
        if /i "%DELETE_UNCOMPRESSED%"=="Y" (
            del "%BACKUP_FILE%"
            del "%SCHEMA_FILE%"
            echo Uncompressed files deleted.
        )
    ) else (
        echo [WARNING] Compression failed (non-critical)
    )
) else (
    echo 7zip not found - skipping compression
    echo Install 7zip for automatic backup compression
)

echo.
echo ===============================================================================
echo   FINAL BACKUP COMPLETE
echo ===============================================================================
echo.
echo Backup Summary:
echo   Location: %FINAL_DIR%\
echo   Full Backup: %FILESIZE_MB% MB
echo   Timestamp: %TIMESTAMP%
echo.
echo Files created:
dir /b "%FINAL_DIR%\*%TIMESTAMP%*"
echo.
echo IMPORTANT:
echo   1. Store backup in a safe location
echo   2. Keep backup on external storage
echo   3. Test restoration periodically
echo   4. Keep multiple backup versions
echo.
echo Backup location: %cd%\%FINAL_DIR%\
echo.

pause

