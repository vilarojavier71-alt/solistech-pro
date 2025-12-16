# MotorGap

![Build Status](https://img.shields.io/badge/Status-Hardening_Pre--Production-orange)
![Docker](https://img.shields.io/badge/Docker-Active-blue)
![Coverage](https://img.shields.io/badge/Maintained%3F-yes-green)
![License](https://img.shields.io/badge/License-MIT-purple)

**Plataforma SaaS All-in-One para Talleres (CRM + ERP + Cálculo Solar).**

MotorGap es la solución integral que unifica la gestión operativa diaria de talleres de automoción con herramientas avanzadas de cálculo energético (SolarBrain), permitiendo una transición fluida hacia nuevos modelos de negocio sostenibles.

> **Estado Actual:** 🚧 *Hardening Pre-Producción* (Fase de refactorización de código legacy y pulido de interfaz).

---

## 🏗️ Arquitectura Tecnológica (Stack Real)

Este proyecto opera bajo una arquitectura moderna, desacoplada y orientada a la soberanía de datos.

### Frontend

- **Core:** [Next.js 14](https://nextjs.org/) (App Router).
- **UI Library:** [React 19](https://react.dev/) (Experimental), [Tailwind CSS 4](https://tailwindcss.com/).
- **Componentes:** Shadcn/UI + Lucide Icons.

### Backend

- **API:** Next.js Server Actions (comunicación directa y segura).
- **ORM:** [Prisma](https://www.prisma.io/) (Manejo de esquema y migraciones).
- **Validación:** Zod (Sanitización estricta de inputs).

### Data Layer

- **Base de Datos:** PostgreSQL 16 (Self-Hosted vía Docker).
    > ⚠️ **NOTA IMPORTANTE:** **Supabase ha sido DEPRECADO.** No se utiliza para la capa de datos ni autenticación en producción. Cualquier referencia a `createClient` es código legacy en proceso de eliminación.
- **Infraestructura:** Docker Compose (Servicios `app` + `postgres` aislados en red interna `127.0.0.1`).

---

## 🚀 Guía de Despliegue Rápido (Onboarding)

Sigue estos pasos para levantar un entorno de desarrollo funcional en menos de 5 minutos.

### Requisitos Previos

- Docker Desktop (corriendo).
- Node.js 18+ (LTS recomendado).

### Pasos de Instalación

1. **Clonar el repositorio:**

    ```bash
    git clone https://github.com/tu-org/motorgap.git
    cd motorgap
    ```

2. **Configurar Entorno:**

    ```bash
    cp .env.example .env.local
    # Configurar DATABASE_URL=postgresql://postgres:postgres@localhost:5432/motorgap
    ```

3. **Levantar Infraestructura:**

    ```bash
    docker compose up -d --build
    ```

4. **Inicializar Base de Datos:**

    ```bash
    npx prisma migrate dev
    ```

5. **Iniciar Aplicación:**

    ```bash
    npm run dev
    ```

    > Accede a `http://localhost:3000`.

### 🔧 Troubleshooting

- **Error 500 en SolarBrain:**
  - Verifica que el **Proxy Interno** (`/api/proxy/pvgis`) esté funcionando y que el contenedor tenga salida a internet para conectar con la API de la Comisión Europea.
- **Problemas de Encoding (Ã³):**
  - Asegúrate de que todos los archivos fuente estén guardados en **UTF-8**.
  - Verifica que `src/app/layout.tsx` incluya `<meta charset="utf-8" />` en el `<head>`.

---

## 🔒 Seguridad y Compliance (ISO 27001)

Este proyecto implementa controles de seguridad alineados con el estándar ISO 27001.

### Control de Acceso (RBAC)

- **Propietario (Owner):** Control total de la organización, facturación y usuarios.
- **Ingeniero:** Acceso operativo limitado (sin acceso a configuración sensible ni gestión de suscripciones).

### Protección de Datos

- **Infraestructura:** El puerto `5432` de la base de datos **NO** se expone a internet en producción.
- **Sanitización:** Uso obligatorio de **Zod** en todos los Server Actions para prevenir inyección y validar tipos de datos.

---

## 🧩 Módulos Principales

### 1. SolarBrain ☀️

La joya de la corona para el cálculo energético.

- **Bypass CORS:** Utiliza un proxy interno para consumir la API PVGIS sin bloqueos del navegador.
- **Funcionalidad:** Estimación precisa de producción solar, ROI y ahorro de CO2.

### 2. CRM & Ventas 💼

Gestión completa del ciclo de vida del cliente.

- **Leads:** Embudo de conversión y seguimiento de estados.
- **Clientes:** Base de datos centralizada con historial de proyectos.
- *Estado:* En desarrollo visual y refinamiento de UX.

### 3. Presentaciones 📄

Generación de entregables de alto impacto.

- **Motor PDF:** Generación dinámica de reportes técnicos y comerciales utilizando IA para el contenido y librerías PDF para la renderización.

---

> **MotorGap Team** - 2025. Construido con estándares de excelencia.
