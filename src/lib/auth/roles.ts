export type UserRole = 'owner' | 'admin' | 'user' | 'pica' | 'commercial' | 'engineer' | 'installer'

export const ROLES = {
    OWNER: 'owner',
    ADMIN: 'admin',
    USER: 'user',
    PICA: 'pica',
    COMMERCIAL: 'commercial',
    ENGINEER: 'engineer',
    INSTALLER: 'installer'
} as const

// Menú config base por rol
export const NAVIGATION_BY_ROLE: Record<UserRole, string[]> = {
    owner: ['all'],
    admin: ['all'],
    user: ['all'], // legacy

    // Pica: Dashboard, Agenda, Leads, Presupuestos, Calculadora
    pica: ['dashboard', 'calendar', 'leads', 'quotes', 'calculator'],

    // Commercial: Todo CRM + Ventas
    commercial: ['dashboard', 'calendar', 'leads', 'customers', 'sales', 'quotes', 'calculator', 'projects'],

    // Engineer: Proyectos, Documentación, Componentes (Settings limitados)
    engineer: ['dashboard', 'projects', 'installations', 'components', 'calculator'],

    // Installer: Instalaciones (Calendario Técnico)
    installer: ['dashboard', 'installations', 'calendar']
}

export function hasPermission(role: UserRole | null, resource: string): boolean {
    if (!role) return false
    if (role === 'owner' || role === 'admin') return true

    const allowedById = NAVIGATION_BY_ROLE[role]

    // Validación defensiva: verificar que allowedById existe
    if (!allowedById) return false

    if (allowedById.includes('all')) return true

    return allowedById.includes(resource)
}

export const ROLE_LABELS: Record<UserRole, string> = {
    owner: 'Propietario',
    admin: 'Administrador',
    user: 'Usuario',
    pica: 'Captador (Pica)',
    commercial: 'Comercial',
    engineer: 'Ingeniero',
    installer: 'Instalador'
}
