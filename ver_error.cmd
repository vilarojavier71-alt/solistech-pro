@echo off
echo ==========================================
echo   CAZANDO EL ERROR (MODO MANUAL)
echo ==========================================
echo.
echo La web se esta reiniciando todo el rato (Crash).
echo Vamos a arrancarla a mano para ver QUE error da.
echo.

ssh root@46.224.41.2 "pm2 stop motorgap; cd /root/gap-motor/website; PORT=3000 node server.js"

echo.
echo ==========================================
echo   ¿QUE ERROR ROJO TE HA SALIDO ARRIBA?
echo ==========================================
pause
