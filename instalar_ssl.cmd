@echo off
echo ==========================================
echo   INSTALANDO CANDADO DE SEGURIDAD (HTTPS)
echo ==========================================
echo.
echo Este proceso puede tardar 1-2 minutos.
echo 1. Instalando Servidor Web Caddy...
echo 2. Configurando Certificados SSL Automaticos...
echo 3. Conectando Dominio motorgap.es...
echo.

ssh root@46.224.41.2 "apt install -y debian-keyring debian-archive-keyring apt-transport-https curl; curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg; curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list; apt update; apt install caddy -y; pm2 delete motorgap; cd /root/gap-motor/website; PORT=3000 pm2 start server.js --name 'motorgap'; pm2 save; echo 'motorgap.es {' > /etc/caddy/Caddyfile; echo '  reverse_proxy localhost:3000' >> /etc/caddy/Caddyfile; echo '}' >> /etc/caddy/Caddyfile; systemctl reload caddy; systemctl enable caddy"

echo.
echo ==========================================
echo   INSTALACION COMPLETADA
echo ==========================================
echo Ahora si deberia funcionar el candado.
echo Prueba a entrar en: https://motorgap.es
echo.
pause
