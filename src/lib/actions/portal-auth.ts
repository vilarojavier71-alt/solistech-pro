'use server'


// We should use prisma or a proper server-side query.
// The legacy code used 'sales' table to authenticate clients.
// "Client Login" seems to be "Check status of my repair/sale".
// It uses `sales` table: dni + access_code.

import { prisma } from '@/lib/db'

export async function loginClientAction(dni: string, accessCode: string) {
    try {
        const sale = await prisma.sale.findFirst({
            where: {
                dni: dni.toUpperCase(),
                access_code: accessCode.toUpperCase()
            },
            select: {
                id: true,
                dni: true
            }
        })

        if (!sale) {
            return { success: false, error: 'DNI o código de acceso incorrecto' }
        }

        return { success: true, data: sale }
    } catch (error) {
        console.error('Error in loginClientAction:', error)
        return { success: false, error: 'Error al iniciar sesión' }
    }
}
