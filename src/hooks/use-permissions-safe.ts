/**
 * Hook seguro para permisos - Permission Masking
 * 
 * NUNCA expone roles internos, solo booleanos de permisos
 * Usa Server Actions para obtener permisos del servidor
 */

'use client'

import { useEffect, useState } from 'react'
import { getUserPermissions, type Permission } from '@/lib/actions/permissions'

interface UsePermissionsResult {
    permissions: Record<Permission, boolean>
    hasPermission: (permission: Permission) => boolean
    isLoading: boolean
    error: Error | null
}

/**
 * Hook que obtiene permisos del servidor (solo booleanos)
 * ✅ SEGURO: No expone roles internos
 */
export function usePermissionsSafe(): UsePermissionsResult {
    const [permissions, setPermissions] = useState<Record<Permission, boolean>>({
        view_financials: false,
        view_projects_financials: false,
        manage_team: false,
        assign_leads: false,
        edit_settings: false,
        process_payments: false,
        create_invoices: false,
        manage_users: false,
    })
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
        let mounted = true

        async function fetchPermissions() {
            try {
                setIsLoading(true)
                setError(null)
                
                const userPermissions = await getUserPermissions()
                
                if (mounted) {
                    setPermissions(userPermissions)
                }
            } catch (err) {
                if (mounted) {
                    setError(err instanceof Error ? err : new Error('Failed to fetch permissions'))
                }
            } finally {
                if (mounted) {
                    setIsLoading(false)
                }
            }
        }

        fetchPermissions()

        return () => {
            mounted = false
        }
    }, [])

    const hasPermission = (permission: Permission): boolean => {
        return permissions[permission] || false
    }

    return { permissions, hasPermission, isLoading, error }
}

/**
 * Hook para verificar un permiso específico
 */
export function usePermission(permission: Permission) {
    const { hasPermission, isLoading } = usePermissionsSafe()
    
    return {
        hasPermission: hasPermission(permission),
        isLoading
    }
}


