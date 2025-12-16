@echo off
echo ==========================================
echo   CAZAFANTASMAS (Limpieza de Zombies)
echo ==========================================
echo.
echo Hemos detectado que hay un proceso 'fantasma' bloqueando el puerto.
echo PM2 intenta arrancar pero choca contra el.
echo.
echo 1. Matando todos los procesos Node.js...
echo 2. Liberando puerto 3000 a la fuerza...
echo 3. Reiniciando limpio...
echo.

ssh root@46.224.41.2 "systemctl stop caddy; pm2 kill; killall -9 node; killall -9 pm2; fuser -k 3000/tcp; rm -rf /root/.pm2; npm install -g pm2; cd /root/gap-motor/website; PORT=3000 pm2 start server.js --name 'motorgap' --force; pm2 save; systemctl start caddy; pm2 list"

echo.
echo ==========================================
echo   ¿AHORA SALE 'online' EN VERDE?
echo ==========================================
pause
