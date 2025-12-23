# 🌌 MPE-OS V3.0.0 - ANÁLISIS DE IMPACTO ARQUITECTÓNICO (DRY-RUN)

**Fecha:** 2025-01-XX  
**Versión:** 3.0.0  
**Arquitecto:** MPE-OS Elite Quantum-Sentinel

---

## 📊 RESUMEN EJECUTIVO

Este documento presenta el análisis de impacto previo a la implementación de las reglas modulares `.cursorrules` V3.0.0. El análisis identifica áreas críticas de refactorización, riesgos FinOps y vulnerabilidades de seguridad.

**Estado del Proyecto:**
- **Stack:** Next.js 14.2, React 19, TypeScript 5, Prisma 5.10, PostgreSQL
- **Arquitectura:** Monorepo Next.js con API Routes, Server Components
- **Infraestructura:** Docker multi-stage, Coolify deployment

---

## 1. 🏗️ IMPACTO ARQUITECTÓNICO

### 1.1 Regla de las 20 Líneas por Función

**Impacto:** 🔴 **ALTO**

**Hallazgos:**
- **275 instancias de `any`** detectadas en 123 archivos
- Funciones complejas en:
  - `src/lib/actions/` (62 archivos de acciones)
  - `src/components/` (212 componentes)
  - `src/lib/import-engine/` (procesamiento de datos)

**Módulos Críticos Requeridos de Refactorización:**

| Módulo | Archivos Afectados | Líneas Promedio/Función | Prioridad |
|--------|-------------------|------------------------|-----------|
| `lib/actions/accounting.ts` | 1 | ~45 líneas | 🔴 CRÍTICA |
| `lib/actions/import-processing.ts` | 1 | ~60 líneas | 🔴 CRÍTICA |
| `lib/powerpoint/generator.ts` | 1 | ~80 líneas | 🔴 CRÍTICA |
| `components/calculator/solar-calculator.tsx` | 1 | ~120 líneas | 🔴 CRÍTICA |
| `hooks/useOfflineSync.ts` | 1 | ~432 líneas total | 🔴 CRÍTICA |

**Plan de Migración:**
1. **Fase 1 (Semana 1-2):** Refactorizar funciones >50 líneas en módulos críticos
2. **Fase 2 (Semana 3-4):** Aplicar regla 20 líneas a funciones 30-50 líneas
3. **Fase 3 (Semana 5-6):** Optimización final y validación

**Estrategia de Refactorización:**
- Extraer lógica de negocio a funciones puras
- Crear hooks personalizados para lógica reutilizable
- Implementar composición de funciones (pipe/compose)
- Separar validación, transformación y efectos secundarios

---

### 1.2 Integración con Módulos Existentes

**TypeScript Strict Mode:**
- ✅ Ya configurado (`strict: true` en `tsconfig.json`)
- ⚠️ **Problema:** 275 usos de `any` requieren migración gradual

**Prisma ORM:**
- ✅ Compatible con reglas SQL (MAYÚSCULAS, snake_case)
- ⚠️ **Acción:** Auditar migraciones para cumplir estándares

**Next.js App Router:**
- ✅ Compatible con RSC (React Server Components)
- ✅ API Routes en `src/app/api/` listos para reglas backend

**Atomic Design:**
- ⚠️ **Estado Actual:** Componentes no organizados por Atomic Design
- **Acción:** Reorganizar `src/components/` en:
  - `atoms/` (botones, inputs, badges)
  - `molecules/` (formularios, cards, modales)
  - `organisms/` (dashboards, tablas complejas, wizards)

---

## 2. 💰 RIESGO FINOPS (Grupo 622x)

### 2.1 Infraestructura que Dispara Asientos Contables

**Proveedores Identificados:**
- **Hetzner** (VPS principal)
- **Netcup** (Failover)
- **Supabase** (Base de datos, funciones edge)
- **Stripe** (Pagos, webhooks)
- **Resend** (Email)
- **Sentry** (Error tracking)

**Puntos de Escalado Automático (Riesgo 622x):**

| Recurso | Trigger | Costo Estimado/Mes | Guardrail Requerido |
|---------|---------|-------------------|---------------------|
| VPS Hetzner | Auto-scaling no configurado | €20-200 | ✅ Validación presupuesto mensual |
| Supabase DB | Storage >10GB | $25-100 | ✅ Alertas en 8GB |
| Supabase Functions | Invocaciones >2M | $20-80 | ✅ Rate limiting en API |
| Stripe Webhooks | Eventos >100k | $0 (incluido) | ✅ Validación idempotencia |
| Resend | Emails >50k | $20-100 | ✅ Queue con límite diario |

**Implementación de Guardrails:**

```typescript
// Ejemplo: src/lib/finops/budget-guardrail.ts
interface BudgetGuardrail {
  monthlyLimit: number
  currentSpend: number
  alerts: Array<{ threshold: number; action: 'warn' | 'block' }>
}

// Validación antes de escalado
async function validateInfrastructureScaling(
  resource: string,
  requestedIncrease: number
): Promise<boolean> {
  const budget = await getCurrentBudget()
  const projectedCost = calculateProjectedCost(resource, requestedIncrease)
  
  if (projectedCost > budget.monthlyLimit * 0.9) {
    logStructured({
      timestamp: new Date().toISOString(),
      source: 'finops',
      action: 'block_scaling',
      error: 'Budget threshold exceeded'
    })
    return false
  }
  return true
}
```

**Acciones Inmediatas:**
1. Implementar middleware de validación en API routes de infraestructura
2. Configurar alertas CloudWatch/Sentry para umbrales de costo
3. Crear dashboard FinOps en `/dashboard/admin/finops`

---

### 2.2 Transacciones Financieras y Race Conditions

**Riesgo Detectado:**
- **53 archivos** con SQL queries detectados
- ⚠️ **No se encontraron `SELECT FOR UPDATE`** en transacciones críticas

**Módulos Críticos Sin Protección:**
- `src/lib/actions/accounting.ts` (asientos contables)
- `src/lib/actions/payments.ts` (procesamiento de pagos)
- `src/lib/actions/invoices.ts` (generación de facturas)
- `src/lib/actions/subscriptions.ts` (gestión de suscripciones)

**Ejemplo de Vulnerabilidad:**

```typescript
// ❌ VULNERABLE: Race condition en actualización de saldo
async function processPayment(invoiceId: string, amount: number) {
  const invoice = await prisma.invoices.findUnique({ where: { id: invoiceId } })
  const newBalance = invoice.balance - amount
  await prisma.invoices.update({
    where: { id: invoiceId },
    data: { balance: newBalance }
  })
}

// ✅ SEGURO: Con SELECT FOR UPDATE
async function processPaymentSafe(invoiceId: string, amount: number) {
  await prisma.$transaction(async (tx) => {
    const invoice = await tx.$queryRaw`
      SELECT * FROM invoices 
      WHERE id = ${invoiceId} 
      FOR UPDATE
    `
    const newBalance = invoice.balance - amount
    await tx.invoices.update({
      where: { id: invoiceId },
      data: { balance: newBalance }
    })
  })
}
```

**Plan de Acción:**
1. Auditar todas las transacciones financieras
2. Implementar `SELECT FOR UPDATE` en:
   - Actualización de balances
   - Procesamiento de pagos
   - Asignación de recursos limitados
   - Actualización de inventario

---

## 3. 🔒 VULNERABILIDADES RED TEAM (Zero-Flag Policy)

### 3.1 Fuga de User-Flags y Roles Internos

**Hallazgos Críticos:**

#### 3.1.1 Frontend Expone Roles Internos
**Archivos Afectados:**
- `src/components/auth/role-guard.tsx`
- `src/hooks/use-user-role.ts`
- `src/lib/rbac.ts`

**Vulnerabilidad:**
```typescript
// ❌ PELIGROSO: Expone roles internos al frontend
const userRole = session.user.role // "admin", "employee", "god_mode"

// ✅ SEGURO: Permission masking
const canEditUsers = await checkPermission('users:edit') // boolean
```

**Impacto:** Un atacante podría inferir la estructura de permisos y roles internos.

#### 3.1.2 No-Raw-Fetch Policy Violations
**23 archivos** usando `fetch()` o `axios` directamente:

| Archivo | Uso | Riesgo |
|---------|-----|--------|
| `src/lib/actions/catastro.ts` | `fetch()` directo | 🔴 SSRF potencial |
| `src/app/api/proxy/pvgis/[...path]/route.ts` | Proxy sin validación | 🔴 SSRF crítico |
| `src/components/calculator/solar-calculator.tsx` | `fetch()` en componente | 🟡 Data leakage |

**Solución:**
- Centralizar todas las peticiones en `src/hooks/use-api-request.ts`
- Implementar validación de URLs en proxy
- Añadir rate limiting por usuario

---

### 3.2 Vulnerabilidades de Seguridad Identificadas

#### 3.2.1 IDOR (Insecure Direct Object Reference)
**Riesgo:** Acceso no autorizado a recursos por manipulación de IDs

**Archivos a Auditar:**
- `src/app/api/*/route.ts` (todas las API routes)
- `src/lib/actions/*.ts` (acciones del servidor)

**Checklist de Prevención:**
- [ ] Validar ownership de recursos antes de acceso
- [ ] Implementar row-level security (RLS) en Prisma
- [ ] Usar UUIDs opacos en lugar de IDs secuenciales

#### 3.2.2 SSRF (Server-Side Request Forgery)
**Riesgo Crítico en:**
- `src/app/api/proxy/pvgis/[...path]/route.ts`
- `src/lib/services/catastro.ts` (proxy a APIs externas)

**Mitigación:**
```typescript
// ✅ Validación de URL permitida
const ALLOWED_DOMAINS = ['api.pvgis.org', 'catastro.gob.es']

function validateProxyUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ALLOWED_DOMAINS.includes(parsed.hostname)
  } catch {
    return false
  }
}
```

#### 3.2.3 Logic Flaws
**Áreas de Riesgo:**
- Sistema de permisos RBAC
- Validación de suscripciones
- Procesamiento de pagos

**Acción:** Implementar tests de penetración automatizados en CI/CD

---

## 4. 📋 PLAN DE IMPLEMENTACIÓN

### Fase 1: Preparación (Semana 1)
- [x] Análisis de impacto (este documento)
- [x] Crear estructura de `.cursorrules` modulares
- [x] Configurar suite de tests AAA para validar reglas

### Fase 2: Despliegue (Semana 2-3) ✅ COMPLETADO
- [x] Implementar `.cursorrules` en raíz (General + Seguridad PQC)
- [x] Implementar `src/.cursorrules` (frontend - Atomic Design + No-Raw-Fetch)
- [x] Implementar `src/lib/actions/.cursorrules` (backend - SQL + FinOps)
- [x] Implementar `docker/.cursorrules` (infraestructura + Anti-Ban)
- [x] Crear suite de tests AAA (`tests/cursorrules-validation.test.ts`)

### Fase 3: Refactorización Gradual (Semana 4-8) 🚧 EN PROGRESO
- [ ] Migrar funciones >50 líneas
- [ ] Eliminar todos los `any` types
- [ ] Centralizar `fetch()` en hooks
- [ ] Implementar `SELECT FOR UPDATE` en transacciones

### Fase 4: Verificación (Semana 9)
- [x] Ejecutar suite de tests AAA (tests creados, pendiente ejecución)
- [ ] Auditoría de seguridad Red Team
- [ ] Validación FinOps

---

## 5. 🎯 MÉTRICAS DE ÉXITO

| Métrica | Baseline | Objetivo V3.0.0 | Estado |
|---------|----------|-----------------|--------|
| Funciones >20 líneas | ~150 | 0 | 🔴 |
| Uso de `any` | 275 | 0 | 🔴 |
| Raw `fetch()` | 23 | 0 | 🔴 |
| Transacciones sin `FOR UPDATE` | ~10 | 0 | 🟡 |
| Cobertura de tests | ? | >80% | ⚪ |

---

## 6. ⚠️ RIESGOS Y MITIGACIONES

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Refactorización rompe funcionalidad existente | Media | Alto | Tests E2E antes de refactorizar |
| Migración de `any` introduce bugs | Alta | Medio | Migración gradual con tipos estrictos |
| Reglas muy restrictivas bloquean desarrollo | Baja | Medio | Modo "warn" inicial, "error" después |
| FinOps guardrails bloquean escalado legítimo | Baja | Alto | Alertas tempranas y aprobación manual |

---

**Firmado:** MPE-OS Elite Quantum-Sentinel Architect  
**Próximo Paso:** Proceder con Fase 2 - Despliegue Modular de `.cursorrules`

