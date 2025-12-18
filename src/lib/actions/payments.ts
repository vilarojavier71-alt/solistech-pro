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
}

const CreatePaymentMethodSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    instructions: z.string().optional()
})

async function getPaymentContext() {
    const user = await getCurrentUserWithRole()
    if (!user || !user.id) throw new Error('Usuario no autenticado')

    const profile = await prisma.users.findUnique({
        where: { id: user.id },
        select: { organization_id: true }
    })

    if (!profile?.organization_id) throw new Error('Organización no encontrada')

    return { organizationId: profile.organization_id }
}

export async function getPaymentMethods() {
    try {
        const { organizationId } = await getPaymentContext()

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

export async function createPaymentMethod(data: { name: string; instructions?: string }) {
    const validation = CreatePaymentMethodSchema.safeParse(data)
    if (!validation.success) return { error: "Datos inválidos" }

    try {
        const { organizationId } = await getPaymentContext()

        const newMethod = await prisma.payment_methods.create({
            data: {
                organization_id: organizationId,
                name: validation.data.name,
                instructions: validation.data.instructions || null
            }
        })

        revalidatePath('/dashboard/invoices')
        return { data: newMethod as PaymentMethod }
    } catch (error: any) {
        return { error: error.message }
    }
}
