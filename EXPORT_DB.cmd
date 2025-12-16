@echo off
REM ============================================================================
REM SOLISTECH PRO - DATABASE EXPORT SCRIPT (Windows)
REM ============================================================================
REM Exports schema and data from Supabase PostgreSQL.
REM Requires: psql/pg_dump in PATH (from PostgreSQL installation)
REM ============================================================================

SET SUPABASE_HOST=db.hqhaofqzedbqugsctxec.supabase.co
SET SUPABASE_PORT=5432
SET SUPABASE_USER=postgres
SET SUPABASE_DB=postgres

echo.
echo ============================================
echo   SOLISTECH PRO - DATABASE EXPORT
echo ============================================
echo.

REM Prompt for password
SET /P PGPASSWORD=Enter Supabase database password: 

echo.
echo [1/2] Exporting schema...
pg_dump --host=%SUPABASE_HOST% --port=%SUPABASE_PORT% --username=%SUPABASE_USER% --dbname=%SUPABASE_DB% --schema=public --schema-only --no-owner --no-privileges > docker\export\schema.sql

IF %ERRORLEVEL% NEQ 0 (
    echo ERROR: Schema export failed!
    pause
    exit /b 1
)
echo      Schema exported to docker\export\schema.sql

echo.
echo [2/2] Exporting data...
pg_dump --host=%SUPABASE_HOST% --port=%SUPABASE_PORT% --username=%SUPABASE_USER% --dbname=%SUPABASE_DB% --schema=public --data-only --no-owner > docker\export\data.sql

IF %ERRORLEVEL% NEQ 0 (
    echo ERROR: Data export failed!
    pause
    exit /b 1
)
echo      Data exported to docker\export\data.sql

echo.
echo ============================================
echo   EXPORT COMPLETE
echo ============================================
echo.
echo Next steps:
echo   1. docker-compose up -d postgres
echo   2. Run IMPORT_DB.cmd
echo.
pause
