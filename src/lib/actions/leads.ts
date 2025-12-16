'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Validation Schemas
const CreateLeadSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    email: z.string().email("Email inválido").optional().or(z.literal('')),
    phone: z.string().optional(),
    company: z.string().optional(),
    source: z.string().default('web'),
    status: z.string().default('new'),
    estimated_value: z.coerce.number().optional(),
    notes: z.string().optional(),
})

export async function createLead(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) return { error: "No autenticado" }

    const user = await prisma.users.findUnique({
        where: { id: session.user.id },
        select: { organization_id: true }
    })

    if (!user?.organization_id) return { error: "No tienes organización asignada" }

    const rawData = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        company: formData.get('company'),
        source: formData.get('source'),
        status: formData.get('status'),
        estimated_value: formData.get('estimated_value'),
        notes: formData.get('notes'),
    }

    const validation = CreateLeadSchema.safeParse(rawData)

    if (!validation.success) {
        return { error: validation.error.errors[0].message }
    }

    try {
        await prisma.leads.create({
            data: {
                ...validation.data,
                organization_id: user.organization_id,
                assigned_to: session.user.id // Self-assign by default or make optional
            }
        })

        revalidatePath('/dashboard/leads')
        return { success: true }
    } catch (error) {
        console.error("Error creating lead:", error)
        return { error: "Error al crear el lead" }
    }
}

export async function getLeads() {
    const session = await auth()
    if (!session?.user?.id) return []

    const user = await prisma.users.findUnique({
        where: { id: session.user.id },
        select: { organization_id: true }
    })

    if (!user?.organization_id) return []

    return await prisma.leads.findMany({
        where: { organization_id: user.organization_id },
        orderBy: { created_at: 'desc' },
        include: {
            assigned_user: {
                select: { full_name: true, avatar_url: true }
            }
        }
    })
}

export async function updateLeadStatus(id: string, status: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "No autenticado" }

    try {
        await prisma.leads.update({
            where: { id },
            data: { status }
        })
        revalidatePath('/dashboard/leads')
        return { success: true }
    } catch (error) {
        return { error: "Error al actualizar estado" }
    }
}

export async function deleteLead(id: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "No autenticado" }

    const user = await prisma.users.findUnique({
        where: { id: session.user.id },
        select: { organization_id: true }
    })

    if (!user?.organization_id) return { error: "No tienes organización asignada" }

    try {
        // Verify lead belongs to user's organization before deleting
        const lead = await prisma.leads.findFirst({
            where: {
                id,
                organization_id: user.organization_id
            }
        })

        if (!lead) {
            return { error: "Lead no encontrado" }
        }

        await prisma.leads.delete({
            where: { id }
        })

        revalidatePath('/dashboard/leads')
        return { success: true }
    } catch (error) {
        console.error("Error deleting lead:", error)
        return { error: "Error al eliminar el lead" }
    }
}

export async function updateLead(id: string, data: any) {
    const session = await auth()
    if (!session?.user?.id) return { error: "No autenticado" }

    try {
        // Allow partial updates
        const validation = CreateLeadSchema.partial().safeParse(data)

        if (!validation.success) {
            return { error: validation.error.errors[0].message }
        }

        await prisma.leads.update({
            where: { id },
            data: validation.data
        })
        revalidatePath('/dashboard/leads')
        return { success: true }
    } catch (error) {
        console.error("Error updating lead:", error)
        return { error: "Error al actualizar el lead" }
    }
}

