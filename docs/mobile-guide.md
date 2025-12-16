# Protocolo de Despliegue Móvil (Android)

He configurado el entorno para generar la APK para pruebas en dispositivo físico.

## 1. Configuración Realizada
*   **Capacitor Instalado**: Core, CLI y Android Platform.
*   **Modo Híbrido Activado**: `capacitor.config.ts` apunta a `http://192.168.1.131:3000`.
    *   *Nota: Asegúrate de que tu móvil y tu PC estén en la misma red WiFi.*

## 2. Guía de Comandos (Terminal)

Para abrir el proyecto en Android Studio y compilar:

```bash
# 1. Copiar assets (aunque en modo servidor no son críticos, Capacitor lo requiere)
npx cap copy

# 2. Sincronizar configuración (si cambias capacitor.config.ts)
npx cap sync

# 3. Abrir Android Studio
npx cap open android
```

## 3. Checklist Android Studio (Generar APK)

Una vez abierto Android Studio:

1.  Espera a que termine el **Gradle Sync** (barra inferior derecha).
2.  Conecta tu móvil por USB (debe tener "Depuración USB" activa).
3.  **Para Ejecutar Directamente:** Pulsa el botón **Play (▶)** verde en la barra superior.
4.  **Para Generar APK Compartible:**
    *   Menú: `Build` > `Build Bundle(s) / APK(s)` > `Build APK(s)`.
    *   Al terminar, aparecerá un popup "Build APK(s): APK(s) generated successfully". Haz clic en **locate**.
    *   El archivo suele estar en: `android/app/build/outputs/apk/debug/app-debug.apk`.

## Solución de Problemas Comunes

*   **Pantalla en blanco / Error de conexión:**
    *   Verifica que la IP en `capacitor.config.ts` es correcta (`ipconfig` en Windows).
    *   Asegúrate de que el Firewall de Windows permite conexiones entrantes al puerto 3000 (Node.js).
*   **Next.js Images:** Si las imágenes no cargan, añade esto a `next.config.js`:
    ```js
    images: { unoptimized: true }
    ```
