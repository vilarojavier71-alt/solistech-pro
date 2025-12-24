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

    const user = await prisma.user.findUnique({
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
        return { error: validation.error.issues[0].message }
    }

    try {
        await prisma.lead.create({
            data: {
                ...validation.data,
                organization_id: user.organization_id,
                assigned_to: session.user.id // Self-assign by default or make optional
            }
        })

        revalidatePath('/dashboard/leads')
        return { success: true }
    } catch (error) {
        return { error: "Error al crear el lead" }
    }
}

export async function getLeads(params?: {
    query?: string
    status?: string
    sort?: string
}) {
    const session = await auth()
    if (!session?.user?.id) return []

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { organization_id: true }
    })

    if (!user?.organization_id) return []

    const where: any = {
        organization_id: user.organization_id,
    }

    if (params?.status && params.status !== 'all') {
        where.status = params.status
    }

    if (params?.query) {
        where.OR = [
            { name: { contains: params.query, mode: 'insensitive' } },
            { email: { contains: params.query, mode: 'insensitive' } },
            { company: { contains: params.query, mode: 'insensitive' } },
            { phone: { contains: params.query, mode: 'insensitive' } },
        ]
    }

    const orderBy: any = {}
    if (params?.sort) {
        const [field, direction] = params.sort.split('-')
        // Only allow specific fields to prevent errors
        if (['created_at', 'name', 'estimated_value', 'status'].includes(field)) {
            orderBy[field] = direction === 'asc' ? 'asc' : 'desc'
        } else {
            orderBy.created_at = 'desc'
        }
    } else {
        orderBy.created_at = 'desc'
    }

    return await prisma.lead.findMany({
        where,
        orderBy,
        include: {
            assigned_user: {
                select: { full_name: true, avatar_url: true }
            }
        },
        take: 100 // Safety limit
    })
}

// ✅ SEGURO: Validación de ownership (IDOR Prevention)
export async function updateLeadStatus(id: string, status: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "No autenticado" }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { organization_id: true }
    })

    if (!user?.organization_id) return { error: "No tienes organización asignada" }

    try {
        // ✅ Validar ownership ANTES de actualizar
        const lead = await prisma.lead.findFirst({
            where: {
                id,
                organization_id: user.organization_id
            }
        })

        if (!lead) {
            return { error: "Lead no encontrado o no pertenece a tu organización" }
        }

        await prisma.lead.update({
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

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { organization_id: true }
    })

    if (!user?.organization_id) return { error: "No tienes organización asignada" }

    try {
        // Verify lead belongs to user's organization before deleting
        const lead = await prisma.lead.findFirst({
            where: {
                id,
                organization_id: user.organization_id
            }
        })

        if (!lead) {
            return { error: "Lead no encontrado" }
        }

        await prisma.lead.delete({
            where: { id }
        })

        revalidatePath('/dashboard/leads')
        return { success: true }
    } catch (error) {
        return { error: "Error al eliminar el lead" }
    }
}

// ✅ SEGURO: Validación de ownership (IDOR Prevention)
export async function updateLead(id: string, data: any) {
    const session = await auth()
    if (!session?.user?.id) return { error: "No autenticado" }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { organization_id: true }
    })

    if (!user?.organization_id) return { error: "No tienes organización asignada" }

    try {
        // ✅ Validar ownership ANTES de actualizar
        const lead = await prisma.lead.findFirst({
            where: {
                id,
                organization_id: user.organization_id
            }
        })

        if (!lead) {
            return { error: "Lead no encontrado o no pertenece a tu organización" }
        }

        const validation = CreateLeadSchema.partial().safeParse(data)
        if (!validation.success) {
            return { error: validation.error.issues[0].message }
        }

        await prisma.lead.update({
            where: { id },
            data: validation.data
        })
        revalidatePath('/dashboard/leads')
        return { success: true }
    } catch (error) {
        return { error: "Error al actualizar el lead" }
    }
}

