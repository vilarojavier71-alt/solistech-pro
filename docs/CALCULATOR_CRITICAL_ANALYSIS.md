# 🔍 CALCULATOR MODULE - CRITICAL FAILURE ANALYSIS

**Date:** 2025-01-XX  
**Module:** `/dashboard/calculator`  
**Severity:** CRITICAL (Error 500 + TypeError)

---

## FASE 1: ROOT CAUSE ANALYSIS

### 1.1 Server Component Error 500

**Origen Identificado:**
- **File:** `src/app/dashboard/calculator/page.tsx` (Server Component)
- **Líneas:** 16-34
- **Problema:** Consultas a Prisma sin `try/catch` adecuado
- **Riesgo:** Si `prisma.organizations.findUnique()` o `prisma.customers.findMany()` fallan, el Server Component crashea con 500

**Código Vulnerable:**
```typescript
export default async function CalculatorPage() {
    const user = await getCurrentUserWithRole()
    // ❌ Sin try/catch - Si user es null, puede fallar
    if (user?.organizationId) {
        const org = await prisma.organizations.findUnique({...}) // ❌ Sin try/catch
        customers = await prisma.customers.findMany({...}) // ❌ Sin try/catch
    }
}
```

**Impacto:**
- Usuario sin organización → 500 Internal Server Error
- Fallo de conexión DB → 500 Internal Server Error
- Variable de entorno faltante → 500 Internal Server Error

---

### 1.2 TypeError: Failed to execute 'createObjectURL'

**Origen Identificado:**
- **File:** `src/components/calculator/solar-calculator-premium.tsx`
- **Línea:** 324-325
- **Problema:** `generateTechnicalMemory()` puede retornar `{ error: string }` en lugar de Buffer
- **Riesgo:** `URL.createObjectURL()` recibe un objeto no-Blob → TypeError

**Código Vulnerable:**
```typescript
const handleGeneratePDF = async () => {
    const pdfBlob = await generateTechnicalMemory(savedCalculationId)
    // ❌ No valida si pdfBlob es un error
    const url = URL.createObjectURL(pdfBlob as unknown as Blob) // ❌ CRASH si es { error: "..." }
}
```

**Análisis de `generateTechnicalMemory`:**
- **File:** `src/lib/actions/technical-memory.ts`
- **Línea 15:** Retorna `{ error: 'No autenticado' }` si no hay user
- **Línea 28:** Retorna `{ error: 'Cálculo no encontrado' }` si no hay calc
- **Línea 92:** Retorna `pdfBuffer` (Buffer) si éxito
- **Línea 97:** Retorna `{ error: errorMessage }` si catch

**Conclusión:** El cliente no valida el tipo de retorno antes de crear Blob.

---

### 1.3 Riesgo de Seguridad

#### A. SSRF (Server-Side Request Forgery)
- **File:** `src/app/api/calculate-solar/route.ts`
- **Línea 66:** Construye URL de PVGIS sin validación
- **Riesgo:** Si `location.lat` o `location.lng` son manipulados, podría intentar acceder a recursos internos
- **Mitigación Requerida:** Validar que la URL solo apunte a `re.jrc.ec.europa.eu`

#### B. Logic Flaws (Valores Negativos)
- **File:** `src/app/api/calculate-solar/route.ts`
- **Línea 90:** `systemSize = Math.ceil((consumption / annualProduction) * 10) / 10`
- **Riesgo:** Si `consumption` es negativo o `annualProduction` es 0, puede generar valores inválidos
- **Mitigación Requerida:** Validar inputs con Zod antes de calcular

#### C. PII Exposure
- **File:** `src/lib/actions/technical-memory.ts`
- **Línea 45-47:** `customerName`, `customerEmail`, `customerPhone` están hardcodeados
- **Riesgo:** Si se añaden datos reales, podrían viajar sin cifrado
- **Mitigación:** Asegurar que PII solo viaje en Server Actions, nunca en API responses

---

## FASE 2: VULNERABILITIES DETECTED

### 2.1 No-Raw-Fetch Policy Violation
- **File:** `src/components/calculator/solar-calculator-premium.tsx`
- **Línea 221:** `fetch('/api/calculate-solar', ...)` directo
- **Hook Disponible:** `src/hooks/use-solar-calculation.ts` existe pero no se usa
- **Impacto:** Lógica de fetching duplicada, difícil de testear

### 2.2 Type Safety Violations
- **Uso de `any`:** 15+ ocurrencias en módulo calculator
- **Sin validación Zod:** Inputs no validados antes de procesar
- **Interfaces incompletas:** `result: any` en lugar de tipo estricto

### 3.3 FinOps Guardrails Missing
- **File:** `src/lib/actions/technical-memory.ts`
- **Problema:** Generación de PDF consume recursos (renderToBuffer) sin validar presupuesto
- **Impacto:** EDoS potencial si se generan muchos PDFs
- **Solución:** Integrar `validateInfrastructureScaling` antes de generar PDF

---

## FASE 3: REMEDIATION PLAN

### Prioridad 1 (CRÍTICO):
1. ✅ Añadir Error Boundary en Server Component
2. ✅ Validar retorno de `generateTechnicalMemory` antes de `createObjectURL`
3. ✅ Migrar `fetch` directo a hook `use-solar-calculation`

### Prioridad 2 (ALTO):
4. ✅ Añadir try/catch en Server Component
5. ✅ Validar inputs con Zod en API route
6. ✅ Protección SSRF en URL de PVGIS

### Prioridad 3 (MEDIO):
7. ✅ Integrar FinOps guardrails en generación PDF
8. ✅ Eliminar todos los `any`
9. ✅ Tests AAA para flujo completo

---

**Status:** ✅ ANÁLISIS COMPLETADO  
**Next:** Ejecutar remediación FASE 2

