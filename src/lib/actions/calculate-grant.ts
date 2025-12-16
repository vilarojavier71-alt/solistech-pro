'use server'

import { getCurrentUserWithRole } from '@/lib/session'

/**
 * Tipos de subvenciones disponibles
 */
export type GrantType = 'IRPF' | 'IBI' | 'ICIO' | 'SUBVENCION_DIRECTA' | 'BONIFICACION_TASA' | 'AYUDA_INSTALACION'

/**
 * Resultado del cálculo de subvenciones
 */
export interface GrantCalculation {
    // IRPF
    irpf: {
        applicable: boolean
        percentage: number // 20, 40, or 60
        maxAmount: number
        maxBase: number
        estimatedDeduction: number
    }

    // IBI
    ibi: {
        applicable: boolean
        percentage: number
        durationYears: number
        annualSavings: number
        totalSavings: number
    }

    // ICIO
    icio: {
        applicable: boolean
        percentage: number
        estimatedSavings: number
    }

    // Subvenciones directas
    directGrants: Array<{
        type: string
        amount: number
        percentage: number
        description: string
        requiresPreRegistration: boolean
    }>

    // Totales
    totalSavings: number
    totalGrants: number
    netCost: number // Coste después de subvenciones

    // Metadata
    autonomousCommunity: string
    province?: string
    municipality?: string
    calculatedAt: string
}

/**
 * Parámetros para el cálculo de subvenciones
 */
export interface GrantCalculationParams {
    projectId?: string
    autonomousCommunity: string
    province?: string
    municipality?: string
    systemSizeKwp: number
    totalCost: number
    ibiAnnual?: number // IBI anual actual de la propiedad
}

/**
 * Calcula todas las subvenciones aplicables a un proyecto
 */
export async function calculateGrant(params: GrantCalculationParams): Promise<{ data: GrantCalculation | null, error: string | null }> {
    const supabase = await createClient()

    try {
        // 1. Obtener subvenciones aplicables desde grants_db
        const { data: grants, error: grantsError } = await supabase
            .rpc('get_applicable_grants', {
                p_autonomous_community: params.autonomousCommunity,
                p_province: params.province || null,
                p_municipality: params.municipality || null,
                p_power_kwp: params.systemSizeKwp,
                p_reference_date: new Date().toISOString().split('T')[0]
            })

        if (grantsError) {
            console.error('Error fetching grants:', grantsError)
            // Continuar con cálculo básico si falla la BD
        }

        // 2. Calcular IRPF
        const irpfGrants = grants?.filter((g: any) => g.grant_type === 'IRPF') || []
        const irpfGrant = irpfGrants.find((g: any) => params.totalCost <= g.irpf_max_amount * 100 / g.irpf_percentage) || irpfGrants[irpfGrants.length - 1]

        const irpfPercentage = irpfGrant?.irpf_percentage || 0
        const irpfMaxAmount = irpfGrant?.irpf_max_amount || 0
        const irpfMaxBase = irpfPercentage > 0 ? irpfMaxAmount * 100 / irpfPercentage : 0
        const irpfBase = Math.min(params.totalCost, irpfMaxBase)
        const irpfDeduction = (irpfBase * irpfPercentage) / 100

        // 3. Calcular IBI
        const ibiGrant = grants?.find((g: any) => g.grant_type === 'IBI')
        const ibiPercentage = ibiGrant?.ibi_percentage || 0
        const ibiDuration = ibiGrant?.ibi_duration_years || 0
        const ibiAnnual = params.ibiAnnual || 0
        const ibiAnnualSavings = (ibiAnnual * ibiPercentage) / 100
        const ibiTotalSavings = ibiAnnualSavings * ibiDuration

        // 4. Calcular ICIO
        const icioGrant = grants?.find((g: any) => g.grant_type === 'ICIO')
        const icioPercentage = icioGrant?.icio_percentage || 0
        // ICIO típicamente es 4% del coste de obra
        const icioBase = params.totalCost * 0.04
        const icioSavings = (icioBase * icioPercentage) / 100

        // 5. Subvenciones directas
        const directGrantsList = grants?.filter((g: any) => g.grant_type === 'SUBVENCION_DIRECTA') || []
        const directGrants = directGrantsList.map((g: any) => ({
            type: g.grant_type,
            amount: g.direct_grant_amount || 0,
            percentage: g.direct_grant_percentage || 0,
            description: g.description || '',
            requiresPreRegistration: g.requires_pre_registration || false
        }))

        const totalDirectGrants = directGrants.reduce((sum: number, g: { amount: number }) => sum + g.amount, 0)

        // 6. Calcular totales
        const totalSavings = ibiTotalSavings + icioSavings
        const totalGrants = irpfDeduction + totalDirectGrants
        const netCost = params.totalCost - totalGrants - icioSavings

        // 7. Construir resultado
        const result: GrantCalculation = {
            irpf: {
                applicable: irpfPercentage > 0,
                percentage: irpfPercentage,
                maxAmount: irpfMaxAmount,
                maxBase: irpfMaxBase,
                estimatedDeduction: Math.round(irpfDeduction * 100) / 100
            },
            ibi: {
                applicable: ibiPercentage > 0,
                percentage: ibiPercentage,
                durationYears: ibiDuration,
                annualSavings: Math.round(ibiAnnualSavings * 100) / 100,
                totalSavings: Math.round(ibiTotalSavings * 100) / 100
            },
            icio: {
                applicable: icioPercentage > 0,
                percentage: icioPercentage,
                estimatedSavings: Math.round(icioSavings * 100) / 100
            },
            directGrants,
            totalSavings: Math.round(totalSavings * 100) / 100,
            totalGrants: Math.round(totalGrants * 100) / 100,
            netCost: Math.round(netCost * 100) / 100,
            autonomousCommunity: params.autonomousCommunity,
            province: params.province,
            municipality: params.municipality,
            calculatedAt: new Date().toISOString()
        }

        // 8. Si hay projectId, guardar en BD
        if (params.projectId) {
            await saveGrantCalculation(params.projectId, result)
        }

        return { data: result, error: null }

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        console.error('Error in calculateGrant:', error)
        return { data: null, error: errorMessage || 'Error al calcular subvenciones' }
    }
}

/**
 * Guarda el cálculo de subvenciones en el proyecto
 */
async function saveGrantCalculation(projectId: string, calculation: GrantCalculation) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('projects')
        .update({
            grant_calculation: calculation,
            updated_at: new Date().toISOString()
        })
        .eq('id', projectId)

    if (error) {
        console.error('Error saving grant calculation:', error)
    }
}

/**
 * Obtiene el cálculo de subvenciones guardado de un proyecto
 */
export async function getProjectGrantCalculation(projectId: string): Promise<{ data: GrantCalculation | null, error: string | null }> {
    const supabase = await createClient()

    try {
        const { data, error } = await supabase
            .from('projects')
            .select('grant_calculation')
            .eq('id', projectId)
            .single()

        if (error) {
            return { data: null, error: error.message }
        }

        return { data: data?.grant_calculation || null, error: null }

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        return { data: null, error: errorMessage }
    }
}

/**
 * Lista todas las subvenciones disponibles para una C.A.
 */
export async function listAvailableGrants(autonomousCommunity: string, province?: string) {
    const supabase = await createClient()

    try {
        let query = supabase
            .from('grants_db')
            .select('*')
            .eq('is_active', true)
            .or(`autonomous_community.eq.${autonomousCommunity},autonomous_community.eq.NACIONAL`)
            .lte('valid_from', new Date().toISOString())

        if (province) {
            query = query.or(`province.is.null,province.eq.${province}`)
        }

        const { data, error } = await query.order('grant_type')

        if (error) {
            return { data: null, error: error.message }
        }

        return { data, error: null }

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        return { data: null, error: errorMessage }
    }
}

