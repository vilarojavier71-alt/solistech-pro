'use server'

import { prisma } from '@/lib/db'
import { getCurrentUserWithRole } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export type PaymentMethod = {
    id: string
    name: string
    instructions: string | null
    is_default: boolean
    is_active: boolean
    details?: any
}

const PaymentMethodSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    instructions: z.string().optional(),
    is_default: z.boolean().default(false)
})

async function getPaymentSettingsContext() {
    const user = await getCurrentUserWithRole()
    if (!user || !user.id) throw new Error('Usuario no autenticado')

    const profile = await prisma.User.findUnique({
        where: { id: user.id },
        select: { organization_id: true }
    })

    if (!profile?.organization_id) throw new Error('Organización no encontrada')

    return { organizationId: profile.organization_id }
}

export async function getPaymentMethods() {
    try {
        const { organizationId } = await getPaymentSettingsContext()

        const methods = await prisma.payment_methods.findMany({
            where: { organization_id: organizationId, is_active: true },
            orderBy: [{ is_default: 'desc' }, { name: 'asc' }]
        })

        return methods as PaymentMethod[]
    } catch (error) {
        console.error('Error fetching payment methods:', error)
        return []
    }
}

export async function createPaymentMethod(data: z.infer<typeof PaymentMethodSchema>) {
    const validation = PaymentMethodSchema.safeParse(data)
    if (!validation.success) return { error: 'Datos inválidos' }

    try {
        const { organizationId } = await getPaymentSettingsContext()

        const newMethod = await prisma.payment_methods.create({
            data: {
                organization_id: organizationId,
                name: validation.data.name,
                instructions: validation.data.instructions || null,
                is_default: validation.data.is_default
            }
        })

        revalidatePath('/dashboard/settings/finance')
        revalidatePath('/dashboard/invoices')
        return { data: newMethod as PaymentMethod }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function updatePaymentMethod(id: string, data: Partial<z.infer<typeof PaymentMethodSchema>>) {
    try {
        const { organizationId } = await getPaymentSettingsContext()

        const updatedMethod = await prisma.payment_methods.updateMany({
            where: { id, organization_id: organizationId },
            data: {
                name: data.name,
                instructions: data.instructions,
                is_default: data.is_default
            }
        })

        revalidatePath('/dashboard/settings/finance')
        revalidatePath('/dashboard/invoices')
        return { data: updatedMethod }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function deletePaymentMethod(id: string) {
    try {
        const { organizationId } = await getPaymentSettingsContext()

        await prisma.payment_methods.updateMany({
            where: { id, organization_id: organizationId },
            data: { is_active: false }
        })

        revalidatePath('/dashboard/settings/finance')
        revalidatePath('/dashboard/invoices')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}
