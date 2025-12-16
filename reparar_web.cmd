@echo off
echo ==========================================
echo   REPARACION TOTAL (SCRIPT DEFINITIVO)
echo ==========================================
echo.
echo 1. Limpiando conflictos de puertos...
echo 2. Reiniciando Servidor Web (Node.js)...
echo 3. Reiniciando Sistema de Seguridad (Caddy SSL)...
echo.

ssh root@46.224.41.2 "systemctl stop caddy; systemctl stop nginx; systemctl stop apache2; fuser -k 80/tcp; fuser -k 443/tcp; rm -rf /root/.local/share/caddy; cd /root/gap-motor/website; PORT=3000 pm2 start server.js --name 'motorgap' --force; pm2 save; echo 'motorgap.es {' > /etc/caddy/Caddyfile; echo '  reverse_proxy localhost:3000' >> /etc/caddy/Caddyfile; echo '}' >> /etc/caddy/Caddyfile; systemctl start caddy"

echo.
echo ==========================================
echo   ESPERANDO 15 SEGUNDOS (Validando SSL...)
echo ==========================================
timeout /t 15 >nul
echo.
echo LISTO. Prueba a entrar ahora:
echo https://motorgap.es
echo.
pause
