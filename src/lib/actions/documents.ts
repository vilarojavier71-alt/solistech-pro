'use server'

import { getCurrentUserWithRole } from '@/lib/session'
import { prisma } from '@/lib/db'

// Kept for type compatibility if used elsewhere, though strictly not needed for Technical Data
export type DocumentType = 'contract' | 'technical_memory' | 'subsidy' | 'invoice' | 'other'

// Preserved for Technical Memory PDF generation
export async function getProjectTechnicalData(projectId: string) {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            customer: true,
            calculations: true,
            organization: true
        }
    })

    if (!project) return null

    // Helper to safely access location
    const location = project.location as Record<string, any> | null

    // Shape data for PDF
    return {
        project_name: project.name,
        created_at: new Date(project.created_at).toLocaleDateString(),
        location_name: location?.address || 'Ubicación no disponible',
        location_coords: (location?.lat && location?.lng) ? { lat: location.lat, lng: location.lng } : undefined,

        // customer relation in Prisma is 'customer' not 'customers'
        customer_name: project.customer?.name || 'Desconocido', // Customer has 'name', no 'full_name' in recent schema? Check type
        customer_address: project.customer?.address || '',
        customer_dni: project.customer?.nif || '',

        system_size_kwp: Number(project.system_size_kwp || 0),
        panels_count: 0, // Need calculation detail or estimate
        inverter_model: 'Standard',

        annual_production: Number(project.estimated_production_kwh || 0),
        performance_ratio: 0.82,
        monthly_production: [],

        org_name: project.organization?.name || 'MotorGap',
    }
}

