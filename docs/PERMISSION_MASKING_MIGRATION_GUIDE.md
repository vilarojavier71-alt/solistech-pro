# 🛡️ PERMISSION MASKING MIGRATION GUIDE

**Date:** 2025-01-XX  
**Status:** 🔴 **CRITICAL - 141 VIOLATIONS TO FIX**  
**ISO 27001:** A.8.28 - Zero-Flag Policy

---

## 📋 PATRÓN DE MIGRACIÓN

### ❌ ANTES (Violación):
```typescript
// ❌ Expone roles internos
const isAdmin = user.role === 'admin' || user.role === 'owner'
if (user.role !== 'admin') return { error: 'No autorizado' }
```

### ✅ DESPUÉS (Compliant):
```typescript
// ✅ Solo permisos booleanos
import { getUserPermissions } from '@/lib/actions/permissions'
const permissions = await getUserPermissions()
const isAdmin = permissions.manage_users || permissions.edit_settings
if (!permissions.manage_users) return { error: 'No autorizado' }
```

---

## 🔄 MIGRACIÓN POR TIPO DE ARCHIVO

### 1. Server Actions

**Patrón:**
```typescript
// ❌ ANTES
const user = await getCurrentUserWithRole()
if (user.role !== 'admin') return { error: 'No autorizado' }

// ✅ DESPUÉS
const user = await getCurrentUserWithRole()
const { getUserPermissions } = await import('@/lib/actions/permissions')
const permissions = await getUserPermissions()
if (!permissions.manage_users) return { error: 'No autorizado' }
```

### 2. Client Components

**Patrón:**
```typescript
// ❌ ANTES
const { data: profile } = useSession()
const isAdmin = profile?.user?.role === 'admin'

// ✅ DESPUÉS
import { usePermissionsSafe } from '@/hooks/use-permissions-safe'
const { permissions } = usePermissionsSafe()
const isAdmin = permissions.manage_users || permissions.edit_settings
```

### 3. API Routes

**Patrón:**
```typescript
// ❌ ANTES
const session = await auth()
if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// ✅ DESPUÉS
const session = await auth()
const { getUserPermissions } = await import('@/lib/actions/permissions')
const permissions = await getUserPermissions()
if (!permissions.manage_users) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

---

## 📊 ARCHIVOS PRIORITARIOS

### CRÍTICOS (Exponen roles en UI):
1. ✅ `src/app/dashboard/settings/page.tsx` - CORREGIDO
2. ⏳ `src/components/dashboard/team-table.tsx`
3. ⏳ `src/components/dashboard/admin/user-role-manager.tsx`
4. ⏳ `src/components/admin/users-table.tsx`

### ALTOS (Server Actions):
5. ⏳ `src/lib/actions/leave-management.ts`
6. ⏳ `src/lib/actions/support-tickets.ts`
7. ⏳ `src/lib/actions/user-actions.ts`
8. ⏳ `src/lib/actions/team-management.ts`

### MEDIOS (API Routes):
9. ⏳ `src/app/api/calculate-solar/route.ts`
10. ⏳ `src/app/api/webhooks/stripe/route.ts`

---

## ✅ CHECKLIST DE MIGRACIÓN

Para cada archivo:
- [ ] Reemplazar `user.role` con `getUserPermissions()`
- [ ] Reemplazar `profile.role` con `usePermissionsSafe()`
- [ ] Reemplazar `session.user.role` con permisos booleanos
- [ ] Eliminar comparaciones directas de roles
- [ ] Verificar que no se expongan roles en respuestas
- [ ] Añadir tests AAA para verificar Permission Masking

---

**Status:** 🔴 **EN PROGRESO - 1/141 COMPLETADO**

