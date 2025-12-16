# GUÍA DE DESPLIEGUE: SOLISTECH PRO x COOLIFY

Esta guía documenta cómo llevar SolisTech Pro a producción utilizando un VPS y Coolify.

## REQUISITOS PREVIOS

1. **VPS Contratado:** Recomendado Hetzner CX32 (8GB RAM) o equivalente.
    * OS: Ubuntu 22.04 o 24.04 LTS.
2. **Dominio:** `motorgap.es` (o el que uses) apuntando a la IP del VPS (Registros A).

## PASO 1: PREPARAR EL SERVIDOR

Conéctate por SSH a tu servidor:

```bash
ssh root@<TU_IP_VPS>
```

Copia y pega el comando de instalación automática (o usa el script `install_coolify.sh` de este repo):

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

*Tiempo estimado: 2-5 minutos.*

## PASO 2: CONFIGURACIÓN INICIAL

1. Entra en `http://<TU_IP_VPS>:8000`.
2. Crea tu usuario Admin.
3. **Importante:** En cuanto entres, Coolify te pedirá configurar la URL de la instancia (ej: `console.motorgap.es`). Configúralo para activar SSL automático.

## PASO 3: DESPLEGAR LA APP (NEXT.JS)

1. En Coolify, crea un **New Project**.
2. Elige **Production**.
3. Añade recurso: **Public Repository** (o Private si conectas GitHub App).
    * Repo URL: `https://github.com/StartUp-DreamTeam/solistech-pro` (o tu repo).
    * Build Pack: **Nixpacks** (Recomendado) o Dockerfile.
4. **Variables de Entorno (.env):**
    * Copia el contenido de `env.production.ready.txt` del proyecto local.
    * Pégalo en la sección "Environment Variables" de Coolify.
    * **CAMBIO CRÍTICO:** Cambia `DATABASE_URL` para usar el nombre del servicio interno si despliegas la DB en Coolify (ver paso 4), o usa la IP interna.

## PASO 4: BASE DE DATOS (POSTGRESQL)

Tienes dos opciones:

* **Opción A (Recomendada):** Desplegar Postgres *dentro* de Coolify.
    1. Añade recurso "PostgreSQL".
    2. Coolify te dará la `DATABASE_URL` interna (ej: `postgresql://user:pass@uuid:5432/db`).
    3. Usa esa URL en las variables de entorno de tu App Next.js.
* **Opción B:** Usar una DB externa (Supabase, Neon, AWS RDS).

## PASO 5: DOMINIOS

1. En la configuración del recurso Next.js en Coolify, ve a "Domains".
2. Añade `https://motorgap.es`.
3. Coolify generará el certificado SSL automáticamente (Let's Encrypt).

## DIAGNÓSTICO

Si el despliegue falla:

* Revisa los logs de "Build" en Coolify. suele ser por falta de variables de entorno.
* Asegúrate de que `prisma generate` se ejecuta en el `build` script del `package.json`.
