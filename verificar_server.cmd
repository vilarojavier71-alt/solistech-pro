@echo off
echo ==========================================
echo   VERIFICACION SERVER.JS
echo ==========================================
echo.

ssh root@46.224.41.2 "echo '=== VERIFICANDO ARCHIVOS ==='; ls -la /root/gap-motor/website/; echo ''; echo '=== ESTADO PM2 ==='; pm2 list; echo ''; echo '=== LOGS PM2 (ultimas 20 lineas) ==='; pm2 logs motorgap --lines 20 --nostream"

echo.
pause
