@echo off
echo ==========================================
echo   MODO RESCATE (SOLO HTTP)
echo ==========================================
echo.
echo Los certificados de seguridad estan fallando.
echo Vamos a activar la web SIN seguridad temporalmente
echo para confirmar que funciona.
echo.

ssh root@46.224.41.2 "echo 'http://motorgap.es {' > /etc/caddy/Caddyfile; echo '  reverse_proxy localhost:3000' >> /etc/caddy/Caddyfile; echo '}' >> /etc/caddy/Caddyfile; systemctl reload caddy"

echo.
echo ==========================================
echo   PRUEBA AHORA (EN INCOGNITO PREFERIBLEMENTE)
echo ==========================================
echo Entra en: http://motorgap.es
echo (Sin la S)
echo.
pause
