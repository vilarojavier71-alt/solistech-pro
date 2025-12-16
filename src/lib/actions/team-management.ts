'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { checkEmployeeLimit } from './subscriptions'

// Schema for team member creation
const CreateMemberSchema = z.object({
    email: z.string().email('Email inválido'),
    fullName: z.string().min(3, 'Nombre muy corto'),
    roleId: z.string(),
    organizationId: z.string().uuid()
})

type ActionState = {
    success?: boolean
    error?: string
    requiresUpgrade?: boolean
    data?: {
        email: string
        password?: string
    }
}

/**
 * STUB: Advanced team management requires roles/user_roles tables not in current schema.
 * Using simplified implementation with users.role field.
 */
export async function createTeamMember(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
    const session = await auth()
    if (!session?.user) return { error: 'No autenticado' }

    try {
        // Check caller is admin
        const caller = await prisma.users.findUnique({
            where: { id: session.user.id },
            select: { role: true, organization_id: true }
        })

        if (!caller) return { error: 'Usuario no encontrado' }

        // Check for God Mode
        const organization = await prisma.organizations.findUnique({
            where: { id: caller.organization_id || undefined },
            select: { is_god_mode: true }
        })

        const isGodMode = organization?.is_god_mode

        if (!isGodMode && (caller.role !== 'admin' && caller.role !== 'owner')) {
            return { error: 'No tienes permisos para gestionar usuarios' }
        }

        const rawData = {
            email: formData.get('email') as string,
            fullName: formData.get('fullName') as string,
            roleId: formData.get('roleId') as string,
            organizationId: (formData.get('organizationId') as string) || caller.organization_id
        }

        const validated = CreateMemberSchema.safeParse(rawData)
        if (!validated.success) {
            return { error: validated.error.errors[0].message }
        }

        // ========================================================
        // CHECK EMPLOYEE LIMIT (SUBSCRIPTION)
        // ========================================================
        const limitCheck = await checkEmployeeLimit(caller.organization_id || undefined)

        if (!limitCheck.canAdd) {
            if (limitCheck.plan === 'basic') {
                return {
                    error: 'Tu plan básico no incluye empleados. Actualiza a Pro para añadir miembros al equipo.',
                    requiresUpgrade: true
                }
            }
            return {
                error: `Has alcanzado el límite de ${limitCheck.maxAllowed} empleados. Actualiza tu plan para añadir más.`,
                requiresUpgrade: true
            }
        }
        // ========================================================
        const input = validated.data

        // Create user in database (simplified - no auth)
        const tempPassword = Math.random().toString(36).slice(-8) + 'Aa1!'

        await prisma.users.create({
            data: {
                email: input.email,
                full_name: input.fullName,
                role: input.roleId || 'employee',
                organization_id: input.organizationId
            }
        })

        revalidatePath('/dashboard/settings/team')

        return {
            success: true,
            data: {
                email: input.email,
                password: tempPassword // Note: User needs to reset password
            }
        }

    } catch (e: unknown) {
        console.error('CreateMember Error:', e)
        return { error: (e as Error).message || 'Error desconocido' }
    }
}

/**
 * STUB: Returns hardcoded roles since roles table doesn't exist
 */
export async function getOrganizationRoles(organizationId: string) {
    // Return standard roles since we're using simple role strings
    return [
        { id: 'admin', name: 'Administrador', description: 'Acceso completo' },
        { id: 'commercial', name: 'Comercial', description: 'Ventas y captación' },
        { id: 'technician', name: 'Técnico', description: 'Instalaciones' },
        { id: 'engineer', name: 'Ingeniero', description: 'Proyectos técnicos' },
        { id: 'employee', name: 'Empleado', description: 'Acceso básico' }
    ]
}

export async function getOrganizationMembers(organizationId: string) {
    const session = await auth()
    if (!session?.user) return []

    try {
        const members = await prisma.users.findMany({
            where: { organization_id: organizationId },
            select: {
                id: true,
                full_name: true,
                email: true,
                role: true
            }
        })

        return members
            .filter(user => user && user.id)
            .map(user => ({
                id: user.id,
                name: user.full_name || 'Desconocido',
                email: user.email,
                roleName: formatRoleName(user.role),
                roleId: user.role,
                lastActive: null
            }))
    } catch (e) {
        console.error('Error in getOrganizationMembers:', e)
        return []
    }
}

function formatRoleName(role: string | null): string {
    if (!role) return 'Usuario'
    const map: Record<string, string> = {
        'admin': 'Administrador',
        'owner': 'Propietario',
        'pica': 'Captador',
        'installer': 'Instalador',
        'sales': 'Comercial',
        'engineer': 'Ingeniero',
        'commercial': 'Comercial',
        'technician': 'Técnico',
        'employee': 'Empleado'
    }
    return map[role] || role.charAt(0).toUpperCase() + role.slice(1)
}

/**
 * STUB: initializeRoles not available without roles table
 */
export async function initializeRoles(organizationId: string) {
    // Roles are using simple string enum in users.role field
    return { success: true, message: 'Roles predeterminados disponibles' }
}
