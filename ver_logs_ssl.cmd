@echo off
echo ==========================================
echo   ¿DOMINIO BLOQUEADO?
echo ==========================================
echo.
echo Los tests indican que la web funciona (Node esta OK)
echo pero el CANDADO falla (Error SSL).
echo.
echo Es probable que Let's Encrypt nos haya "castigado"
echo por reiniciar tantas veces (Rate Limit).
echo Vamos a ver si los logs lo confirman.
echo.

ssh root@46.224.41.2 "journalctl -u caddy --no-pager | tail -n 50"

echo.
echo ==========================================
echo   BUSCA TEXTO ROJO O 'Rate Limit'
echo ==========================================
pause
