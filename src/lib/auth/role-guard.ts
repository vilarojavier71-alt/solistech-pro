import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"

export type AppRole = 'owner' | 'admin' | 'user' | 'pica' | 'installer' | 'sales' | 'engineer' | 'commercial'

export interface RoleGuardOptions {
    allowedRoles: AppRole[]
    redirectTo?: string
    checkOwner?: boolean
}

/**
 * Server-side Role Verification Utility
 * Migrated to NextAuth + Prisma
 */
export async function verifyRole(allowedRoles: AppRole[]): Promise<{ authorized: boolean; role: AppRole | null; userId: string | null }> {
    try {
        const session = await auth()

        if (!session?.user) {
            return { authorized: false, role: null, userId: null }
        }

        const userData = await prisma.users.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        })

        if (!userData || !userData.role) {
            return { authorized: false, role: null, userId: session.user.id }
        }

        const userRole = userData.role as AppRole

        // Owners and admins are always authorized
        if (userRole === 'owner' || userRole === 'admin') {
            return { authorized: true, role: userRole, userId: session.user.id }
        }

        const isAuthorized = allowedRoles.includes(userRole)

        return { authorized: isAuthorized, role: userRole, userId: session.user.id }

    } catch (error) {
        console.error("Role verification error:", error)
        return { authorized: false, role: null, userId: null }
    }
}

/**
 * Enforce Role or Throw
 */
export async function requireRole(allowedRoles: AppRole[]): Promise<void> {
    const { authorized, role } = await verifyRole(allowedRoles)
    if (!authorized) {
        throw new Error(`Unauthorized. Required roles: ${allowedRoles.join(', ')}. Current role: ${role || 'none'}`)
    }
}

/**
 * Enforce Role or Redirect
 */
export async function protectPage(allowedRoles: AppRole[], redirectUrl: string = '/dashboard') {
    const { authorized } = await verifyRole(allowedRoles)
    if (!authorized) {
        redirect(redirectUrl)
    }
}
