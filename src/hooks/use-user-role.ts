'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { UserRole } from '@/lib/auth/roles'

/**
 * Client-side hook to get user role from NextAuth session
 */
export function useUserRole() {
    const { data: session, status } = useSession()
    const [role, setRole] = useState<UserRole | null>(null)
    const loading = status === 'loading'

    useEffect(() => {
        if (session?.user?.role) {
            setRole(session.user.role as UserRole)
        }
    }, [session])

    return {
        role,
        loading,
        isAdmin: role === 'admin' || role === 'owner'
    }
}
