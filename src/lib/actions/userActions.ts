'use server'

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

export type RoleUpdateResult = {
    success: boolean
    message: string
}

/**
 * Updates the role of a target user.
 * Restricted to 'admin', 'owner', or 'cto'.
 */
export async function updateUserRole(targetUserId: string, newRole: string): Promise<RoleUpdateResult> {
    const session = await auth()

    if (!session?.user) return { success: false, message: "Acceso Denegado: Usuario no autenticado." }

    try {
        // Permission Check: Requester must be admin, owner, or cto
        const requesterProfile = await prisma.User.findUnique({
            where: { id: session.user.id },
            select: { role: true, organization_id: true }
        })

        const allowedRoles = ['admin', 'owner', 'cto']

        if (!requesterProfile || !allowedRoles.includes(requesterProfile.role || '')) {
            return { success: false, message: "Acceso Denegado: Se requiere rol de Administrador o CTO." }
        }

        // Input Validation
        const validRoles = ['admin', 'technician', 'engineer', 'sales', 'viewer', 'commercial', 'installer', 'canvasser', 'user', 'employee']
        if (!newRole || !validRoles.includes(newRole)) {
            return { success: false, message: "Rol inválido." }
        }
        if (!targetUserId) {
            return { success: false, message: "ID de usuario inválido." }
        }

        // Safety Check: Target user must be in same org
        const targetProfile = await prisma.User.findUnique({
            where: { id: targetUserId },
            select: { organization_id: true }
        })

        if (!targetProfile) {
            return { success: false, message: "Usuario objetivo no encontrado." }
        }

        if (targetProfile.organization_id !== requesterProfile.organization_id) {
            return { success: false, message: "El usuario no pertenece a tu organización." }
        }

        // Execution - Update role
        await prisma.User.update({
            where: { id: targetUserId },
            data: { role: newRole }
        })

        // Response & Revalidation
        revalidatePath('/dashboard/admin/users')
        revalidatePath('/dashboard/team')

        return { success: true, message: "Rol actualizado correctamente." }

    } catch (error: any) {
        console.error("Error updating role:", error)
        return { success: false, message: error.message || "Error interno al actualizar el rol." }
    }
}

