'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function applyPromoCode(code: string) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: 'No autenticado' }
    }

    // Normalize input
    const normalizedCode = code.trim().toUpperCase()

    // Debug log to trace issues
    console.log(`[GodMode] Attempt with code: '${code}' -> Normalized: '${normalizedCode}'`)

    if (normalizedCode !== 'GOZANDO') {
        return { error: 'Código inválido' }
    }

    try {
        await prisma.User.update({
            where: { id: session.user.id },
            data: { is_test_admin: true }
        })

        // Also update organization to unlimited if exists
        const user = await prisma.User.findUnique({
            where: { id: session.user.id },
            select: { organization_id: true }
        })

        let orgId = user?.organization_id

        console.log(`[GodMode] User ${session.user.id} OrgID: ${orgId}`)

        if (!orgId) {
            console.log(`[GodMode] User has no organization. Creating default organization...`)
            // Auto-heal: Create organization for the user
            const newOrg = await prisma.organizations.create({
                data: {
                    name: `Organización de ${session.user.name || 'Usuario'}`, // Fallback name
                    email: session.user.email || undefined,
                    subscription_plan: 'basic', // Will be upgraded immediately
                    subscription_status: 'active'
                }
            })

            // Link user to new org
            await prisma.User.update({
                where: { id: session.user.id },
                data: {
                    organization_id: newOrg.id,
                    role: 'owner' // Make them owner
                }
            })

            orgId = newOrg.id
            console.log(`[GodMode] Created and linked new OrgID: ${orgId}`)
        }

        if (orgId) {
            // Using raw SQL to bypass Prisma Client sync issues
            const result = await prisma.$executeRaw`
                UPDATE organizations 
                SET 
                    is_god_mode = true,
                    subscription_plan = 'pro',
                    max_employees = -1,
                    subscription_status = 'active',
                    subscription_ends_at = ${new Date('2099-12-31')}::timestamp,
                    updated_at = NOW()
                WHERE id = ${orgId}::uuid
            `
            console.log(`[GodMode] Rows updated: ${result}`)
        } else {
            console.error(`[GodMode] Failed to resolve or create organization for user ${session.user.id}`)
            return { error: 'Error crítico: No se pudo crear la organización.' }
        }

        revalidatePath('/', 'layout')
        return { success: true, message: '¡Código GOZANDO aplicado! Organización creada y Plan Fundador activado.' }
    } catch (error) {
        console.error('Error applying promo code:', error)
        return { error: 'Error interno al aplicar código' }
    }
}
