@echo off
echo ==========================================
echo   PRUEBA DE AISLAMIENTO SSL
echo ==========================================
echo.
echo Vamos a quitar la App de en medio un momento.
echo Queremos ver si Caddy es capaz de decir "Hola"
echo con el candado verde.
echo.
echo 1. Apagando Firewall (por si acaso).
echo 2. Configurando Caddy en modo texto simple.
echo.

ssh root@46.224.41.2 "ufw disable; echo 'motorgap.es, www.motorgap.es {' > /etc/caddy/Caddyfile; echo '  respond \"CADDY CON SSL FUNCIONANDO\"' >> /etc/caddy/Caddyfile; echo '}' >> /etc/caddy/Caddyfile; systemctl reload caddy; sleep 2; echo '--- TEST LOCAL ---'; curl -k -H 'Host: motorgap.es' https://127.0.0.1"

echo.
echo ==========================================
echo   AHORA PRUEBA EN TU NAVEGADOR
echo ==========================================
echo Entra en: https://motorgap.es
echo Deberias ver solo texto blanco: "CADDY CON SSL FUNCIONANDO"
pause
