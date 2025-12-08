@echo off
REM Tsharok LMS - Schedule Automated Backups
REM Sets up Windows Task Scheduler for automatic backups

echo.
echo ===============================================================================
echo   TSHAROK LMS - SCHEDULE AUTOMATED BACKUPS
echo ===============================================================================
echo.
echo This script will set up automated backups using Windows Task Scheduler.
echo.
echo Backup schedules:
echo   - Daily backup at 2:00 AM
echo   - Weekly full backup on Sunday at 3:00 AM
echo.

set CURRENT_DIR=%cd%
set BACKUP_SCRIPT=%CURRENT_DIR%\database\backup-full.bat

echo Current directory: %CURRENT_DIR%
echo Backup script: %BACKUP_SCRIPT%
echo.
echo Press any key to continue...
pause >nul
echo.

REM Check if running as administrator
net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: This script requires Administrator privileges!
    echo Please run as Administrator.
    echo.
    pause
    exit /b 1
)

echo Creating scheduled tasks...
echo.

REM Create daily backup task
echo Creating daily backup task...
schtasks /Create /TN "Tsharok_Daily_Backup" /TR "\"%BACKUP_SCRIPT%\"" /SC DAILY /ST 02:00 /F /RU SYSTEM

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Daily backup scheduled for 2:00 AM
) else (
    echo [ERROR] Failed to create daily backup task
)

echo.

REM Create weekly backup task
echo Creating weekly full backup task...
schtasks /Create /TN "Tsharok_Weekly_Backup" /TR "\"%BACKUP_SCRIPT%\"" /SC WEEKLY /D SUN /ST 03:00 /F /RU SYSTEM

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Weekly backup scheduled for Sunday 3:00 AM
) else (
    echo [ERROR] Failed to create weekly backup task
)

echo.
echo ===============================================================================
echo   SCHEDULED TASKS CREATED
echo ===============================================================================
echo.
echo Your backups are now scheduled:
echo   - Daily: 2:00 AM
echo   - Weekly Full: Sunday 3:00 AM
echo.
echo To view scheduled tasks:
echo   schtasks /Query /TN "Tsharok_Daily_Backup"
echo   schtasks /Query /TN "Tsharok_Weekly_Backup"
echo.
echo To delete scheduled tasks:
echo   schtasks /Delete /TN "Tsharok_Daily_Backup" /F
echo   schtasks /Delete /TN "Tsharok_Weekly_Backup" /F
echo.
echo To run backup manually now:
echo   schtasks /Run /TN "Tsharok_Daily_Backup"
echo.

pause

