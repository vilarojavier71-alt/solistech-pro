'use server'

import { prisma } from '@/lib/db'
import { getCurrentUserWithRole, isAdmin } from '@/lib/session'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const CreateUserSchema = z.object({
    email: z.string().email('Email inválido'),
    fullName: z.string().min(3, 'Nombre muy corto'),
    role: z.enum(['admin', 'manager', 'employee', 'owner', 'ingeniero', 'comercial', 'captador_visitas', 'user']),
    password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
})

type CreateUserState = {
    success?: boolean
    error?: string
    data?: any
}

export async function createSystemUser(prevState: CreateUserState | null, formData: FormData): Promise<CreateUserState> {
    try {
        const user = await getCurrentUserWithRole()
        if (!user) return { error: 'No autenticado' }

        const isAdminUser = await isAdmin()

        // God Mode bypass
        const organization = await prisma.organizations.findUnique({
            where: { id: user.organizationId || undefined },
            select: { is_god_mode: true }
        })
        const isGodMode = organization?.is_god_mode

        if (!isAdminUser && !isGodMode) {
            return { error: 'No tienes permisos de administrador para crear usuarios' }
        }

        // Fix: Explicitly handle formData.get returning null/Object/File by casting to string or undefined
        const rawData = {
            email: formData.get('email') as string,
            fullName: formData.get('fullName') as string,
            role: (formData.get('role') as string) || undefined, // undefined lets Zod catch it if required
            password: formData.get('password') as string,
        }

        const validatedFields = CreateUserSchema.safeParse(rawData)
        if (!validatedFields.success) {
            return { error: (validatedFields as any).error.errors[0].message }
        }

        const { email, fullName, role, password } = validatedFields.data

        // Check if user exists
        const existingUser = await prisma.users.findUnique({
            where: { email }
        })

        if (existingUser) {
            return { error: 'Ya existe un usuario con ese email' }
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12)

        // Create user
        const newUser = await prisma.users.create({
            data: {
                email,
                full_name: fullName,
                password_hash: passwordHash,
                role,
                organization_id: user.organizationId,
                email_verified: true
            }
        })

        revalidatePath('/dashboard/admin/users')
        revalidatePath('/dashboard/team')

        return {
            success: true,
            data: {
                userId: newUser.id,
                email: newUser.email
            }
        }

    } catch (e: any) {
        console.error('Server Action Exception:', e)
        return { error: 'Error interno del servidor' }
    }
}

const UpdateUserSchema = z.object({
    userId: z.string().uuid(),
    fullName: z.string().min(3, 'Nombre muy corto'),
    role: z.enum(['admin', 'manager', 'employee', 'owner', 'ingeniero', 'comercial', 'captador_visitas', 'user']),
})

export async function updateSystemUser(prevState: any, formData: FormData) {
    try {
        const admin = await isAdmin()
        if (!admin) return { error: 'No autorizado' }

        const rawData = {
            userId: formData.get('userId') as string,
            fullName: formData.get('fullName') as string,
            role: formData.get('role') as string,
        }

        const validated = UpdateUserSchema.safeParse(rawData)
        if (!validated.success) return { error: (validated as any).error.errors[0].message }

        const { userId, fullName, role } = validated.data

        await prisma.users.update({
            where: { id: userId },
            data: { full_name: fullName, role }
        })

        revalidatePath('/dashboard/admin/users')
        return { success: true }
    } catch (e) {
        return { error: 'Error al actualizar usuario' }
    }
}

export async function resetUserPassword(prevState: any, formData: FormData) {
    try {
        const admin = await isAdmin()
        if (!admin) return { error: 'No autorizado' }

        const userId = formData.get('userId') as string
        const newPassword = formData.get('password') as string

        if (!userId || !newPassword || newPassword.length < 6) {
            return { error: 'Datos inválidos' }
        }

        const passwordHash = await bcrypt.hash(newPassword, 12)

        await prisma.users.update({
            where: { id: userId },
            data: { password_hash: passwordHash }
        })

        revalidatePath('/dashboard/admin/users')
        return { success: true }
    } catch (e) {
        return { error: 'Error al cambiar contraseña' }
    }
}

export async function deactivateSystemUser(userId: string) {
    try {
        const admin = await isAdmin()
        if (!admin) return { error: 'No autorizado' }

        // prevent deleting yourself
        const currentUser = await getCurrentUserWithRole()
        if (currentUser?.id === userId) return { error: 'No puedes desactivar tu propia cuenta' }

        await prisma.users.update({
            where: { id: userId },
            data: { email_verified: false } // Soft deactivate relying on email_verified logic (or we could use a new status field)
        })

        revalidatePath('/dashboard/admin/users')
        return { success: true }
    } catch (e) {
        return { error: 'Error al desactivar usuario' }
    }
}
