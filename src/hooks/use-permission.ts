"use client"

import { useSession } from "next-auth/react"
import type { Permission } from "@/lib/rbac"

export function usePermission() {
    const { data: session } = useSession()

    const hasPermission = (permission: Permission) => {
        if (!session?.user) return false

        // Owner/Admin bypassing logic (Optional: keep strictly permission based?)
        // The user prompt asked to map every role to permissions strictly. 
        // But traditionally admins have all access. 
        // Our 'role_permissions' table GIVES all permissions to admin/owner.
        // So strict check on permissions array is enough.

        const userPermissions = (session.user as any).permissions || []
        return userPermissions.includes(permission)
    }

    const hasRole = (role: string) => {
        return (session?.user as any)?.role === role
    }

    return { hasPermission, hasRole, user: session?.user, isLoading: !session }
}
