# MotorGap

![Build Status](https://img.shields.io/badge/Build-Passing-success)
![Docker](https://img.shields.io/badge/Docker-Active-blue)
![Coverage](https://img.shields.io/badge/Coverage-80%25-green)
![License](https://img.shields.io/badge/License-MIT-purple)

**Plataforma SaaS de Gestión Integral para Talleres de Automoción (CRM + ERP) con módulos avanzados de cálculo energético (SolarBrain).**

MotorGap unifica la gestión operativa diaria con herramientas de inteligencia de negocios y cálculo solar avanzado, permitiendo a los talleres optimizar recursos y expandir sus servicios hacia la eficiencia energética.

---

## 🏗️ Arquitectura y Stack (La Realidad Actual)

Este proyecto utiliza un stack moderno, robusto y auto-hospedado, diseñado para la escalabilidad y la soberanía de los datos.

### Frontend

- **Core:** [Next.js 14](https://nextjs.org/) (App Router).
- **UI Library:** [React 19](https://react.dev/) (Experimental), [Tailwind CSS 4](https://tailwindcss.com/), [Shadcn/UI](https://ui.shadcn.com/).
- **Iconografía:** Lucide React.

### Backend

- **API:** Next.js Server Actions (comunicación directa y segura).
- **ORM:** [Prisma](https://www.prisma.io/).

### Data (Supabase Free Zone)

- **Base de Datos:** PostgreSQL 16 (Self-Hosted vía Docker).
    > ⚠️ **NOTA CRÍTICA:** No se utiliza Supabase para la capa de datos ni autenticación en producción. El código legacy relacionado está en proceso de eliminación.
- **Infraestructura:** Docker Compose (`app` + `postgres`).

---

## 🚀 Guía de Despliegue (Onboarding en 5 Minutos)

Sigue estos pasos para levantar un entorno de desarrollo local limpio y funcional.

### Pre-requisitos

- Docker Desktop (corriendo).
- Node.js 18+ (LTS recomendado).

### Comandos de Arranque

1. **Clonar el repositorio:**

    ```bash
    git clone https://github.com/tu-org/motorgap.git
    cd motorgap
    ```

2. **Configurar entorno:**

    ```bash
    cp .env.example .env.local
    # Ajustar DATABASE_URL si es necesario (por defecto: postgres://postgres:postgres@localhost:5432/motorgap)
    ```

3. **Levantar Infraestructura:**

    ```bash
    docker compose up -d
    ```

4. **Inicializar Base de Datos:**

    ```bash
    npx prisma migrate dev
    # Opcional: npx prisma db seed (si existe script de semillas)
    ```

5. **Iniciar Aplicación:**

    ```bash
    npm run dev
    ```

    > Accede a `http://localhost:3000`.

### 🔧 Troubleshooting

- **Error: Puerto 5432 ocupado**:
  - Si tienes un Postgres local corriendo, detenlo o cambia el puerto en `docker-compose.yml`.
- **Error: Proxy PVGIS (CORS/500)**:
  - Verifica que el contenedor tenga salida a internet.
  - Revisa los logs del servidor con `docker compose logs -f app` para ver el error del proxy.

---

## 🔒 Seguridad y Compliance

Este proyecto se adhiere a principios de seguridad por diseño, alineados con la futura certificación **ISO 27001**.

### Matriz de Roles (RBAC)

- **Propietario (Owner):** Acceso total. Gestión de suscripción, usuarios y configuración de la organización.
- **Ingeniero/Técnico:** Acceso operativo (Proyectos, Clientes, SolarBrain). Restringido en Facturación y Configuración global.

### Política de Datos

- **GDPR:** Los datos residen en infraestructura controlada (Docker).
- **Sensibilidad:** La información financiera y de clientes está segregada por `organization_id` a nivel de aplicación (Multi-tenancy lógico).

---

## 🧩 Mapa de Módulos

### 1. SolarBrain ☀️

Módulo insignia de cálculo fotovoltaico.

- **Funcionamiento:** Utiliza un Proxy interno (`/api/proxy/pvgis`) para consumir la API de la Comisión Europea (PVGIS) evitando problemas de CORS y ocultando la lógica de consumo.
- **Output:** Estimación de producción anual, ROI y ahorro de CO2.

### 2. Finanzas 💶

Control total de la salud económica del taller.

- **Dashboard:** KPIs en tiempo real.
- **Ayudas:** Gestión de subvenciones y estado de las mismas.

### 3. Presentaciones 📄

Generador de entregables profesionales.

- **Motor:** Generación de PDFs dinámicos y reportes con IA.
- **Uso:** Creación de propuestas comerciales automatizadas basadas en los datos del proyecto.

---

## 📚 Recursos Técnicos Adicionales

- 📖 **[API Reference](/api/docs)**: Documentación OpenAPI/Swagger (WIP).
- 🏗️ **[Arquitectura del Sistema](./docs/architecture.png)**: Diagrama de flujo de datos.
- ⚠️ **[Análisis de Riesgos](./risk.md)**: Documento vivo de vectores de ataque y mitigación.

---

> **MotorGap Team** - 2025. Construido con ❤️ y mucho café.
