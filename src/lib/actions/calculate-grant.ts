'use server'

import { prisma } from '@/lib/db'

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
    try {
        // 1. Obtener subvenciones aplicables desde grants_db
        // Usamos raw query porque grants_db no está en el esquema Prisma aún
        const currentDate = new Date().toISOString().split('T')[0]

        let grants: any[] = []
        try {
            grants = await prisma.$queryRaw`
                SELECT * FROM get_applicable_grants(
                    ${params.autonomousCommunity}, 
                    ${params.province || null}, 
                    ${params.municipality || null}, 
                    ${params.systemSizeKwp}, 
                    ${currentDate}::date
                )
            `
        } catch (dbError) {
            console.error('Error fetching grants via RPC, trying direct fallback if needed:', dbError)
            // If RPC fails, grants remains empty array
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
    try {
        await prisma.project.update({
            where: { id: projectId },
            data: {
                grant_calculation: calculation as any, // Cast to any if Json type mismatch
                updated_at: new Date()
            }
        })
    } catch (error) {
        console.error('Error saving grant calculation:', error)
    }
}

/**
 * Obtiene el cálculo de subvenciones guardado de un proyecto
 */
export async function getProjectGrantCalculation(projectId: string): Promise<{ data: GrantCalculation | null, error: string | null }> {
    try {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { grant_calculation: true }
        })

        if (!project) {
            return { data: null, error: 'Project not found' }
        }

        return { data: project.grant_calculation as unknown as GrantCalculation || null, error: null }

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        return { data: null, error: errorMessage }
    }
}

/**
 * Lista todas las subvenciones disponibles para una C.A.
 */
export async function listAvailableGrants(autonomousCommunity: string, province?: string) {
    try {
        // Usamos raw query porque grants_db no está en Prisma
        const today = new Date().toISOString()

        let query = `
            SELECT * FROM grants_db 
            WHERE is_active = true 
            AND (autonomous_community = '${autonomousCommunity}' OR autonomous_community = 'NACIONAL')
            AND valid_from <= '${today}'
        `

        if (province) {
            query += ` AND (province IS NULL OR province = '${province}')`
        }

        query += ` ORDER BY grant_type ASC`

        const grants = await prisma.$queryRawUnsafe(query)

        return { data: grants as any[], error: null }

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        return { data: null, error: errorMessage }
    }
}

