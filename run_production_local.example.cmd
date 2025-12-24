@echo off
echo [INFO] Starting SolisTech Pro (Local Production Mode)
echo [INFO] Bypassing Docker due to Daemon I/O Error...
echo.
echo [WARNING] This script requires environment variables to be set.
echo [WARNING] Copy .env.example to .env.local and configure your secrets.
echo.

:: Configuration - MUST BE SET VIA ENVIRONMENT VARIABLES
:: DO NOT hardcode secrets in this file!
if not defined DATABASE_URL (
    echo [ERROR] DATABASE_URL environment variable is not set
    echo [ERROR] Please set it in .env.local or export it before running this script
    pause
    exit /b 1
)

if not defined AUTH_SECRET (
    echo [ERROR] AUTH_SECRET environment variable is not set
    echo [ERROR] Please set it in .env.local or export it before running this script
    pause
    exit /b 1
)

echo [CHECK] Database URL: [REDACTED]
echo [CHECK] URL: %NEXT_PUBLIC_APP_URL%
echo.
echo [ACTION] Starting Next.js Dev Server...
npm run dev
pause


