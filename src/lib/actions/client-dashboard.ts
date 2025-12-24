'use server'

import { prisma } from '@/lib/db'
import { getCurrentUserWithRole } from '@/lib/session'

export async function getClientDashboardData() {
    const user = await getCurrentUserWithRole()

    if (!user || !user.id) {
        return { error: 'No autenticado', redirect: '/auth/login' }
    }

    // SECURITY CHECK: ROLE ENFORCEMENT
    // This function is specifically for the 'CLIENT' role perspective
    if (user.role !== 'client') {
        // If an employee accesses this, maybe we redirect them to the main dashboard?
        // But for "Client Portal" logic, this is fine.
        return { error: 'Rol incorrecto', redirect: '/dashboard' }
    }

    try {
        // ISOLATION QUERY: Find ONLY the project assigned to this user
        // This is the "Data Isolation" guarantee
        const project = await prisma.project.findUnique({
            where: {
                portal_user_id: user.id
            },
            include: {
                organization: {
                    select: {
                        name: true,
                        logo_url: true,
                        phone: true,
                        email: true
                    }
                },
                documents: true,
                phase_history: {
                    orderBy: { created_at: 'desc' },
                    take: 5
                }
            }
        })

        if (!project) {
            return {
                warning: 'No tienes ningún proyecto asignado.',
                project: null
            }
        }

        return { success: true, project }

    } catch (error: any) {
        console.error('[ClientDashboard]', error)
        return { error: 'Error recuperando datos del proyecto' }
    }
}
