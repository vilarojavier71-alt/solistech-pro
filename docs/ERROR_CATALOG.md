# Biblioteca de Errores MotorGap 🛡️

**Última actualización**: 21 Diciembre 2024  
**Mantenido por**: @CIO_INFRA

---

## Índice de Errores

| ID | Error | Severidad | Estado | Solución |
|----|-------|-----------|--------|----------|
| E001 | Server Component Crash | 🔴 Crítico | ✅ Resuelto | Error Boundaries |
| E002 | UTF-8 Stream Build | 🟡 Medio | ⚠️ Conocido | Ignorar en build |
| E003 | Hydration Mismatch | 🟡 Medio | ✅ Resuelto | useEffect para fechas |
| E004 | Prisma Null Access | 🔴 Crítico | ✅ Resuelto | Try-catch + defaults |
| E005 | DYNAMIC_SERVER_USAGE | 🟢 Bajo | ℹ️ Esperado | Páginas dinámicas |

---

## E001: Server Component Crash (Dashboard)

### Síntomas

- Pantalla blanca en `/dashboard`
- Error genérico en producción
- Digest: `DYNAMIC_SERVER_ERROR`

### Causa Raíz

Acceso a propiedades de objetos `null` retornados por Prisma cuando:

- Usuario sin organización
- Queries sin datos
- Campos opcionales no manejados

### Solución Implementada

```typescript
// dashboard-stats.ts - Try-catch global + .catch() individual
const [totalRevenueResult, ...] = await Promise.all([
    prisma.invoices.aggregate({...}).catch(() => ({ _sum: { total: null } })),
    // ...
])
```

### Archivos Afectados

- `src/lib/actions/dashboard-stats.ts`
- `src/app/dashboard/error.tsx` (Error Boundary)
- `src/app/dashboard/loading.tsx` (Loading State)

### Test de Regresión

```bash
# Verificar que /dashboard carga sin errores
curl -s -o /dev/null -w "%{http_code}" https://motorgap.es/dashboard
# Esperado: 200
```

---

## E002: UTF-8 Stream Build Warning

### Síntomas

```
Warning: UTF-8 stream couldn't be rendered statically
```

### Causa Raíz

Next.js intenta pre-renderizar páginas que contienen caracteres especiales o emojis en contenido dinámico.

### Solución

**Ignorar** - Es un warning, no un error. La página se renderizará dinámicamente.

### Configuración

```javascript
// next.config.mjs
typescript: {
    ignoreBuildErrors: true,
}
```

---

## E003: Hydration Mismatch

### Síntomas

- Parpadeo en la UI
- Error en consola: "Hydration failed because..."
- Contenido diferente servidor vs cliente

### Causa Raíz

- Fechas renderizadas con `new Date()` en el servidor
- IDs generados aleatoriamente
- LocalStorage accedido durante SSR

### Solución Implementada

```typescript
// Usar useEffect para datos que varían
const [mounted, setMounted] = useState(false)
useEffect(() => setMounted(true), [])

if (!mounted) return <Skeleton />
return <div>{new Date().toLocaleDateString()}</div>
```

### Archivos Afectados

- Componentes con fechas dinámicas
- Theme toggles
- Anything using `localStorage`

---

## E004: Prisma Null Property Access

### Síntomas

```
TypeError: Cannot read properties of null (reading 'name')
TypeError: Cannot read properties of undefined (reading 'toNumber')
```

### Causa Raíz

Acceder a `.name`, `.toNumber()`, etc. sin verificar si el objeto existe.

### Solución Implementada

```typescript
// Siempre usar optional chaining + defaults
const total = result._sum.total?.toNumber?.() || 0
const name = customer?.name || 'Cliente'
```

### Patrón Recomendado

```typescript
// ❌ MAL
const revenue = await prisma.invoices.aggregate({...})
return revenue._sum.total.toNumber() // CRASH si null

// ✅ BIEN
const revenue = await prisma.invoices.aggregate({...})
    .catch(() => ({ _sum: { total: null } }))
return revenue._sum.total?.toNumber?.() || 0
```

---

## E005: DYNAMIC_SERVER_USAGE

### Síntomas

```
Error: Dynamic server usage: [...Page] couldn't be rendered statically
digest: 'DYNAMIC_SERVER_USAGE'
```

### Causa Raíz

Páginas que usan `headers()`, `cookies()`, o datos de sesión no pueden pre-renderizarse.

### Solución

**Esperado** - No es un error. Next.js las marcará como `ƒ (Dynamic)` en el build.

### Páginas Afectadas

- `/dashboard/*` (todas requieren sesión)
- `/api/*` (todas son dinámicas)
- `/dashboard/mail` (Gmail OAuth)

---

## Protocolo de Nuevos Errores

### 1. Detección

- Sentry alertará automáticamente
- Revisar logs de Coolify diariamente

### 2. Documentación

Añadir a esta biblioteca:

```markdown
## EXXX: [Nombre del Error]

### Síntomas
...

### Causa Raíz
...

### Solución
...

### Test de Regresión
...
```

### 3. Prevención

- Añadir test automático si es posible
- Actualizar error boundaries si aplica

---

## Comandos de Diagnóstico

```bash
# Verificar health de producción
curl https://motorgap.es/api/health

# Build local para detectar errores
npm run build 2>&1 | grep -i error

# Buscar `any` en TypeScript
grep -r "any" src/lib/actions/*.ts --include="*.ts"

# Verificar null checks en Prisma
grep -r "?.toNumber" src/
```

---

*Documento mantenido por el equipo de Infraestructura de MotorGap*
