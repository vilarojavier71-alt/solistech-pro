/**
 * Permission Helpers - Zero-Flag Policy
 * ISO 27001: A.8.28 - Secure Development
 * 
 * Helpers para verificar permisos sin exponer roles internos
 */

import { getUserPermissions, type Permission } from '@/lib/actions/permissions'

/**
 * Verifica si el usuario tiene un permiso específico
 * ✅ SEGURO: Solo retorna booleanos, nunca roles
 */
export async function hasPermission(permission: Permission): Promise<boolean> {
    const permissions = await getUserPermissions()
    return permissions[permission] || false
}

/**
 * Verifica múltiples permisos
 * ✅ SEGURO: Solo retorna booleanos
 */
export async function hasAnyPermission(permissions: Permission[]): Promise<boolean> {
    const userPermissions = await getUserPermissions()
    return permissions.some(p => userPermissions[p])
}

/**
 * Verifica si el usuario tiene todos los permisos requeridos
 * ✅ SEGURO: Solo retorna booleanos
 */
export async function hasAllPermissions(permissions: Permission[]): Promise<boolean> {
    const userPermissions = await getUserPermissions()
    return permissions.every(p => userPermissions[p])
}

/**
 * Mapeo de acciones comunes a permisos
 * ✅ SEGURO: No expone roles internos
 */
export const PERMISSION_MAP = {
    canViewFinancials: 'view_financials' as Permission,
    canManageTeam: 'manage_team' as Permission,
    canEditSettings: 'edit_settings' as Permission,
    canManageUsers: 'manage_users' as Permission,
    canProcessPayments: 'process_payments' as Permission,
    canCreateInvoices: 'create_invoices' as Permission,
    canAssignLeads: 'assign_leads' as Permission,
    canViewProjectsFinancials: 'view_projects_financials' as Permission,
} as const

/**
 * Obtiene permisos comunes como objeto con nombres descriptivos
 * ✅ SEGURO: Solo booleanos, nunca roles
 */
export async function getCommonPermissions() {
    const permissions = await getUserPermissions()
    return {
        canViewFinancials: permissions.view_financials,
        canManageTeam: permissions.manage_team,
        canEditSettings: permissions.edit_settings,
        canManageUsers: permissions.manage_users,
        canProcessPayments: permissions.process_payments,
        canCreateInvoices: permissions.create_invoices,
        canAssignLeads: permissions.assign_leads,
        canViewProjectsFinancials: permissions.view_projects_financials,
    }
}

