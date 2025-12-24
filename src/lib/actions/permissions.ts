'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * Permission types - Solo booleanos, nunca roles internos
 */
export type Permission = 
    | 'view_financials'
    | 'view_projects_financials'
    | 'manage_team'
    | 'assign_leads'
    | 'edit_settings'
    | 'process_payments'
    | 'create_invoices'
    | 'manage_users'

/**
 * Obtiene los permisos del usuario actual (solo booleanos)
 * NUNCA expone roles internos al cliente
 */
export async function getUserPermissions(): Promise<Record<Permission, boolean>> {
    const session = await auth()
    if (!session?.user?.id) {
        // Usuario no autenticado - sin permisos
        return {
            view_financials: false,
            view_projects_financials: false,
            manage_team: false,
            assign_leads: false,
            edit_settings: false,
            process_payments: false,
            create_invoices: false,
            manage_users: false,
        }
    }

    try {
        // Obtener rol del usuario desde la base de datos (no del session)
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true, organization_id: true }
        })

        if (!user || !user.role) {
            return {
                view_financials: false,
                view_projects_financials: false,
                manage_team: false,
                assign_leads: false,
                edit_settings: false,
                process_payments: false,
                create_invoices: false,
                manage_users: false,
            }
        }

        // Mapeo de roles a permisos (solo en el servidor)
        const rolePermissions: Record<string, Permission[]> = {
            owner: ['view_financials', 'view_projects_financials', 'manage_team', 'assign_leads', 'edit_settings', 'process_payments', 'create_invoices', 'manage_users'],
            admin: ['view_financials', 'view_projects_financials', 'manage_team', 'assign_leads', 'edit_settings', 'process_payments', 'create_invoices', 'manage_users'],
            sales: ['view_financials', 'view_projects_financials', 'assign_leads', 'create_invoices'],
            commercial: ['view_financials', 'view_projects_financials', 'assign_leads', 'create_invoices'],
            engineer: ['view_projects_financials'],
            installer: [],
            pica: [],
            user: [],
        }

        const userPermissions = rolePermissions[user.role] || []

        // Retornar solo booleanos
        return {
            view_financials: userPermissions.includes('view_financials'),
            view_projects_financials: userPermissions.includes('view_projects_financials'),
            manage_team: userPermissions.includes('manage_team'),
            assign_leads: userPermissions.includes('assign_leads'),
            edit_settings: userPermissions.includes('edit_settings'),
            process_payments: userPermissions.includes('process_payments'),
            create_invoices: userPermissions.includes('create_invoices'),
            manage_users: userPermissions.includes('manage_users'),
        }
    } catch (error) {
        console.error('Error getting user permissions:', error)
        // En caso de error, retornar sin permisos
        return {
            view_financials: false,
            view_projects_financials: false,
            manage_team: false,
            assign_leads: false,
            edit_settings: false,
            process_payments: false,
            create_invoices: false,
            manage_users: false,
        }
    }
}

/**
 * Verifica un permiso específico
 */
export async function checkPermission(permission: Permission): Promise<boolean> {
    const permissions = await getUserPermissions()
    return permissions[permission]
}


