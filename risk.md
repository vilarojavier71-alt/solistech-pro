# Análisis de Riesgos – MotorGap

## Alcance

Este documento cubre los riesgos asociados a la infraestructura **Docker + PostgreSQL** y al módulo **SolarBrain** (proxy a la API PVGIS) dentro del proyecto MotorGap (SaaS CRM+ERP).

> **Última Validación:** 16/12/2025 por @TECH_LEAD
> **Estado:** VIVO (Revisión Continua)

## Riesgos Identificados

### 1. Exposición de puertos en Docker (Postgres 5432)

- **Descripción:** El contenedor de PostgreSQL expone el puerto 5432 al host. Si el host está accesible desde internet, un atacante podría intentar conexiones no autorizadas.
- **Impacto:** Acceso a datos sensibles de clientes y finanzas.
- **Probabilidad:** Media.
- **Mitigación:** Configurar `ports: []` y usar `network_mode: bridge` con `127.0.0.1:5432:5432` en `docker‑compose.yml`. Aplicar firewall en el host que solo permita conexiones desde la red interna.

### 2. Persistencia de datos en volúmenes Docker

- **Descripción:** Los volúmenes que almacenan la base de datos pueden quedar sin cifrar y ser accesibles al nivel del sistema de archivos del host.
- **Impacto:** Robo o alteración de datos en caso de compromiso del host.
- **Probabilidad:** Baja‑Media.
- **Mitigación:** Utilizar volúmenes cifrados (e.g., `docker volume create --driver local --opt type=tmpfs` para entornos de desarrollo, y LUKS o encrypted‑fs en producción). Definir políticas de backup fuera del contenedor y almacenar copias en un bucket seguro.

### 3. Fugas de información en Proxy API PVGIS (SolarBrain)

- **Descripción:** El proxy interno que consume la API pública de PVGIS puede exponer cabeceras o parámetros sensibles (p. ej., claves de API internas) si no se sanitizan correctamente.
- **Impacto:** Revelación de credenciales y posible abuso de la API por terceros.
- **Probabilidad:** Media.
- **Mitigación:** Validar y sanitizar todas las entradas al proxy, limitar origenes CORS, registrar y monitorizar peticiones sospechosas. Rotar claves de API periódicamente.

### 4. Residuos de credenciales en código legacy (Supabase)

- **Descripción:** Código legado que todavía contiene referencias a `createClient` de Supabase y posibles variables de entorno con claves antiguas.
- **Impacto:** Exposición de credenciales de bases de datos o servicios externos.
- **Probabilidad:** Alta (código existente).
- **Mitigación:** Eliminar todo el código y configuraciones de Supabase. Ejecutar búsqueda global (`grep -R "createClient"`) y remover cualquier variable de entorno no usada. Auditar `git history` para asegurarse de que no queden secretos en commits.

### 5. Inyección SQL en Prisma

- **Descripción:** Aunque Prisma usa consultas parametrizadas, cualquier uso de `queryRaw` o concatenación de strings puede abrir vectores de inyección.
- **Impacto:** Manipulación de datos, pérdida de integridad.
- **Probabilidad:** Baja si se sigue la guía oficial, pero posible en código legacy.
- **Mitigación:** Revisar todo uso de `queryRaw`, `executeRaw` y reemplazar por consultas parametrizadas. Implementar pruebas de seguridad (SAST) que detecten patrones de concatenación.

## Controles ISO 27001 Relacionados

| Control ISO 27001 | Riesgo asociado | Medida de mitigación |
|-------------------|-----------------|----------------------|
| A.6.1.1 Organización de la información | 1,2,3,4 | Definir roles y responsabilidades de seguridad, aplicar políticas de gestión de activos. |
| A.9.2.3 Gestión de acceso de usuarios | 1,4 | Principio de menor privilegio, uso de RBAC en la aplicación y en Docker. |
| A.10.1.1 Criptografía | 2 | Cifrado de volúmenes y backups. |
| A.12.2.1 Controles contra malware | 3 | Escaneo de dependencias, actualización de paquetes. |
| A.14.2.5 Pruebas de seguridad del sistema | 5 | SAST/DAST, pruebas de penetración en contenedores. |

## Plan de Acción Prioritario

1. **Hardening de Docker Compose** – actualizar `docker-compose.yml` para limitar exposición de puertos y usar redes internas.
2. **Eliminar código Supabase** – búsqueda global, borrado y revisión de variables de entorno.
3. **Implementar cifrado de volúmenes** y definir política de backup fuera del contenedor.
4. **Auditoría SAST** – ejecutar herramienta (e.g., `npm run lint` con plugins de seguridad) para detectar `queryRaw` y otros patrones peligrosos.
5. **Revisar y endurecer proxy SolarBrain** – validar entradas, registrar logs, rotar claves.

## Referencias

- ISO/IEC 27001:2022 – Anexo A (Controles de seguridad).
- Docker Security Best Practices – <https://docs.docker.com/engine/security/>.
- Prisma Security Guidelines – <https://www.prisma.io/docs/concepts/components/prisma-client/security>.
- PVGIS API Documentation – <https://re.jrc.ec.europa.eu/pvgis/api/>.
