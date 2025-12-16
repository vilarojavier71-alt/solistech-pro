'use server'

import { prisma } from '@/lib/db'
import { Sale, ClientNotification } from '@/types/portal'

export async function getPortalDashboardData(saleId: string, dni: string) {
    try {
        if (!saleId || !dni) {
            return { success: false, error: 'Datos de sesión inválidos' }
        }

        // Fetch sale
        const sale = await prisma.sales.findFirst({
            where: {
                id: saleId,
                dni: dni // Security check: ensure DNI matches
            }
        })

        if (!sale) {
            return { success: false, error: 'Expediente no encontrado' }
        }

        // Fetch notifications
        const notifications = await prisma.client_notifications.findMany({
            where: { sale_id: saleId },
            orderBy: { created_at: 'desc' },
            take: 5
        })

        // Cast to expected types (Prisma types should match mostly, but explicit casting or mapping might be safe)
        // For now, assuming direct match or loose compatibility
        return {
            success: true,
            data: {
                sale: sale as unknown as Sale,
                notifications: notifications as unknown as ClientNotification[]
            }
        }

    } catch (error) {
        console.error('Error fetching portal dashboard data:', error)
        return { success: false, error: 'Error al cargar los datos del portal' }
    }
}
