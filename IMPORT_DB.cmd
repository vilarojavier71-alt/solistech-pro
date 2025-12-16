@echo off
REM ============================================================================
REM SOLISTECH PRO - DATABASE IMPORT SCRIPT (Windows)
REM ============================================================================
REM Imports schema and data into Docker PostgreSQL.
REM ============================================================================

SET DOCKER_CONTAINER=solistech_db
SET POSTGRES_USER=solistech
SET POSTGRES_DB=solistech_pro

echo.
echo ============================================
echo   SOLISTECH PRO - DATABASE IMPORT
echo ============================================
echo.

REM Check if container is running
docker ps | findstr %DOCKER_CONTAINER% > nul
IF %ERRORLEVEL% NEQ 0 (
    echo ERROR: Container %DOCKER_CONTAINER% is not running!
    echo Run: docker-compose up -d postgres
    pause
    exit /b 1
)

echo [1/3] Waiting for PostgreSQL to be ready...
:WAIT_POSTGRES
docker exec %DOCKER_CONTAINER% pg_isready -U %POSTGRES_USER% -d %POSTGRES_DB% > nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    timeout /t 2 > nul
    goto WAIT_POSTGRES
)
echo      PostgreSQL is ready!

echo.
echo [2/3] Importing schema...
docker exec -i %DOCKER_CONTAINER% psql -U %POSTGRES_USER% -d %POSTGRES_DB% < docker\export\schema.sql

IF %ERRORLEVEL% NEQ 0 (
    echo WARNING: Schema import had errors (this may be normal if tables exist)
)
echo      Schema imported.

echo.
echo [3/3] Importing data...
docker exec -i %DOCKER_CONTAINER% psql -U %POSTGRES_USER% -d %POSTGRES_DB% < docker\export\data.sql

IF %ERRORLEVEL% NEQ 0 (
    echo WARNING: Data import had errors
)
echo      Data imported.

echo.
echo ============================================
echo   IMPORT COMPLETE
echo ============================================
echo.
echo Verification:
echo   docker exec -it %DOCKER_CONTAINER% psql -U %POSTGRES_USER% -d %POSTGRES_DB% -c "\dt"
echo.
pause
