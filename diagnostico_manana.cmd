@echo off
echo ==========================================
echo   DIAGNOSTICO MATUTINO
echo ==========================================
echo.
echo Vamos a ver que ha pasado durante la noche.
echo.

ssh root@46.224.41.2 "echo '--- PM2 STATUS ---'; pm2 list; echo '--- NODEJS INTERNAL ---'; curl -I http://localhost:3000; echo '--- CADDY LOGS ---'; journalctl -u caddy --no-pager | tail -n 20"

echo.
echo ==========================================
echo   ENVIAME LA CAPTURA
echo ==========================================
pause
