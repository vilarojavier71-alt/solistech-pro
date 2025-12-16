import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export const PERMISSIONS = {
    // Operativa Diaria
    DASHBOARD_VIEW: 'dashboard:view',
    CALENDAR_VIEW: 'calendar:view',
    CALENDAR_MANAGE: 'calendar:manage',

    // Negocio
    PROJECTS_VIEW: 'projects:view',
    PROJECTS_MANAGE: 'projects:manage',
    CRM_VIEW: 'crm:view',
    CRM_MANAGE: 'crm:manage',
    INVENTORY_VIEW: 'inventory:view',
    INVENTORY_MANAGE: 'inventory:manage',

    // Herramientas
    CALCULATOR_USE: 'calculator:use',
    SOLAR_BRAIN_USE: 'solar-brain:use',
    IMPORT_USE: 'import:use',
    TIME_TRACKING_VIEW: 'time-tracking:view',
    TIME_TRACKING_MANAGE: 'time-tracking:manage',

    // Administración
    FINANCE_VIEW: 'finance:view',
    FINANCE_MANAGE: 'finance:manage',
    SETTINGS_VIEW: 'settings:view',
    SETTINGS_MANAGE: 'settings:manage',
    USERS_VIEW: 'users:view',
    USERS_MANAGE: 'users:manage',

    // Portal Cliente
    CLIENT_VIEW_OWN_PROJECT: 'client:view-own-project',
    CLIENT_VIEW_DOCUMENTS: 'client:view-documents',
    CLIENT_DOWNLOAD_INVOICE: 'client:download-invoice',
    CLIENT_UPLOAD_DOCUMENTS: 'client:upload-documents',

    // Solar Core
    SOLAR_CREATE_SALE: 'solar:create-sale',
    SOLAR_VIEW_ALL: 'solar:view-all',
    SOLAR_VIEW_OWN: 'solar:view-own',
    FINANCE_RECONCILE: 'finance:reconcile',
    ENGINEERING_REVIEW: 'engineering:review',

    // Site Management (New)
    SITE_UPLOAD_EVIDENCE: 'site:upload-evidence',

    // Audit (New)
    FINANCE_AUDIT_LOGS: 'finance:audit-logs',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/**
 * Roles del sistema v2
 */
export const ROLES = {
    OWNER: 'owner',
    ADMIN: 'admin',
    PROJECT_MANAGER: 'project_manager',
    SITE_MANAGER: 'site_manager',
    SALES_REP: 'sales_rep',
    FINANCE_OFFICER: 'finance_officer',
    ENGINEER: 'engineer',
    FINANCIAL_AUDITOR: 'financial_auditor',
    READ_ONLY_OBSERVER: 'read_only_observer',
    CLIENT: 'cliente' // Legacy string support
} as const;

/**
 * Validar Segregación de Funciones (SoD)
 * @param action Acción a realizar
 * @param userRole Rol del usuario
 * @returns true si NO hay conflicto
 */
export function checkSoD(action: string, userRole: string): boolean {
    // Regla 1: PM no puede auditar ni reconciliar finanzas
    if (userRole === ROLES.PROJECT_MANAGER) {
        if (action === PERMISSIONS.FINANCE_RECONCILE || action === PERMISSIONS.FINANCE_AUDIT_LOGS) {
            return false;
        }
    }

    // Regla 2: Ventas no puede aprobar ingeniería
    if (userRole === ROLES.SALES_REP && action === PERMISSIONS.ENGINEERING_REVIEW) {
        return false;
    }

    return true;
}

/**
 * Server-side permission check.
 * Usage: await checkPermission(PERMISSIONS.USERS_VIEW)
 */
export async function checkPermission(permission: Permission): Promise<boolean> {
    const session = await auth();
    const user = session?.user;

    if (!user?.permissions) {
        return false;
    }

    // 1. Verificar si tiene el permiso asignado (RBAC)
    const hasPermission = user.permissions.includes(permission);
    if (!hasPermission) return false;

    // 2. Aplicar Segregación de Funciones (SoD)
    // El rol viene en session.user.role (asegurado por auth config)
    const role = user.role || 'employee';
    if (!checkSoD(permission, role)) {
        console.warn(`[SoD] Blocked action ${permission} for role ${role}`);
        return false;
    }

    return true;
}

/**
 * Enforce permission on a Server Component or Server Action.
 * Redirects or throws error if failed.
 */
export async function enforcePermission(permission: Permission, redirectTo: string = '/dashboard') {
    const hasAccess = await checkPermission(permission);
    if (!hasAccess) {
        redirect(redirectTo);
    }
}
