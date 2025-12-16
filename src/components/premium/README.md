# 🎨 Premium Components Library - Usage Guide

## Quick Start

```tsx
import {
  KPICardPremium,
  KPIGrid,
  AccordionPremium,
  LoadingStatePremium,
  DataTablePremium,
  OptimisticAction
} from '@/components/premium'
```

---

## 1. KPI Card Premium

### Basic Usage

```tsx
import { KPICardPremium, KPIGrid } from '@/components/premium'
import { Zap, TrendingUp } from 'lucide-react'

export function Dashboard() {
  return (
    <KPIGrid>
      <KPICardPremium
        icon={<Zap />}
        label="Potencia Instalada"
        value="8.5 kWp"
        trend={{ value: "+12.3%", direction: "up" }}
        sparkline={[12, 15, 13, 18, 20, 22, 25]}
        variant="teal"
      />
      
      <KPICardPremium
        icon={<TrendingUp />}
        label="ROI Anual"
        value="12.4%"
        subtitle="Retorno de inversión"
        variant="gold"
      />
    </KPIGrid>
  )
}
```

### Variants
- `default` - Slate colors
- `premium` - Navy institutional
- `gold` - Financial actions
- `teal` - Technical data

---

## 2. Accordion Premium

### Basic Usage

```tsx
import { AccordionPremium, AccordionGrid, AccordionField } from '@/components/premium'
import { Wrench, DollarSign } from 'lucide-react'

export function SystemConfig() {
  return (
    <AccordionPremium
      type="multiple"
      items={[
        {
          id: 'system',
          title: 'Configuración del Sistema',
          icon: <Wrench />,
          badge: '12 campos',
          defaultOpen: true,
          content: (
            <AccordionGrid cols={2}>
              <AccordionField label="Paneles" value="20 x 450W" />
              <AccordionField label="Inversor" value="Fronius 8kW" />
              <AccordionField label="Baterías" value="Tesla Powerwall 13.5kWh" />
            </AccordionGrid>
          )
        },
        {
          id: 'financial',
          title: 'Análisis Financiero',
          icon: <DollarSign />,
          badge: '8 campos',
          content: <div>Financial content...</div>
        }
      ]}
    />
  )
}
```

---

## 3. Loading States Premium

### Spinner

```tsx
<LoadingStatePremium
  type="spinner"
  message="Cargando proyectos..."
/>
```

### Skeleton

```tsx
<LoadingStatePremium type="skeleton" />
```

### Progress

```tsx
<LoadingStatePremium
  type="progress"
  progress={65}
  message="Generando PDF..."
/>
```

### Narrative (Steps)

```tsx
<LoadingStatePremium
  type="narrative"
  steps={[
    { label: "Conectando con base de datos" },
    { label: "Calculando ROI y métricas" },
    { label: "Preparando visualización" }
  ]}
  currentStep={1}
  progress={45}
/>
```

---

## 4. Data Table Premium

### Basic Usage

```tsx
import { DataTablePremium } from '@/components/premium'
import { Badge } from '@/components/ui/badge'

const columns = [
  {
    id: 'name',
    label: 'Cliente',
    accessor: 'name',
    sortable: true,
    width: 200
  },
  {
    id: 'email',
    label: 'Email',
    accessor: 'email',
    sortable: true
  },
  {
    id: 'status',
    label: 'Estado',
    accessor: 'status',
    render: (value) => (
      <Badge variant={value === 'active' ? 'default' : 'secondary'}>
        {value}
      </Badge>
    )
  },
  {
    id: 'amount',
    label: 'Importe',
    accessor: (row) => `€${row.amount.toLocaleString()}`,
    sortable: true,
    width: 150
  }
]

export function CustomerTable({ customers }) {
  return (
    <DataTablePremium
      columns={columns}
      data={customers}
      features={{
        virtualScroll: true,
        stickyHeader: true,
        compactView: true,
        export: true,
        search: true,
        sort: true
      }}
      onRowClick={(customer) => console.log('Clicked:', customer)}
      maxHeight="600px"
    />
  )
}
```

### Features
- **Virtual Scroll**: Renders only visible rows (10k+ rows at 60 FPS)
- **Sticky Header**: Header stays visible while scrolling
- **Compact View**: Toggle to show fewer columns
- **Export**: Download as CSV
- **Search**: Filter across all columns
- **Sort**: Click headers to sort

---

## 5. Optimistic Action

### Button with Optimistic Update

```tsx
import { OptimisticAction } from '@/components/premium'
import { Button } from '@/components/ui/button'

export function SaveButton({ customer, onUpdate }) {
  return (
    <OptimisticAction
      onAction={async () => {
        return await saveCustomer(customer)
      }}
      optimisticUpdate={() => {
        // Update UI immediately
        onUpdate({ ...customer, status: 'saving' })
      }}
      onSuccess={(result) => {
        // Update with real data
        onUpdate(result)
      }}
      onRevert={() => {
        // Revert on error
        onUpdate(customer)
      }}
      successMessage="Cliente guardado"
      errorMessage="Error al guardar"
    >
      <Button>Guardar Cliente</Button>
    </OptimisticAction>
  )
}
```

### With Custom Render Function

```tsx
<OptimisticAction
  onAction={deleteCustomer}
  successMessage="Cliente eliminado"
>
  {({ handleAction, isLoading }) => (
    <Button
      variant="destructive"
      onClick={handleAction}
      disabled={isLoading}
    >
      {isLoading ? 'Eliminando...' : 'Eliminar'}
    </Button>
  )}
</OptimisticAction>
```

### Optimistic List Hook

```tsx
import { useOptimisticList } from '@/components/premium'

export function CustomerList() {
  const {
    data: customers,
    addOptimistic,
    updateOptimistic,
    revertOptimistic,
    isTempId
  } = useOptimisticList(initialCustomers)

  const handleAdd = async (newCustomer) => {
    // 1. Add optimistically
    const tempId = addOptimistic(newCustomer)
    
    try {
      // 2. Save to server
      const result = await saveCustomer(newCustomer)
      
      // 3. Update with real ID
      updateOptimistic(tempId, result)
    } catch (error) {
      // 4. Revert on error
      revertOptimistic(tempId)
    }
  }

  return (
    <div>
      {customers.map(customer => (
        <div
          key={customer.id}
          className={isTempId(customer.id) ? 'opacity-50' : ''}
        >
          {customer.name}
        </div>
      ))}
    </div>
  )
}
```

### Optimistic Form

```tsx
import { OptimisticForm } from '@/components/premium'

export function CustomerForm() {
  return (
    <OptimisticForm
      onSubmit={async (data) => {
        return await saveCustomer(data)
      }}
      onSuccess={(result) => {
        router.push(`/customers/${result.id}`)
      }}
      successMessage="Cliente guardado"
    >
      {({ handleSubmit, isSubmitting }) => (
        <form onSubmit={(e) => {
          e.preventDefault()
          const formData = new FormData(e.currentTarget)
          handleSubmit(Object.fromEntries(formData))
        }}>
          <Input name="name" placeholder="Nombre" />
          <Input name="email" placeholder="Email" />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </form>
      )}
    </OptimisticForm>
  )
}
```

---

## Performance Tips

### KPI Cards
- Use sparklines sparingly (max 20-30 points)
- Memoize expensive calculations
- Use `React.memo` for static cards

### Data Table
- Enable virtual scroll for 100+ rows
- Limit initial data load (use pagination)
- Debounce search input (300ms)
- Use `useMemo` for filtered/sorted data

### Optimistic UI
- Keep optimistic updates simple
- Always provide revert logic
- Use temp IDs for new items
- Show visual feedback for pending items

---

## Accessibility

All components follow WCAG 2.1 AA standards:

- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Focus visible states
- ✅ ARIA labels
- ✅ Color contrast 4.5:1+

---

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile: iOS 14+, Android 10+
