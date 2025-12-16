@echo off
echo ==========================================
echo   ULTIMO DIAGNOSTICO + FIX WWW
echo ==========================================
echo.
echo 1. Comprobando puertos...
echo 2. Añadiendo soporte para WWW...
echo.

ssh root@46.224.41.2 "netstat -tulpn | grep caddy; echo '---'; echo 'motorgap.es, www.motorgap.es {' > /etc/caddy/Caddyfile; echo '  reverse_proxy localhost:3000' >> /etc/caddy/Caddyfile; echo '}' >> /etc/caddy/Caddyfile; systemctl reload caddy; echo '--- LOGS CADDY ---'; journalctl -u caddy --no-pager | tail -n 20"

echo.
echo ==========================================
echo   MANDAME UNA FOTO DE LO QUE SALE
echo ==========================================
pause
