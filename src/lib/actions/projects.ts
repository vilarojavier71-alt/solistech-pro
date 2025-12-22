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
    // Relaxed customer_id to allow optional/empty
    customer_id: z.string().optional().nullable().or(z.literal('')),
    installation_type: z.enum(['residential', 'commercial', 'industrial']).default('residential'),
    status: z.enum(['quote', 'approved', 'installation', 'completed']).default('quote'),
    // Coerce numbers to handle string inputs safely
    system_size_kwp: z.coerce.number().positive().optional().nullable(),
    estimated_production_kwh: z.coerce.number().positive().optional().nullable(),
    estimated_savings: z.coerce.number().positive().optional().nullable(),
    street: z.string().optional(),
    city: z.string().optional(),
    postal_code: z.string().optional(),
    notes: z.string().optional(),
    // Technical fields from Calculator
    pvtechchoice: z.string().optional(),
    mountingplace: z.string().optional(),
    aspect: z.string().optional()
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
    const emptyResult = { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 }

    try {
        console.log('[PROJECTS ACTION] getProjectsList called')

        const user = await getCurrentUserWithRole()
        if (!user) {
            console.warn('[PROJECTS] No authenticated user')
            return emptyResult
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
            console.warn('[PROJECTS] Invalid Organization UUID', user.organizationId)
            return emptyResult
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
    } catch (error) {
        console.error('[PROJECTS ACTION] Fatal error in getProjectsList:', error)
        // Return empty result instead of throwing to prevent 500
        return { data: [], total: 0, page: params.page || 1, pageSize: params.pageSize || 10, totalPages: 0 }
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
            console.error('[PROJECTS ACTION] Validation Error:', validationResult.error.flatten())
            return { success: false, error: "Datos inválidos", details: validationResult.error.flatten().fieldErrors }
        }

        const data = validationResult.data
        const user = await getCurrentUserWithRole()
        if (!user) return { success: false, error: 'Sesión expirada' }

        if (!user.organizationId) {
            console.error('[PROJECTS ACTION] User has no organizationId:', user.id)
            return { success: false, error: 'Usuario sin organización asignada' }
        }

        // Handle client_id safely (mapped from customer_id)
        let client_id: string | null = null
        if (data.customer_id && data.customer_id.trim() !== '') {
            client_id = data.customer_id
        }

        // Store address AND extra technical fields in location JSON
        const location = {
            address: data.street || null,
            city: data.city || null,
            postal_code: data.postal_code || null,
            // Extra fields from Calculator integration
            pvtechchoice: data.pvtechchoice || null,
            mountingplace: data.mountingplace || null,
            aspect: data.aspect || null
        }

        console.log('[PROJECTS ACTION] Creating project with data:', {
            organization_id: user.organizationId,
            client_id,
            name: data.name
        })

        // Ensure proper types for DB
        const newProject = await prisma.projects.create({
            data: {
                organization_id: user.organizationId,
                client_id: client_id,
                name: data.name,
                installation_type: data.installation_type,
                status: data.status,
                // Ensure numbers are handled
                system_size_kwp: data.system_size_kwp ? data.system_size_kwp : null,
                estimated_production_kwh: data.estimated_production_kwh ? data.estimated_production_kwh : null,
                estimated_savings: data.estimated_savings ? data.estimated_savings : null,
                location: location as any, // Explicit cast for JSON
                description: data.notes || null,
                created_by: user.id
            }
        })

        revalidatePath('/dashboard/projects')

        // Serialize Prisma result to standard JSON to avoid "Decimal" serialization errors
        const serializedProject = {
            ...newProject,
            system_size_kwp: newProject.system_size_kwp ? Number(newProject.system_size_kwp) : null,
            estimated_production_kwh: newProject.estimated_production_kwh ? Number(newProject.estimated_production_kwh) : null,
            estimated_savings: newProject.estimated_savings ? Number(newProject.estimated_savings) : null,
        }

        return { success: true, data: serializedProject }

    } catch (error: any) {
        console.error('Error in createProject:', error)
        // Return explicit error for debugging
        return { success: false, error: `Error al crear proyecto: ${error.message}` }
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
