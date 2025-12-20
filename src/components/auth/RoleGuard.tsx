'use client'

import { useUser } from "@/lib/auth/useUser" // We assume this exists or use Supabase Auth hook
import { ReactNode } from "react"
import { useEffect, useState } from "react"
import { AppRole } from '@/types/auth'
import { getUserRoleAction } from '@/lib/actions/auth-actions'

interface RoleGuardProps {
    children: ReactNode
    allowedRoles: AppRole[]
    fallback?: ReactNode
}

/**
 * Frontend Component to conditionally render content based on User Role.
 * WARNING: Visual security only. Always enforce RLS on backend.
 */
export function RoleGuard({ children, allowedRoles, fallback = null }: RoleGuardProps) {
    const [role, setRole] = useState<AppRole | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function getUser() {
            try {
                const { role: userRole } = await getUserRoleAction()
                if (userRole) {
                    setRole(userRole as AppRole)
                }
            } catch (e) {
                console.error("RoleGuard error", e)
            } finally {
                setLoading(false)
            }
        }
        getUser()
    }, [])

    if (loading) return null // or a skeleton

    if (!role) return <>{fallback}</>

    // God modes
    if (role === 'owner' || role === 'admin') return <>{children}</>

    if (allowedRoles.includes(role)) {
        return <>{children}</>
    }

    return <>{fallback}</>
}
