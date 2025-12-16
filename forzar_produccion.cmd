@echo off
echo ==========================================
echo   SOLUCION: FORZAR PRODUCCION
echo ==========================================
echo.
echo Vamos a borrar TODA la configuracion de staging
echo y forzar que use el servidor de PRODUCCION.
echo.

ssh root@46.224.41.2 "rm -rf /var/lib/caddy/.local/share/caddy; cat > /etc/caddy/Caddyfile << 'EOF'
{
  email admin@motorgap.es
}

motorgap.es {
  reverse_proxy 127.0.0.1:3000
}

www.motorgap.es {
  redir https://motorgap.es{uri} permanent
}
EOF
systemctl restart caddy && sleep 5 && echo '=== ESTADO CADDY ===' && systemctl status caddy --no-pager | head -15 && echo '' && echo '=== ESPERANDO CERTIFICADO (60 seg) ===' && sleep 60 && echo '' && echo '=== VERIFICANDO CERTIFICADO ===' && ls -la /var/lib/caddy/.local/share/caddy/certificates/acme-v02.api.letsencrypt.org-directory/motorgap.es/ 2>&1"

echo.
echo ==========================================
echo   Si ves archivos .crt y .key al final,
echo   el certificado se obtuvo correctamente.
echo   Prueba: https://motorgap.es
echo ==========================================
pause
