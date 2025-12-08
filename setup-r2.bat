@echo off
REM Cloudflare R2 Setup Script
REM This script helps you configure R2 credentials

echo ========================================
echo Cloudflare R2 Setup
echo ========================================
echo.

REM Check if .env already exists
if exist .env (
    echo .env file already exists!
    echo.
    set /p overwrite="Do you want to overwrite it? (y/n): "
    if /i not "%overwrite%"=="y" (
        echo Setup cancelled.
        pause
        exit /b
    )
)

echo.
echo Please enter your Cloudflare R2 credentials:
echo (You can find these in your Cloudflare dashboard)
echo.

set /p account_id="R2 Account ID: "
set /p access_key="R2 Access Key ID: "
set /p secret_key="R2 Secret Access Key: "
set /p bucket_name="R2 Bucket Name: "
set /p public_url="R2 Public URL (optional, press Enter to skip): "

echo.
set /p enable_r2="Enable R2 storage now? (y/n): "

if /i "%enable_r2%"=="y" (
    set use_r2=true
) else (
    set use_r2=false
)

echo.
echo Creating .env file...

(
echo # Cloudflare R2 Configuration
echo # Generated on %date% %time%
echo.
echo # Your Cloudflare Account ID
echo R2_ACCOUNT_ID=%account_id%
echo.
echo # R2 API Token credentials
echo R2_ACCESS_KEY_ID=%access_key%
echo R2_SECRET_ACCESS_KEY=%secret_key%
echo.
echo # R2 Bucket name
echo R2_BUCKET_NAME=%bucket_name%
echo.
echo # R2 Region
echo R2_REGION=auto
echo.
echo # Enable/Disable R2 storage
echo USE_R2_STORAGE=%use_r2%
echo.
echo # Public URL for R2 bucket
echo R2_PUBLIC_URL=%public_url%
) > .env

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo .env file has been created with your R2 credentials.
echo.
echo Next steps:
echo 1. Install AWS SDK: composer require aws/aws-sdk-php
echo 2. Test connection: php tests\test-r2-connection.php
echo 3. Start uploading files!
echo.
echo IMPORTANT: Never commit the .env file to version control!
echo.
pause
