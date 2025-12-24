# 🔄 GUÍA DE MIGRACIÓN - MPE-OS V3.0.0

**Fecha:** 2025-01-20  
**Versión:** 1.0.0

---

## 📋 ÍNDICE

1. [Migración de `fetch()` a Hooks Centralizados](#1-migración-de-fetch-a-hooks-centralizados)
2. [Migración de Permisos a Permission Masking](#2-migración-de-permisos-a-permission-masking)
3. [Refactorización de Funciones >50 Líneas](#3-refactorización-de-funciones-50-líneas)
4. [Migración de `any` Types](#4-migración-de-any-types)

---

## 1. Migración de `fetch()` a Hooks Centralizados

### ❌ ANTES (Prohibido)

```typescript
// ❌ PROHIBIDO: fetch() directo en componente
const handleCalculate = async () => {
    const response = await fetch('/api/calculate-solar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    const result = await response.json()
    setResult(result)
}
```

### ✅ DESPUÉS (Correcto)

**Opción 1: Hook Específico (Recomendado)**
```typescript
// ✅ CORRECTO: Hook específico para cálculos solares
import { useSolarCalculation } from '@/hooks/use-solar-calculation'

function SolarCalculator() {
    const { calculate, result, isCalculating, error } = useSolarCalculation()
    
    const handleCalculate = async () => {
        try {
            await calculate({
                consumption,
                installationType,
                location: { lat, lng },
                roofOrientation,
                roofTilt
            })
        } catch (err) {
            // Error ya manejado por el hook
        }
    }
}
```

**Opción 2: Hook Genérico**
```typescript
// ✅ CORRECTO: Hook genérico para peticiones
import { useApiMutation } from '@/hooks/use-api-request'

function MyComponent() {
    const { mutate, data, error, isLoading } = useApiMutation<ResultType, InputType>(
        '/api/endpoint',
        { method: 'POST' }
    )
    
    const handleSubmit = async (input: InputType) => {
        await mutate(input)
    }
}
```

---

## 2. Migración de Permisos a Permission Masking

### ❌ ANTES (Prohibido - Expone Roles)

```typescript
// ❌ PROHIBIDO: Expone roles internos
import { useUserRole } from '@/hooks/use-user-role'

function MyComponent() {
    const { role, isAdmin } = useUserRole() // Expone "admin", "owner", etc.
    
    if (role === 'admin') {
        // ...
    }
}
```

### ✅ DESPUÉS (Correcto - Permission Masking)

```typescript
// ✅ CORRECTO: Solo booleanos de permisos
import { usePermissionsSafe } from '@/hooks/use-permissions-safe'

function MyComponent() {
    const { hasPermission, permissions } = usePermissionsSafe()
    
    // Verificar permiso específico
    if (hasPermission('manage_team')) {
        // ...
    }
    
    // O usar el objeto completo
    if (permissions.view_financials) {
        // ...
    }
}
```

**Hook para un solo permiso:**
```typescript
import { usePermission } from '@/hooks/use-permissions-safe'

function MyComponent() {
    const { hasPermission, isLoading } = usePermission('manage_team')
    
    if (hasPermission) {
        // ...
    }
}
```

---

## 3. Refactorización de Funciones >50 Líneas

### ❌ ANTES (Viola regla de 20 líneas)

```typescript
// ❌ PROHIBIDO: Función de 60+ líneas
export async function createInvoice(rawData: InvoiceData) {
    // Validación (5 líneas)
    const validationResult = CreateInvoiceSchema.safeParse(rawData)
    // ...
    
    // Cálculo de totales (25 líneas)
    let subtotal = 0
    let taxAmount = 0
    const processedLines = data.lines.map((line, index) => {
        // ... 20 líneas de lógica
    })
    
    // Creación en BD (30 líneas)
    const invoice = await prisma.$transaction(async (tx) => {
        // ... 25 líneas
    })
    
    // Generación QR (10 líneas)
    // ...
}
```

### ✅ DESPUÉS (Refactorizado)

```typescript
// ✅ CORRECTO: Funciones pequeñas y modulares
import { calculateInvoiceTotals } from '@/lib/utils/invoice-calculations'

export async function createInvoice(rawData: InvoiceData) {
    // Validación (función separada)
    const validationResult = validateInvoiceData(rawData)
    if (!validationResult.success) {
        return { error: "Datos inválidos" }
    }
    
    // Cálculo de totales (función pura extraída)
    const { subtotal, taxAmount, total, processedLines } = 
        calculateInvoiceTotals(data.lines, fixMojibake)
    
    // Creación en BD (función separada)
    const invoice = await createInvoiceInDB({
        data,
        totals: { subtotal, taxAmount, total },
        processedLines
    })
    
    // Generación QR (función separada)
    const qrCode = await generateInvoiceQR(invoice)
    
    return { data: invoice, error: null }
}
```

**Estrategia de Refactorización:**
1. Extraer lógica de cálculo a funciones puras
2. Separar validación en funciones helper
3. Dividir operaciones de BD en funciones específicas
4. Mantener funciones principales <20 líneas

---

## 4. Migración de `any` Types

### ❌ ANTES (Prohibido)

```typescript
// ❌ PROHIBIDO: Uso de any
function processData(data: any): any {
    return data.map((item: any) => {
        // ...
    })
}

catch (error: any) {
    console.error(error.message)
}
```

### ✅ DESPUÉS (Correcto)

```typescript
// ✅ CORRECTO: Tipos estrictos
interface DataItem {
    id: string
    name: string
    value: number
}

function processData(data: DataItem[]): ProcessedData[] {
    return data.map((item: DataItem) => {
        // ...
    })
}

// Manejo de errores
catch (error) {
    const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unknown error'
    console.error(errorMessage)
}
```

**Estrategias:**
1. **Usar `unknown` cuando el tipo es realmente desconocido:**
   ```typescript
   function processUnknown(data: unknown): string {
       if (typeof data === 'string') {
           return data
       }
       return 'default'
   }
   ```

2. **Type Guards para validación:**
   ```typescript
   function isInvoiceData(data: unknown): data is InvoiceData {
       return (
           typeof data === 'object' &&
           data !== null &&
           'customerId' in data &&
           'lines' in data
       )
   }
   ```

3. **Genéricos para funciones reutilizables:**
   ```typescript
   function processArray<T>(items: T[], processor: (item: T) => T): T[] {
       return items.map(processor)
   }
   ```

---

## 📊 CHECKLIST DE MIGRACIÓN

### Fase 1: Seguridad (✅ Completado)
- [x] Eliminar secretos hardcodeados
- [x] Implementar protección SSRF
- [x] Añadir SELECT FOR UPDATE
- [x] Implementar Permission Masking

### Fase 2: Arquitectura (🚧 En Progreso)
- [x] Crear hooks centralizados
- [ ] Migrar fetch() críticos (33 instancias)
- [ ] Refactorizar funciones >50 líneas (~150 funciones)
- [ ] Migrar any types críticos (401 instancias)

### Fase 3: Optimización (⏳ Pendiente)
- [ ] Optimizar bundle size
- [ ] Implementar optimistic updates
- [ ] Añadir tests unitarios
- [ ] Documentar componentes

---

## 🎯 PRIORIZACIÓN

### Alta Prioridad
1. Migrar `fetch()` en componentes de cálculo solar
2. Refactorizar `createInvoice()` (ya iniciado)
3. Migrar `any` types en módulos financieros

### Media Prioridad
1. Migrar permisos en componentes existentes
2. Refactorizar funciones de importación
3. Migrar `any` types en módulos de autenticación

### Baja Prioridad
1. Refactorización completa de funciones >50 líneas
2. Migración completa de `any` types
3. Optimizaciones de performance

---

## 📝 NOTAS

- **Migración Gradual:** No es necesario migrar todo de una vez
- **Tests:** Añadir tests antes de refactorizar funciones críticas
- **Documentación:** Actualizar JSDoc después de refactorizar
- **Revisión:** Code review antes de merge

---

**Última actualización:** 2025-01-20


