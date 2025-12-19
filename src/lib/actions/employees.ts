'use server'

import { prisma } from '@/lib/db'
import { getCurrentUserWithRole, isAdmin } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const CreateEmployeeSchema = z.object({
    full_name: z.string().min(2, 'El nombre es requerido'),
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'La contraseña debe tener mínimo 8 caracteres'),
    role: z.enum(['user', 'ingeniero', 'comercial', 'captador_visitas', 'admin', 'employee']).optional(), // Removed explicit required, added 'employee'
})

type CreateEmployeeInput = z.infer<typeof CreateEmployeeSchema>

export async function createEmployee(input: unknown) {
    try {
        const result = CreateEmployeeSchema.safeParse(input)

        if (!result.success) {
            const formattedErrors = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
            return { success: false, error: `Error de validación: ${formattedErrors}` }
        }

        const validated = result.data
        const user = await getCurrentUserWithRole()

        if (!user) {
            return { success: false, error: 'No autenticado.' }
        }

        // 1. RE-HYDRATION: If session lacks organizationId, try fetching fresh from DB
        let orgId = user.organizationId

        if (!orgId) {
            const dbUser = await prisma.User.findUnique({
                where: { id: user.id },
                select: { organization_id: true }
            })
            if (dbUser?.organization_id) {
                orgId = dbUser.organization_id
            } else {
                return { success: false, error: 'Tu cuenta no está vinculada a ninguna organización.' }
            }
        }

        // 2. CHECK PERMISSIONS (GOD MODE AWARE)
        // Using raw SQL to bypass Prisma Schema limitations if 'is_god_mode' is missing in schema.prisma types
        const orgs: any[] = await prisma.$queryRaw`
            SELECT is_god_mode FROM organizations WHERE id = ${orgId}::uuid LIMIT 1
        `
        const isGodMode = orgs[0]?.is_god_mode || false
        const isAdminUser = await isAdmin()

        // Allow if Admin OR God Mode
        if (!isAdminUser && !isGodMode) {
            return { success: false, error: 'No tienes permisos para crear empleados.' }
        }

        // Check if email exists
        const existingUser = await prisma.User.findUnique({
            where: { email: validated.email }
        })

        if (existingUser) {
            return { success: false, error: 'Ya existe un usuario con ese email.' }
        }

        // Hash password
        const passwordHash = await bcrypt.hash(validated.password, 12)

        // Create user
        const newEmployee = await prisma.User.create({
            data: {
                email: validated.email,
                password_hash: passwordHash,
                full_name: validated.full_name,
                role: validated.role || 'employee',
                organization_id: orgId,
                email_verified: true
            }
        })

        revalidatePath('/dashboard/admin/users')
        revalidatePath('/dashboard')

        return { success: true, data: newEmployee, error: null }

    } catch (error) {
        console.error('Unexpected error in createEmployee:', error)
        return { success: false, error: 'Error inesperado durante la creación del empleado.' }
    }
}

export async function getEmployees() {
    const user = await getCurrentUserWithRole()
    if (!user) return { data: null, error: 'No autenticado' }

    const isAdminUser = await isAdmin()
    if (!isAdminUser) {
        return { data: null, error: 'No tienes permisos para ver empleados' }
    }

    const data = await prisma.User.findMany({
        where: { organization_id: user.organizationId },
        orderBy: { created_at: 'desc' }
    })

    return { data, error: null }
}
