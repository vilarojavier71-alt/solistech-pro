# 📊 Informe de Deuda Técnica TypeScript

**Fecha:** 2025-12-20  
**Total Errores:** 230 errores en 92 archivos  
**Estado:** Deuda Técnica Preexistente

---

## Resumen Ejecutivo

| Categoría | Errores | % | Prioridad |
|-----------|---------|---|-----------|
| `prisma.User` → `prisma.users` | **78** | 34% | 🔴 Alta |
| `createClient` no definido | **22** | 10% | 🔴 Alta |
| Propiedades faltantes en tipos | **45** | 20% | 🟡 Media |
| Módulos/exports no encontrados | **18** | 8% | 🟡 Media |
| Nullables sin check | **12** | 5% | 🟢 Baja |
| react-hook-form Resolver | **10** | 4% | 🟢 Baja |
| Otros | **45** | 19% | 🟡 Media |

---

## 🔴 Cat. 1: `prisma.User` → `prisma.users` (78 errores)

**Fix:** Buscar/reemplazar global. Afecta 45+ archivos.

Principales: `src/lib/actions/*`, `src/app/dashboard/**/page.tsx`, `src/lib/auth.ts`

---

## 🔴 Cat. 2: `createClient` no definido (22 errores)

Función Supabase no importada.

Archivos: `calculate-grant.ts`, `help.ts`, `municipal-benefits*.ts`, `roi-calculator.ts`, `import-*.ts`

---

## 🟡 Cat. 3: Tipos incompatibles (45 errores)

- `Customer` falta `company`, `tax_id`, `full_name`
- `Invoice` falta `paid_amount`, `verifactu_*`, `payments`
- `Sale` falta múltiples propiedades
- `email: string | null` vs `string`

Principales: `invoices/[id]/page.tsx` (13), `customers/**`

---

## 🟡 Cat. 4: Exports no encontrados (18 errores)

| Módulo | Falta |
|--------|-------|
| `@/lib/actions/time-tracking` | `clockIn`, `clockOut`, `startBreak`, `endBreak`, etc. |
| `@/lib/actions/customers` | `getCustomer` |
| `@/lib/actions/auth-actions` | `registerUser` |
| `@/lib/actions/projects` | `enrichProjectWithCadastre` |
| `@/lib/auth/useUser` | Módulo completo |

---

## 🟢 Cat. 5: Nullables (12 errores)

`invoice.subtotal`, `invoice.total`, `calculation.total_subsidies` posiblemente null.

---

## 🟢 Cat. 6: react-hook-form (10 errores)

Resolver tipos incompatibles en `new-entry-form.tsx`, `advanced-member-wizard.tsx`.

---

## Otros

- **Stripe API:** Version mismatch `"2024-*"` vs `"2025-11-17.clover"`
- **Deno:** Módulos en `supabase/functions/` no resueltos
- **Vitest:** No instalado/configurado
- **PptxGenJS:** Tipos incompatibles

---

## Quick Wins

1. **`prisma.User` → `prisma.users`**: -78 errores (15 min)
2. **Resolver `createClient` imports**: -22 errores

## Decisiones Requeridas

- ¿Supabase client o 100% Prisma?
- ¿Actualizar Stripe API version?
- ¿Configurar Vitest?
