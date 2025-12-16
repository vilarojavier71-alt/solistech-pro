import { auth } from "./auth"

/**
 * Get the current authenticated user session
 * Use this in Server Components and Server Actions
 */
export async function getCurrentUser() {
    const session = await auth()
    return session?.user ?? null
}

/**
 * Get the current user with extended properties
 */
export async function getCurrentUserWithRole() {
    const session = await auth()
    if (!session?.user) return null

    return {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: (session.user as any).role as string | null,
        organizationId: (session.user as any).organizationId as string | null,
    }
}

/**
 * Check if the current user has a specific role
 */
export async function hasRole(requiredRole: string | string[]) {
    const user = await getCurrentUserWithRole()
    if (!user?.role) return false

    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    return roles.includes(user.role)
}

/**
 * Check if the current user is an admin or owner
 */
export async function isAdmin() {
    return hasRole(["admin", "owner"])
}
