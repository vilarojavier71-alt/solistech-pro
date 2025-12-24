'use server'

import { prisma } from '@/lib/db'
import { getCurrentUserWithRole } from '@/lib/session'
import { revalidatePath } from 'next/cache'

export async function assignClientToProject(projectId: string, clientEmail: string) {
    const user = await getCurrentUserWithRole()

    // Auth Check
    if (!user || !['owner', 'admin', 'employee'].includes(user.role || '')) {
        return { error: 'No autorizado' }
    }

    try {
        // 1. Find User by Email
        const clientUser = await prisma.user.findUnique({
            where: { email: clientEmail }
        })

        if (!clientUser) {
            return { error: 'Usuario no encontrado. Asegúrate de que se haya registrado primero.' }
        }

        // 2. Assign Project
        await prisma.project.update({
            where: { id: projectId },
            data: {
                portal_user_id: clientUser.id
            }
        })

        revalidatePath(`/dashboard/projects/${projectId}`)
        return { success: true }

    } catch (error: any) {
        // Handle unique constraint violation (User already assigned to another project)
        if (error.code === 'P2002') {
            return { error: 'Este usuario ya está asignado a otro proyecto active.' }
        }
        console.error('[AssignClient]', error)
        return { error: 'Error asignando cliente' }
    }
}

