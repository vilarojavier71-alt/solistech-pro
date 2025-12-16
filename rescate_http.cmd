@echo off
echo ==========================================
echo   RESCATE HTTP (SIN CANDADO)
echo ==========================================
echo.
echo El comando anterior fallo por una comilla mal puesta (culpa mia).
echo Ademas, como el SSL esta bloqueado, vamos a probar
echo por el puerto normal (HTTP 80) para confirmar que
echo al menos tenemos control del servidor.
echo.
echo 1. Reconfigurando Caddy en Puerto 80 (Sin SSL).
echo 2. Reiniciando servicio.
echo.

ssh root@46.224.41.2 "echo 'http://motorgap.es, http://www.motorgap.es {' > /etc/caddy/Caddyfile; echo '  respond \"CADDY VIVO EN HTTP\"' >> /etc/caddy/Caddyfile; echo '}' >> /etc/caddy/Caddyfile; systemctl restart caddy; systemctl status caddy --no-pager; echo '--- TEST LOCAL ---'; curl -I http://127.0.0.1"

echo.
echo ==========================================
echo   AHORA PRUEBA EN TU NAVEGADOR
echo ==========================================
echo Entra en: http://motorgap.es
echo (OJO: pon http:// , sin 's')
echo.
pause
