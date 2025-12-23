'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

// ✅ SEGURO: Backdoor eliminado - Sistema desactivado hasta implementación segura
export async function activateGodMode(email: string, code: string) {
    // Backdoor hardcodeado eliminado por seguridad
    // TODO: Implementar sistema de códigos promocionales seguro con tabla promo_codes
    // y validación de permisos de administrador del sistema
    return { success: false, error: 'Sistema de códigos promocionales en mantenimiento' }
}
