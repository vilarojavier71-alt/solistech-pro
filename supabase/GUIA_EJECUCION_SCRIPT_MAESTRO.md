# 🚀 GUÍA DE EJECUCIÓN - SCRIPT MAESTRO SUPABASE

## 📋 PASOS PARA EJECUTAR SIN ERRORES

### 1. Abrir Supabase SQL Editor

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. En el menú lateral, haz clic en **SQL Editor**
3. Haz clic en **New Query**

### 2. Copiar y Pegar el Script

1. Abre el archivo: `supabase/SCRIPT_MAESTRO_COMPLETO.sql`
2. **Copia TODO el contenido** (Ctrl+A, Ctrl+C)
3. **Pega en el SQL Editor** de Supabase (Ctrl+V)

### 3. Ejecutar el Script

1. Haz clic en el botón **RUN** (o presiona Ctrl+Enter)
2. **Espera** a que termine (puede tardar 10-30 segundos)
3. Verifica que aparezca: `Script maestro ejecutado correctamente`

### 4. Verificar Resultados

Al final del script verás dos tablas de verificación:

**Tabla 1: Registros por tabla**
```
tabla                      | registros
---------------------------|-----------
subsidies                  | 8
subsidy_applications       | 0
organization_settings      | 0
presentations              | 0
municipal_tax_benefits     | 11
```

**Tabla 2: Municipios por comunidad**
```
autonomous_community       | municipios
---------------------------|------------
Aragón                     | 3
Cataluña                   | 2
Comunidad Valenciana       | 1
Comunidad de Madrid        | 1
Castilla-La Mancha         | 2
La Rioja                   | 1
Navarra                    | 1
```

---

## ✅ LO QUE CREA EL SCRIPT

### Extensiones PostgreSQL
- ✅ uuid-ossp (generación de UUIDs)
- ✅ pgcrypto (encriptación)
- ✅ cube + earthdistance (búsquedas geoespaciales)

### Tablas Nuevas
1. **subsidies** - Catálogo de subvenciones regionales
2. **subsidy_applications** - Expedientes de tramitación
3. **subsidy_documents** - Documentos de expedientes
4. **organization_settings** - Configuración de API keys de IA
5. **presentations** - Presentaciones PowerPoint generadas
6. **municipal_tax_benefits** - Bonificaciones IBI/ICIO por municipio

### Datos Iniciales
- ✅ 8 subvenciones regionales (Valencia, Madrid, Cataluña, Andalucía, Aragón)
- ✅ 11 municipios con bonificaciones IBI/ICIO

### Funciones SQL
- ✅ `generate_application_number()` - Auto-genera números de expediente
- ✅ `find_nearby_benefits()` - Busca bonificaciones por proximidad
- ✅ Triggers de actualización de timestamps

### Seguridad (RLS)
- ✅ Row Level Security habilitado en todas las tablas
- ✅ Políticas de acceso por organización
- ✅ Usuarios solo ven sus propios datos

---

## ⚠️ SOLUCIÓN DE PROBLEMAS

### Error: "extension already exists"
✅ **Normal** - El script usa `IF NOT EXISTS`, puedes ignorar este mensaje

### Error: "relation already exists"
✅ **Normal** - El script usa `IF NOT EXISTS`, puedes ignorar este mensaje

### Error: "permission denied"
❌ **Problema** - Asegúrate de estar usando el **Service Role** en Supabase
   - Ve a Settings → API
   - Copia el **service_role key** (no el anon key)
   - O ejecuta desde el SQL Editor (tiene permisos automáticos)

### Error: "column does not exist"
❌ **Problema** - Puede que falten tablas base (organizations, users, customers, etc.)
   - Asegúrate de haber ejecutado las migraciones iniciales primero
   - Si es un proyecto nuevo, ejecuta primero: `20241208_initial_schema.sql`

---

## 🎯 DESPUÉS DE EJECUTAR

### Configurar Storage Buckets

Ve a **Storage** en Supabase y crea estos buckets:

1. **documents** (privado)
   - Para PDFs, PowerPoints, fotos
   - RLS: Solo usuarios de la organización

2. **avatars** (público)
   - Para avatares de usuarios

3. **logos** (público)
   - Para logos de organizaciones

### Configurar Variables de Entorno

En tu archivo `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
RESEND_API_KEY=tu_resend_api_key
```

---

## 📊 VERIFICACIÓN MANUAL

Puedes verificar que todo está correcto ejecutando estas queries:

```sql
-- Ver todas las tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Ver subvenciones disponibles
SELECT region, subsidy_type, percentage, description 
FROM subsidies 
WHERE is_active = true;

-- Ver bonificaciones municipales
SELECT municipality, province, ibi_percentage, icio_percentage 
FROM municipal_tax_benefits 
WHERE is_active = true
ORDER BY autonomous_community, municipality;
```

---

## 🎉 ¡LISTO!

Si ves el mensaje "Script maestro ejecutado correctamente" y las tablas de verificación, **todo está perfecto**.

Ahora puedes:
1. ✅ Iniciar el servidor: `npm run dev`
2. ✅ Crear tu primer usuario
3. ✅ Configurar API de IA en Settings → Integraciones
4. ✅ Crear presentaciones PowerPoint con bonificaciones automáticas

---

**¿Problemas?** Revisa la sección de Solución de Problemas arriba.
