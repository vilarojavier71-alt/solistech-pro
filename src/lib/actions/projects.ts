'use server'

import { prisma } from '@/lib/db'
import { getCurrentUserWithRole } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ============================================================================
// TYPES
// ============================================================================

export interface ProjectListItem {
    id: string
    name: string
    status: string
    installation_type: string | null
    customer_name: string | null
    customer_email: string | null
    system_size_kwp: number | null
    created_at: Date
    location: any
}

export interface ProjectsListResult {
    data: ProjectListItem[]
    total: number
    page: number
    pageSize: number
    totalPages: number
}

// ============================================================================
// SCHEMAS
// ============================================================================

const CreateProjectSchema = z.object({
    name: z.string().min(1, "El nombre del proyecto es obligatorio"),
    customer_id: z.string().uuid("ID de cliente inválido").optional(),
    installation_type: z.enum(['residential', 'commercial', 'industrial']).default('residential'),
    status: z.enum(['quote', 'approved', 'installation', 'completed']).default('quote'),
    system_size_kwp: z.number().positive().optional().nullable(),
    estimated_production_kwh: z.number().positive().optional().nullable(),
    estimated_savings: z.number().positive().optional().nullable(),
    street: z.string().optional(),
    city: z.string().optional(),
    postal_code: z.string().optional(),
    notes: z.string().optional()
})

const UpdateProjectSchema = CreateProjectSchema.partial()

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>

// ============================================================================
// LIST WITH PAGINATION AND FILTERS
// ============================================================================

export async function getProjectsList(params: {
    page?: number
    pageSize?: number
    search?: string
    status?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}): Promise<ProjectsListResult> {
    console.log('[PROJECTS ACTION] getProjectsList called')
    try {
        console.log('[PROJECTS ACTION] Inspecting prisma.projects:', typeof prisma.projects)
    } catch (e) {
        console.error('[PROJECTS ACTION] Error inspecting prisma:', e)
    }

    const user = await getCurrentUserWithRole()
    if (!user) {
        return { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 }
    }

    const {
        page = 1,
        pageSize = 10,
        search = '',
        status = '',
        sortBy = 'created_at',
        sortOrder = 'desc'
    } = params

    if (!user.organizationId || user.organizationId.length === 0) {
        console.warn('Invalid Organization UUID in getProjectsList', user.organizationId)
        return { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 }
    }

    const skip = (page - 1) * pageSize

    // Build where clause
    const where: any = {
        organization_id: user.organizationId,
    }

    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { customer: { name: { contains: search, mode: 'insensitive' } } },
        ]
    }

    if (status && status !== 'all') {
        where.status = status
    }

    // Get total count
    const total = await prisma.projects.count({ where })

    // Get paginated data
    const data = await prisma.projects.findMany({
        where,
        include: {
            customer: {
                select: { name: true, email: true }
            }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: pageSize,
    })

    // Transform data
    const transformedData: ProjectListItem[] = data.map(p => ({
        id: p.id,
        name: p.name,
        status: p.status || 'quote',
        installation_type: p.installation_type,
        customer_name: p.customer?.name || null,
        customer_email: p.customer?.email || null,
        system_size_kwp: p.system_size_kwp ? Number(p.system_size_kwp) : null,
        created_at: p.created_at,
        location: p.location,
    }))

    return {
        data: transformedData,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    }
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

export async function createProject(input: unknown) {
    console.log('[PROJECTS ACTION] createProject called')
    console.log('[PROJECTS ACTION] Input:', JSON.stringify(input))
    try {

        const validationResult = CreateProjectSchema.safeParse(input)
        if (!validationResult.success) {
            return { success: false, error: "Datos inválidos", details: validationResult.error.flatten().fieldErrors }
        }

        const data = validationResult.data
        const user = await getCurrentUserWithRole()
        if (!user) return { success: false, error: 'Sesión expirada' }

        const location = {
            address: data.street || null,
            city: data.city || null,
            postal_code: data.postal_code || null,
        }


        console.log('[PROJECTS ACTION] Creating project with data:', {
            organization_id: user.organizationId,
            client_id: data.customer_id || null,
            name: data.name
        })

        const newProject = await prisma.projects.create({
            data: {
                organization_id: user.organizationId,
                client_id: data.customer_id || null,
                name: data.name,
                installation_type: data.installation_type,
                status: data.status,
                system_size_kwp: data.system_size_kwp,
                estimated_production_kwh: data.estimated_production_kwh,
                estimated_savings: data.estimated_savings,
                location: location,
                description: data.notes || null,
                created_by: user.id
            }
        })

        revalidatePath('/dashboard/projects')
        return { success: true, data: newProject }

    } catch (error) {
        console.error('Error in createProject:', error)
        return { success: false, error: 'Error inesperado del servidor' }
    }
}

export async function updateProject(id: string, input: unknown) {
    try {
        const validationResult = UpdateProjectSchema.safeParse(input)
        if (!validationResult.success) {
            return { success: false, error: "Datos inválidos" }
        }

        const data = validationResult.data
        const user = await getCurrentUserWithRole()
        if (!user) return { success: false, error: 'Sesión expirada' }

        const updateData: any = {}
        if (data.name) updateData.name = data.name
        if (data.status) updateData.status = data.status
        if (data.installation_type) updateData.installation_type = data.installation_type
        if (data.customer_id) updateData.client_id = data.customer_id
        if (data.system_size_kwp !== undefined) updateData.system_size_kwp = data.system_size_kwp
        if (data.notes !== undefined) updateData.description = data.notes

        if (data.street || data.city || data.postal_code) {
            updateData.location = {
                address: data.street,
                city: data.city,
                postal_code: data.postal_code,
            }
        }

        updateData.updated_at = new Date()

        await prisma.projects.update({
            where: { id, organization_id: user.organizationId },
            data: updateData
        })

        revalidatePath('/dashboard/projects')
        return { success: true }

    } catch (error) {
        console.error('Error in updateProject:', error)
        return { success: false, error: 'Error al actualizar' }
    }
}

export async function deleteProject(id: string) {
    try {
        const user = await getCurrentUserWithRole()
        if (!user) return { success: false, error: 'Sesión expirada' }

        await prisma.projects.delete({
            where: { id, organization_id: user.organizationId }
        })

        revalidatePath('/dashboard/projects')
        return { success: true }

    } catch (error) {
        console.error('Error in deleteProject:', error)
        return { success: false, error: 'Error al eliminar' }
    }
}

export async function getProjectById(id: string) {
    const user = await getCurrentUserWithRole()
    if (!user) return null

    return prisma.projects.findFirst({
        where: { id, organization_id: user.organizationId },
        include: {
            customer: true,
            time_entries: true,
        }
    })
}

// Legacy export for compatibility
export async function getProjects() {
    const result = await getProjectsList({ page: 1, pageSize: 100 })
    return { success: true, data: result.data }
}
