# Protocolo de Configuración de Entorno Android (Zero to Hero)

Esta guía asume un ordenador (Windows) limpio sin herramientas de desarrollo móvil previas. Sigue estos pasos **en orden** para preparar tu máquina para generar la APK de SolisTech Pro.

## 🏗️ Fase 1: Instalación de Herramientas (Sistema)

### 1. Java Development Kit (JDK) 17
Capacitor y Android Gradle Plugin requieren Java 17.
*   **Descarga:** [Eclipse Adoptium (Temurin) JDK 17](https://github.com/adoptium/temurin17-binaries/releases/latest) -> Busca el instalador `.msi` para Windows x64.
*   **Instalación:** Ejecuta el instalador.
    *   ⚠️ **IMPORTANTE:** En la pantalla de opciones, asegúrate de marcar: **"Set or override JAVA_HOME variable"** y **"Win32/Registry keys"**. Esto te ahorrará configurar variables manualmente para Java.

### 2. Android Studio (Versión Koala/Ladybug o última estable)
*   **Descarga:** [Sitio Oficial Android Studio](https://developer.android.com/studio).
*   **Instalación:**
    1.  Ejecuta el instalador con todas las opciones por defecto.
    2.  Abre Android Studio al finalizar.
    3.  **First Run Wizard:** Selecciona "Standard" install. Acepta las licencias. Esto descargará el SDK básico.

### 3. Configuración del SDK Manager (CRÍTICO)
Una vez abierto Android Studio (pantalla de bienvenida):
1.  Haz clic en el botón de menú **"More Actions"** (tres puntos) > **"SDK Manager"**.
2.  **Pestaña "SDK Platforms":**
    *   Marca **Android 14.0 ("UpsideDownCake")** o la API Level 34.
    *   (Opcional pero recomendado) Android 13.0 (API 33).
3.  **Pestaña "SDK Tools":**
    *   Marca **Android SDK Build-Tools 34.x.x**.
    *   Marca **Android SDK Command-line Tools (latest)**.
    *   Marca **Android SDK Platform-Tools** (debería estar ya marcado).
    *   Marca **Google Play Services**.
4.  Haz clic en **"Apply"** y espera a que descargue e instale todo.

---

## 🌍 Fase 2: Variables de Entorno (Windows)

Si al ejecutar comandos te dice que "no se reconoce", es por esto.

1.  Abre el menú Inicio y escribe: **"Editar las variables de entorno del sistema"**.
2.  Haz clic en el botón **"Variables de entorno..."**.
3.  **Variable ANDROID_HOME:**
    *   En "Variables del sistema" (abajo), haz clic en **"Nueva..."**.
    *   **Nombre:** `ANDROID_HOME`
    *   **Valor:** Generalmente es `C:\Users\TU_USUARIO\AppData\Local\Android\Sdk`.
        *   *(Puedes verificar esta ruta en Android Studio > SDK Manager > Android SDK Location arriba del todo).*
4.  **Actualizar el PATH:**
    *   En "Variables del sistema", busca la variable **"Path"** y haz clic en **"Editar..."**.
    *   Haz clic en "Nuevo" y añade estas dos rutas:
        *   `%ANDROID_HOME%\platform-tools`
        *   `%ANDROID_HOME%\cmdline-tools\latest\bin`
5.  **Validación:**
    *   Abre una **NUEVA** terminal (PowerShell) y escribe: `adb version`.
    *   Si ves "Android Debug Bridge version...", ¡ÉXITO! 🎉

---

## 🔌 Fase 3: Integración en SolisTech Pro

**ESTADO ACTUAL:** *Estas dependencias YA han sido instaladas en el paso anterior por el agente.*
No necesitas ejecutar esto de nuevo, pero aquí está la referencia de lo que se hizo:

```bash
# 1. Instalación del núcleo
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Inicialización del proyecto
npx cap init SolisTechPro com.solistech.pro --web-dir=public

# 3. Adición de la plataforma Android
npx cap add android
```

### Tu Tarea Ahora (Generar la APK)

1.  **Abre Android Studio desde el proyecto:**
    ```bash
    npx cap open android
    ```
2.  Espera a que termine la sincronización de Gradle (barra inferior).
3.  Conecta tu móvil por USB (asegúrate de activar "Depuración USB" en las Opciones de Desarrollador de tu móvil Android).
4.  Selecciona tu móvil en el desplegable superior de dispositivos.
5.  Haz clic en el botón **RUN (▶)** verde.

**¡La App debería instalarse y abrirse en tu móvil!**
Estará conectada a tu PC, así que cualquier cambio que hagas en `npm run dev` se verá reflejado (quizás requiera recargar la app).
