'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

const GOD_MODE_CODE = 'GOZANDO'

export async function activateGodMode(email: string, code: string) {
    try {
        const normalizedCode = code.trim().toUpperCase()

        if (normalizedCode !== GOD_MODE_CODE) {
            return { success: false, error: 'Código inválido.' }
        }

        // Find user by email
        const user = await prisma.User.findUnique({
            where: { email },
            include: { organization: true }
        })

        if (!user) {
            return { success: false, error: 'Usuario no encontrado.' }
        }

        if (!user.organization_id) {
            return { success: false, error: 'El usuario no pertenece a una organización.' }
        }

        // Activate God Mode using raw SQL
        await prisma.$executeRaw`
            UPDATE organizations 
            SET 
                is_god_mode = true,
                subscription_plan = 'pro',
                subscription_status = 'active',
                subscription_ends_at = ${new Date('2099-12-31')}::timestamp,
                updated_at = NOW()
            WHERE id = ${user.organization_id}::uuid
        `

        revalidatePath('/dashboard')
        return { success: true, message: 'MODO DIOS ACTIVADO: Disfruta del poder ilimitado.' }

    } catch (error) {
        console.error('Error activating God Mode:', error)
        return { success: false, error: 'Error interno del servidor.' }
    }
}
