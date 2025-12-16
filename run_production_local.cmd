@echo off
echo [INFO] Starting SolisTech Pro (Local Production Mode)
echo [INFO] Bypassing Docker due to Daemon I/O Error...
echo.

:: Configuration (Auto-detected from docker ps: Port 5435)
set DATABASE_URL=postgresql://solistech:solistech_secure_2024@127.0.0.1:5435/solistech_pro?schema=public
set NEXT_PUBLIC_APP_URL=http://localhost:3000
set AUTH_SECRET=solistech_secure_auth_secret_2025
set NODE_ENV=development

echo [CHECK] Database Port: 5435
echo [CHECK] URL: http://localhost:3000
echo.
echo [ACTION] Starting Next.js Dev Server...
npm run dev
pause
