@echo off
echo Starting Vibe Hotel Bookings Deployment...
echo.
cd /d C:\dev\projects\web-apps\hotelbooking
powershell -ExecutionPolicy Bypass -File deploy.ps1
echo.
echo Deployment process completed!
pause