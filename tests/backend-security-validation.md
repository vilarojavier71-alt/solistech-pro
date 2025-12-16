# 🧪 Test de Validación - Backend Security

## Escenarios de Prueba Manual

### Test 1: Validación Zod - Cliente sin nombre
**Objetivo:** Verificar que Zod rechaza inputs inválidos

**Pasos:**
1. Abrir `/dashboard/customers`
2. Click en "Nuevo Cliente"
3. Dejar el campo "Nombre" vacío
4. Completar email: `test@example.com`
5. Click en "Crear Cliente"

**Resultado Esperado:**
```
❌ Error: "El nombre es obligatorio"
```

---

### Test 2: Validación Zod - Email inválido
**Objetivo:** Verificar formato de email

**Pasos:**
1. Nuevo cliente
2. Nombre: "Test Cliente"
3. Email: "email-invalido"
4. Click en "Crear Cliente"

**Resultado Esperado:**
```
❌ Error: "Email inválido"
```

---

### Test 3: Validación Zod - Teléfono inválido
**Objetivo:** Verificar regex de teléfono (9 dígitos)

**Pasos:**
1. Nuevo cliente
2. Nombre: "Test Cliente"
3. Teléfono: "12345" (menos de 9 dígitos)
4. Click en "Crear Cliente"

**Resultado Esperado:**
```
❌ Error: "El teléfono debe tener 9 dígitos"
```

---

### Test 4: Unique Constraint - Email duplicado
**Objetivo:** Verificar constraint de BD y mensaje amigable

**Pasos:**
1. Crear cliente con email: `duplicado@test.com`
2. Intentar crear OTRO cliente con el mismo email

**Resultado Esperado:**
```
❌ Error: "Ya existe un cliente con ese email en tu organización."
```

**NO debe mostrar:**
```
❌ Error: "duplicate key value violates unique constraint..."
```

---

### Test 5: RLS - Aislamiento de Organizaciones
**Objetivo:** Verificar que RLS bloquea lectura cross-tenant

**Pasos (requiere 2 cuentas):**
1. Login como Usuario A (Org A)
2. Crear cliente "Cliente Org A"
3. Logout
4. Login como Usuario B (Org B)
5. Ir a `/dashboard/customers`

**Resultado Esperado:**
```
✅ Lista de clientes VACÍA (no muestra "Cliente Org A")
```

---

### Test 6: Sesión Expirada
**Objetivo:** Verificar manejo de auth error

**Pasos:**
1. Abrir DevTools → Application → Cookies
2. Eliminar cookies de Supabase
3. Intentar crear cliente

**Resultado Esperado:**
```
❌ Error: "Sesión expirada. Por favor, inicia sesión de nuevo."
```

---

### Test 7: Cliente Válido
**Objetivo:** Verificar flujo exitoso

**Pasos:**
1. Nuevo cliente
2. Nombre: "Juan Pérez"
3. Email: "juan@example.com"
4. Teléfono: "612345678"
5. NIF: "12345678A"
6. Click en "Crear Cliente"

**Resultado Esperado:**
```
✅ "Cliente creado"
✅ Cliente aparece en la tabla
✅ organization_id = tu organización (verificar en BD)
```

---

## Verificación en Base de Datos

### Comprobar RLS Policies

```sql
-- Ver políticas activas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'customers';

-- Resultado esperado: 4 políticas
-- 1. Users can view customers from their organization (SELECT)
-- 2. Users can insert customers (INSERT)
-- 3. Users can update own org customers (UPDATE)
-- 4. Users can delete own org customers (DELETE)
```

### Comprobar Unique Constraint

```sql
-- Ver constraints
SELECT 
  conname,
  contype,
  pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'customers'::regclass
AND conname = 'unique_email_per_org';

-- Resultado esperado:
-- unique_email_per_org | u | UNIQUE NULLS NOT DISTINCT (email, organization_id)
```

---

## Checklist de Validación

- [ ] Test 1: Nombre vacío rechazado ✅
- [ ] Test 2: Email inválido rechazado ✅
- [ ] Test 3: Teléfono inválido rechazado ✅
- [ ] Test 4: Email duplicado con mensaje amigable ✅
- [ ] Test 5: RLS bloquea cross-tenant ✅
- [ ] Test 6: Sesión expirada manejada ✅
- [ ] Test 7: Cliente válido creado correctamente ✅

---

## Comandos de Verificación Rápida

### Verificar que Zod está instalado
```bash
npm list zod
```

### Ver logs de errores en consola del navegador
```javascript
// En DevTools Console
localStorage.setItem('debug', 'supabase:*')
```

### Verificar migración aplicada
```sql
SELECT 
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'customers';

-- Debe retornar: 4
```

---

## Resultado Esperado Final

✅ **Todas las pruebas pasan**  
✅ **Mensajes de error amigables**  
✅ **RLS funciona correctamente**  
✅ **No hay errores en consola**  
✅ **Backend Health Score: 95/100**
