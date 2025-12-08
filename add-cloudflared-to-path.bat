@echo off
echo Adding cloudflared to PATH...
echo.

REM Add cloudflared to system PATH
setx PATH "%PATH%;C:\Program Files\cloudflared" /M

echo.
echo ========================================
echo Done! cloudflared added to PATH
echo ========================================
echo.
echo IMPORTANT: Close this window and open a NEW Command Prompt
echo Then try: cloudflared --version
echo.
pause
