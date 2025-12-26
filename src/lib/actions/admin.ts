'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

// Código GODMODE para activar plan PRO ilimitado
const GODMODE_CODES: Record<string, { plan: string; godMode: boolean; maxEmployees: number }> = {
    'GOZANDO': { plan: 'pro', godMode: true, maxEmployees: 999 },
    'SOLISPRO2024': { plan: 'pro', godMode: false, maxEmployees: 50 },
    'BETAUSER': { plan: 'starter', godMode: false, maxEmployees: 10 },
}

export async function applyPromoCode(code: string) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: 'No autenticado' }
    }

    // Normalizar código (mayúsculas, sin espacios)
    const normalizedCode = code.trim().toUpperCase()

    // Verificar si es un código válido
    const codeConfig = GODMODE_CODES[normalizedCode]
    if (!codeConfig) {
        return { error: 'Código promocional inválido' }
    }

    try {
        // Obtener usuario con su organización
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { organization: true }
        })

        if (!user?.organization_id) {
            return { error: 'No tienes una organización asociada' }
        }

        // Ya tiene GODMODE?
        if (user.organization?.is_god_mode && codeConfig.godMode) {
            return { error: 'Tu organización ya tiene GODMODE activado 🚀' }
        }

        // Aplicar el código
        await prisma.organization.update({
            where: { id: user.organization_id },
            data: {
                subscription_plan: codeConfig.plan,
                subscription_status: 'active',
                is_god_mode: codeConfig.godMode,
                max_employees: codeConfig.maxEmployees,
                updated_at: new Date()
            }
        })

        revalidatePath('/dashboard')
        revalidatePath('/dashboard/settings')
        revalidatePath('/dashboard/settings/billing')

        if (codeConfig.godMode) {
            return {
                success: true,
                message: '🎮 GODMODE ACTIVADO 🚀 Tienes acceso PRO ilimitado!'
            }
        }

        return {
            success: true,
            message: `Plan ${codeConfig.plan.toUpperCase()} activado correctamente`
        }
    } catch (error) {
        console.error('Error applying promo code:', error)
        return { error: 'Error al aplicar el código promocional' }
    }
}
