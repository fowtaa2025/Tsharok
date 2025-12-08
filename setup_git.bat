@echo off
echo ============================================
echo Tsharok Project - Git Setup
echo ============================================
echo.

REM Initialize Git repository
echo Initializing Git repository...
git init
if errorlevel 1 (
    echo ERROR: Failed to initialize Git repository
    pause
    exit /b 1
)

echo.
echo Adding .gitignore file...
git add .gitignore

echo.
echo Adding project files to Git...
git add .
git status

echo.
echo ============================================
echo Git repository initialized successfully!
echo ============================================
echo.
echo Next steps:
echo 1. Review the files to be committed with: git status
echo 2. Create your first commit with: git commit -m "Initial commit: MySQL schema and project structure"
echo 3. (Optional) Add remote repository: git remote add origin YOUR_REPO_URL
echo 4. (Optional) Push to remote: git push -u origin master
echo.
pause

