@echo off
echo ========================================
echo   Hotel Booking - Local Development
echo ========================================
echo.
echo Starting services...
echo.

REM Start backend server
echo Starting Backend API (Port 3001)...
cd backend
start cmd /k "set LOCAL_SQLITE=true && npm run dev:local"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend
cd ..
echo Starting Frontend (Port 3000)...
start cmd /k "npm run dev"

echo.
echo ========================================
echo   Services Starting...
echo ========================================
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:3001
echo Database: Local SQLite
echo.
echo Test Accounts:
echo   Admin: admin@hotelbooking.com / admin123
echo   User:  john.doe@example.com / password123
echo.
echo Press any key to close this window...
pause >nul
