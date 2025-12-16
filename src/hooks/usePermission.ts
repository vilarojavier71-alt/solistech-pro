'use client'

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useEffect, useState } from "react"

type AppRole = 'owner' | 'admin' | 'user' | 'pica' | 'installer' | 'sales' | 'engineer' | 'commercial'

export type Permission =
    | 'view_financials'
    | 'view_projects_financials'
    | 'manage_team'
    | 'assign_leads'
    | 'edit_settings'

// Matrix Definition (Source of Truth for Frontend)
const PERMISSION_MATRIX: Record<AppRole, Permission[]> = {
    owner: ['view_financials', 'view_projects_financials', 'manage_team', 'assign_leads', 'edit_settings'],
    admin: ['view_financials', 'view_projects_financials', 'manage_team', 'assign_leads', 'edit_settings'],
    sales: ['view_financials', 'view_projects_financials', 'assign_leads'],
    commercial: ['view_financials', 'view_projects_financials', 'assign_leads'],
    engineer: ['view_projects_financials'], // Only technical costs maybe? No, requested "Blind Installer". Engineer typically sees money.
    installer: [], // BLIND
    pica: [], // BLIND (Only own commissions maybe, but not project financials)
    user: []
}

/**
 * Hook to check if current user has specific granular permission
 */
export function usePermission(permission: Permission) {
    const [hasPermission, setHasPermission] = useState(false)
    const [loading, setLoading] = useState(true)
    const [role, setRole] = useState<AppRole | 'user'>('user')

    useEffect(() => {
        async function check() {
            try {
                const { role: userRole } = await getUserRoleAction()

                if (!userRole) {
                    setHasPermission(false)
                    setLoading(false)
                    return
                }

                setRole(userRole as AppRole)

                // Matrix Check
                const rolePermissions = PERMISSION_MATRIX[userRole as AppRole] || []
                setHasPermission(rolePermissions.includes(permission))

            } catch (e) {
                setHasPermission(false)
                console.error("Permission check error", e)
            } finally {
                setLoading(false)
            }
        }
        check()
    }, [permission])

    return { hasPermission, loading, role }
}
