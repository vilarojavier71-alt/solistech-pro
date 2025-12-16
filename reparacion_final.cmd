@echo off
echo ==========================================
echo   REPARACION FINAL (IPv4 + Limpieza)
echo ==========================================
echo.
echo 1. Eliminando procesos atascados...
echo 2. Arrancando Web App (Node.js)...
echo 3. Configurando enlace Caddy -> 127.0.0.1 (IPv4)...
echo.

ssh root@46.224.41.2 "systemctl stop caddy; pm2 kill; killall -9 node; killall -9 pm2; fuser -k 3000/tcp; npm install -g pm2; cd /root/gap-motor/website; PORT=3000 pm2 start server.js --name 'motorgap' --force; pm2 save; echo 'motorgap.es, www.motorgap.es {' > /etc/caddy/Caddyfile; echo '  reverse_proxy 127.0.0.1:3000' >> /etc/caddy/Caddyfile; echo '}' >> /etc/caddy/Caddyfile; systemctl start caddy; sleep 5; pm2 list; echo '--- PRUEBA INTERNA ---'; curl -I http://127.0.0.1:3000"

echo.
echo ==========================================
echo   SI EN LA TABLA PONE 'online' (VERDE)
echo   Y ABAJO SALE 'HTTP/1.1 307'...
echo   YA ESTA FUNCIONANDO.
echo ==========================================
echo Prueba entrar en: https://motorgap.es
echo.
pause
