'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

// ✅ SEGURO: Backdoor eliminado - Sistema desactivado hasta implementación segura
export async function applyPromoCode(code: string) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: 'No autenticado' }
    }

    // Backdoor hardcodeado eliminado por seguridad
    // TODO: Implementar sistema de códigos promocionales seguro con tabla promo_codes
    return { error: 'Sistema de códigos promocionales en mantenimiento' }
}
