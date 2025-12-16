@echo off
echo ==========================================
echo   ENCENDIENDO SOLISTECH (SOLO HTTP)
echo ==========================================
echo.
echo 1. Cerrando puerto 443 (HTTPS/SSL) para evitar errores...
echo 2. Liberando puerto 80...
echo 3. Reiniciando web en modo HTTP...
echo.

ssh root@46.224.41.2 "fuser -k 443/tcp || true; fuser -k 80/tcp || true; systemctl stop nginx || true; systemctl stop apache2 || true; cd /root/gap-motor/website; PORT=80 pm2 restart motorgap || PORT=80 pm2 start server.js --name 'motorgap' --force; pm2 save; pm2 status"

echo.
echo ==========================================
echo   YA ESTA LISTO.
echo ==========================================
echo ⚠️ IMPORTANTE:
echo Copia y pega esto en la barra de direcciones (Navegador Incognito recomendado):
echo.
echo http://46.224.41.2
echo.
echo (Asegurate de que pone http:// y NO https://)
echo.
pause
