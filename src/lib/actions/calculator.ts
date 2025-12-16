'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUserWithRole } from '@/lib/session'
import { revalidatePath } from 'next/cache'

interface SaveCalculationData {
    systemSize: number
    panels: number
    production: number
    consumption: number
    location: {
        lat: number
        lng: number
        name: string
    }
    roofOrientation: string
    roofTilt: number
    savings: number
    roi: number
    annualROI?: number
    payback?: number
    monthlyProduction?: number[]
    availableArea?: number  // Área disponible del tejado en m²
}

export async function saveCalculation(data: SaveCalculationData) {
    try {
        // Use Admin client to bypass RLS for server-side operations
        const supabase = createAdminClient()

        // Get current user from NextAuth session for ID
        const sessionUser = await getCurrentUserWithRole()
        if (!sessionUser || !sessionUser.id) {
            return { error: 'No autenticado. Por favor inicie sesión.' }
        }

        // Refetch fresh user data from DB using Admin Client to ensure Organization ID is valid and up-to-date
        // This fixes issues with stale sessions or deleted organizations
        const { data: dbUser, error: userFetchError } = await supabase
            .from('users')
            .select('organization_id')
            .eq('id', sessionUser.id)
            .single()

        if (userFetchError || !dbUser) {
            console.warn('Failed to fetch fresh user data:', userFetchError)
            // Fallback to session data if DB fetch fails
            if (sessionUser.organizationId) {
                console.log('Falling back to session organization ID')
            } else {
                return { error: `Error al validar usuario (${sessionUser.id}): ${userFetchError?.message || 'Usuario no encontrado en BD'}` }
            }
        }

        const organizationId = dbUser?.organization_id || sessionUser.organizationId
        if (!organizationId) {
            return { error: 'Su usuario no tiene una organización asignada válida. Contacte soporte.', code: 'ORGANIZATION_REQUIRED' }
        }

        // Validar y limitar valores numéricos para evitar overflow
        const safeROI = Math.min(Math.max(data.roi || 0, 0), 9999) // Max 9999%
        const safeAnnualROI = Math.min(Math.max(data.annualROI || 0, 0), 100) // Max 100%

        // Prepare insert payload
        const insertPayload = {
            organization_id: organizationId,
            annual_consumption_kwh: data.consumption,
            location: {
                lat: data.location.lat,
                lng: data.location.lng,
                address: data.location.name
            },
            roof_orientation: data.roofOrientation,
            roof_tilt: data.roofTilt,
            roof_area_available: data.availableArea,
            system_size_kwp: data.systemSize,
            estimated_production_kwh: data.production,
            roi_percentage: safeROI,
            payback_years: data.payback,
            components: {
                panels: data.panels,
                savings: data.savings,
                annual_roi: safeAnnualROI,
                monthly_production: data.monthlyProduction || []
            },
            created_by: sessionUser.id
        }

        // Verify organization exists (Defensive Check for FK)
        // Now using the fresh ID from DB, so this check should pass if DB integrity is maintained
        const { data: orgExists, error: orgCheckError } = await supabase
            .from('organizations')
            .select('id')
            .eq('id', organizationId)
            .single()

        if (orgCheckError || !orgExists) {
            console.error('Organization FK check failed:', orgCheckError)
            return { error: 'La organización asignada a su usuario no es válida o ha sido eliminada. Contacte soporte.', code: 'ORGANIZATION_REQUIRED' }
        }

        const { data: calculation, error } = await supabase
            .from('calculations')
            .insert(insertPayload)
            .select()
            .single()

        if (error) {
            // Handle Foreign Key Violation (Postgres Code 23503)
            // Likely caused by created_by referring to auth.users instead of public.users
            if (error?.code === '23503') {
                console.warn('FK Violation detected (23503). Retrying with created_by = null')

                // Retry without created_by
                // Ensure we use undefined to remove the key, or null if schema permits
                const { created_by, ...retryPayloadWithoutUser } = insertPayload

                const { data: retryCalc, error: retryError } = await supabase
                    .from('calculations')
                    .insert({ ...retryPayloadWithoutUser, created_by: null }) // Explicit null
                    .select()
                    .single()

                if (retryError) {
                    console.error('Retry failed:', retryError)
                    return { error: `Error de base de datos al guardar (Código ${retryError.code}). Detalles: ${retryError.message}` }
                }

                revalidatePath('/dashboard/calculator')
                return retryCalc // Return success data logic (implicit success)
            }
            throw error // Throw to catch block below logic
        }

        revalidatePath('/dashboard/calculator')
        return calculation

    } catch (error: any) {
        console.error('Save calculation error:', error)
        return { error: `Error al guardar cálculo: ${error.message || 'Error desconocido'}` }
    }
}
