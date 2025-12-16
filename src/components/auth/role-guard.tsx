'use client'

import { ReactNode } from 'react'
import { useUserRole } from '@/hooks/use-user-role'
import { UserRole } from '@/lib/auth/roles'

interface RoleGuardProps {
    children: ReactNode
    allowedRoles: UserRole[]
    fallback?: ReactNode
}

export function RoleGuard({ children, allowedRoles, fallback = null }: RoleGuardProps) {
    const { role, loading } = useUserRole()

    if (loading) return null // Or a skeleton if strict layout isn't required

    if (!role || !allowedRoles.includes(role)) {
        return <>{fallback}</>
    }

    return <>{children}</>
}
