'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { AdvancedUserSchema } from '@/lib/schemas/user-management'
import type { AdvancedUserFormValues } from '@/lib/schemas/user-management'

/**
 * STUB: Advanced user management requires user_roles, user_certifications tables
 * that don't exist in current Prisma schema. Using simplified implementation.
 */
export async function createAdvancedTeamMember(data: AdvancedUserFormValues) {
    // Validation
    const result = AdvancedUserSchema.safeParse(data)
    if (!result.success) {
        return { success: false, error: "Datos inválidos", details: result.error.flatten() }
    }

    const { step1, step2 } = result.data
    const session = await auth()

    if (!session?.user) {
        return { success: false, error: "No autenticado" }
    }

    try {
        // Get caller's org and God Mode status
        const caller = await prisma.User.findUnique({
            where: { id: session.user.id },
            select: {
                organization_id: true,
                role: true,
                organization: {
                    select: { is_god_mode: true }
                }
            } as any
        }) as any

        const isGodMode = caller?.organization?.is_god_mode || false
        const hasRole = caller?.role === 'admin' || caller?.role === 'owner'

        if (!caller || (!hasRole && !isGodMode)) {
            return { success: false, error: "No autorizado. Se requiere rol Admin o God Mode." }
        }

        if (!caller.organization_id) {
            return { success: false, error: "Sin organización asignada" }
        }

        // ========================================================
        // CHECK EMPLOYEE LIMIT
        // ========================================================
        const { checkEmployeeLimit } = await import('@/lib/actions/subscriptions')
        const limitCheck = await checkEmployeeLimit(caller.organization_id)

        if (!limitCheck.canAdd) {
            return {
                success: false,
                error: `Límite de empleados alcanzado (${limitCheck.maxAllowed}). Actualiza tu plan.`,
                details: { requiresUpgrade: true }
            }
        }
        // ========================================================

        // Create user with simplified fields (advanced fields like certifications not supported)
        const tempPassword = Math.random().toString(36).slice(-10) + 'Aa1!'

        // NOTE: We are ignoring jobTitle and workZoneId as they are not in the schema yet
        // TODO: Add these fields to prisma schema later
        const newUser = await prisma.User.create({
            data: {
                email: step1.email,
                full_name: step1.fullName,
                organization_id: caller.organization_id,
                role: step2?.roleId || 'employee',
                department: step2?.department || null,
                // Assuming email verified so they can login immediately with temp password if we implemented pwd login
                // But typically auth is magic link or similar. For now we just create the record.
                email_verified: true,
            }
        })

        revalidatePath('/dashboard/settings/team')

        return {
            success: true,
            data: {
                email: step1.email,
                tempPassword
            }
        }

    } catch (error: any) {
        console.error("Advanced Create Error:", error)
        return { success: false, error: error.message || "Error del servidor" }
    }
}
