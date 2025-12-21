'use server'

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

export type RoleUpdateResult = {
    success: boolean;
    message: string;
}

/**
 * Fetches all users belonging to the current user's organization.
 */
export async function getOrganizationUsers() {
    const session = await auth()

    if (!session?.user) return []

    // Get current user's org
    const currentUserProfile = await prisma.users.findUnique({
        where: { id: session.user.id },
        select: { organization_id: true }
    })

    if (!currentUserProfile?.organization_id) return []

    // Fetch users in that org
    const users = await prisma.users.findMany({
        where: { organization_id: currentUserProfile.organization_id },
        select: {
            id: true,
            email: true,
            full_name: true,
            role: true,
            avatar_url: true,
            created_at: true
        },
        orderBy: { full_name: 'asc' }
    })

    return users
}

/**
 * Updates the role of a target user.
 * Restricted to 'admin' or 'owner'.
 */
export async function updateUserRole(targetUserId: string, newRole: string): Promise<RoleUpdateResult> {
    const session = await auth()

    if (!session?.user) return { success: false, message: "No autorizado." }

    try {
        // 2. Permission Check: requester must be admin/owner
        const requesterProfile = await prisma.users.findUnique({
            where: { id: session.user.id },
            select: { role: true, organization_id: true }
        })

        if (!requesterProfile || (requesterProfile.role !== 'admin' && requesterProfile.role !== 'owner')) {
            return { success: false, message: "No tienes permisos de administrador." }
        }

        // 3. Safety Check: Target user must be in same org
        const targetProfile = await prisma.users.findUnique({
            where: { id: targetUserId },
            select: { organization_id: true, role: true }
        })

        if (!targetProfile) {
            return { success: false, message: "Usuario no encontrado." }
        }

        if (targetProfile.organization_id !== requesterProfile.organization_id) {
            return { success: false, message: "El usuario no pertenece a tu organización." }
        }

        // [SECURITY CRITICAL] Prevent changing the role of an Owner
        if (targetProfile.role === 'owner') {
            return { success: false, message: "Operación no permitida: El rol del propietario es inmutable." }
        }

        // 4. Update Role
        await prisma.users.update({
            where: { id: targetUserId },
            data: { role: newRole }
        })

        revalidatePath('/dashboard/admin/users')
        revalidatePath('/dashboard/team')

        return { success: true, message: "Rol actualizado correctamente." }

    } catch (error: any) {
        console.error("Error updating role:", error)
        return { success: false, message: error.message || "Error al actualizar el rol." }
    }
}

/**
 * Creates dummy users for UI testing.
 * NOTE: These users will NOT have auth accounts and cannot log in.
 */
export async function seedTestUsers() {
    const session = await auth()

    if (!session?.user) return { success: false, message: "No autorizado" }

    const requester = await prisma.users.findUnique({
        where: { id: session.user.id },
        select: { role: true, organization_id: true }
    })

    if (!requester || (requester.role !== 'admin' && requester.role !== 'owner')) {
        return { success: false, message: "Requiere rol Admin" }
    }

    const orgId = requester.organization_id
    if (!orgId) return { success: false, message: "Sin organización" }

    const dummyUsers = [
        {
            email: 'admin.test@solistech.pro',
            full_name: 'Admin Test User',
            role: 'admin',
            organization_id: orgId,
            avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
        },
        {
            email: 'tecnico.test@solistech.pro',
            full_name: 'Técnico Test User',
            role: 'technician',
            organization_id: orgId,
            avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tech'
        },
        {
            email: 'ingeniero.test@solistech.pro',
            full_name: 'Ingeniero Test User',
            role: 'engineer',
            organization_id: orgId,
            avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=eng'
        },
        {
            email: 'pica.test@solistech.pro',
            full_name: 'Pica (Ventas) Test',
            role: 'commercial',
            organization_id: orgId,
            avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sales'
        }
    ]

    try {
        await prisma.users.createMany({
            data: dummyUsers,
            skipDuplicates: true
        })

        revalidatePath('/dashboard/admin/users')
        return { success: true, message: "Usuarios de prueba creados (Solo UI, no login)" }
    } catch (e: any) {
        return { success: false, message: e.message }
    }
}

