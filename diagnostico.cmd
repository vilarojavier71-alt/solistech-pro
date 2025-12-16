@echo off
echo ==========================================
echo   DIAGNOSTICO DE SERVIDOR (Caddy + Node)
echo ==========================================
echo.
echo Ejecutando pruebas...
echo.

ssh root@46.224.41.2 "echo '--- 1. Caddyfile ---'; cat /etc/caddy/Caddyfile; echo '--- 2. Estado Caddy ---'; systemctl status caddy --no-pager; echo '--- 3. Prueba Interna Node (3000) ---'; curl -I http://localhost:3000; echo '--- 4. Logs PM2 ---'; pm2 log --lines 10 --nostream"

echo.
echo ==========================================
echo   ENVIA UNA CAPTURA DE PANTALLA DE ESTO
echo ==========================================
pause
