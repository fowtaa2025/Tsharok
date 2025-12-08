@echo off
echo ========================================
echo Pushing Tsharok to GitHub
echo ========================================
echo.

cd /d "c:\xampp\htdocs\Tsharok"

echo Step 1: Initializing Git repository...
git init
echo.

echo Step 2: Adding all files...
git add .
echo.

echo Step 3: Creating first commit...
git commit -m "Initial commit - Tsharok with R2 cloud storage integration"
echo.

echo Step 4: Setting main branch...
git branch -M main
echo.

echo Step 5: Adding remote repository...
git remote add origin https://github.com/fowtaa2025/Tsharok.git
echo.

echo Step 6: Pushing to GitHub...
echo This may take a few minutes...
git push -u origin main
echo.

echo ========================================
echo Done! Your code is now on GitHub
echo ========================================
echo.
echo Next steps:
echo 1. Go to: https://github.com/fowtaa2025/Tsharok/settings/pages
echo 2. Select Branch: main
echo 3. Select Folder: / (root)
echo 4. Click Save
echo.
pause
