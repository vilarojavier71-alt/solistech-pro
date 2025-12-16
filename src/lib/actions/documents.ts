'use server'

import { getCurrentUserWithRole } from '@/lib/session'

// Kept for type compatibility if used elsewhere, though strictly not needed for Technical Data
export type DocumentType = 'contract' | 'technical_memory' | 'subsidy' | 'invoice' | 'other'

// Preserved for Technical Memory PDF generation
export async function getProjectTechnicalData(projectId: string) {
    const supabase = await createClient()

    const { data: project } = await supabase
        .from('projects')
        .select(`
            *,
            customers (*),
            calculations (*) 
        `)
        .eq('id', projectId)
        .single()

    if (!project) return null

    // Shape data for PDF
    return {
        project_name: project.name,
        created_at: new Date(project.created_at).toLocaleDateString(),
        location_name: project.location?.address || project.address || 'Ubicación no disponible',
        location_coords: (project.latitude && project.longitude) ? { lat: project.latitude, lng: project.longitude } : undefined,

        customer_name: project.customers?.full_name || 'Desconocido',
        customer_address: project.customers?.address || '',
        customer_dni: project.customers?.nif || '',

        system_size_kwp: project.system_size_kwp || 0,
        panels_count: 0, // Need calculation detail or estimate
        inverter_model: 'Standard',

        annual_production: project.estimated_production_kwh || 0,
        performance_ratio: 0.82,
        monthly_production: [],

        org_name: 'SolisTech Pro', // Should get from Organization Settings
    }
}

