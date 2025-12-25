'use server'

import { prisma } from '@/lib/db'
import { getMunicipalBenefitsByCoordinates } from './municipal-benefits'
import { calculateROI, suggestIRPFType, validateROIInputs, type IRPFDeductionType } from '@/lib/solar/roi-calculator'

/**
 * Calcula el ROI completo para un cálculo existente
 * Integra automáticamente las bonificaciones municipales
 * REFACTORED: Migrado de Supabase a Prisma Client
 * NOTE: El esquema actual de Calculation no tiene campos de subsidios,
 *       por lo que los datos de ROI se retornan pero no se persisten.
 */
export async function calculateFullROI(calculationId: string) {
    try {
        // 1. Obtener datos del cálculo con relaciones via Prisma
        const calc = await prisma.calculation.findUnique({
            where: { id: calculationId },
            include: {
                project: {
                    include: { customer: true }
                },
                organization: true
            }
        })

        if (!calc) {
            return { error: 'Cálculo no encontrado' }
        }

        // 2. Validar que tenemos los datos necesarios
        const components = calc.components as { total_cost?: number } | null
        const totalCost = components?.total_cost || 0
        const estimatedSavings = calc.estimated_savings?.toNumber() || 0
        const annualSavings = estimatedSavings * 12 // Convertir mensual a anual

        const validation = validateROIInputs(totalCost, annualSavings)
        if (!validation.valid) {
            return { error: validation.errors.join(', ') }
        }

        // 3. Obtener bonificaciones municipales por coordenadas
        const location = calc.location as { lat: number; lng: number; address?: string } | null
        if (!location?.lat || !location?.lng) {
            return { error: 'Ubicación no válida para calcular bonificaciones' }
        }

        const benefitsResult = await getMunicipalBenefitsByCoordinates(location.lat, location.lng)

        // Si no hay bonificaciones municipales, usar valores por defecto (0)
        const benefits = benefitsResult.data
        const ibiPercentage = benefits?.ibi_percentage || 0
        const ibiDuration = benefits?.ibi_duration_years || 0
        const icioPercentage = benefits?.icio_percentage || 0
        const municipality = benefits?.municipality || null
        const autonomousCommunity = benefits?.autonomous_community || null

        // 4. Obtener configuración de organización (IRPF por defecto) via Prisma
        const orgSettings = await prisma.organizationSettings.findUnique({
            where: { organization_id: calc.organization_id },
            select: { default_fiscal_deduction: true }
        })

        // Determinar tipo de IRPF (usar configuración org o sugerir automáticamente)
        // El campo subsidy_irpf_type existe en el esquema y contiene el tipo por defecto
        const irpfType: IRPFDeductionType =
            (orgSettings?.default_fiscal_deduction as IRPFDeductionType) ||
            (calc.subsidy_irpf_type as IRPFDeductionType) ||
            suggestIRPFType(calc.system_size_kwp?.toNumber() || 0)

        // 5. Calcular ROI completo
        const roi = calculateROI(
            totalCost,
            irpfType,
            ibiPercentage,
            ibiDuration,
            icioPercentage,
            annualSavings
        )

        // 6. Actualizar solo el campo subsidy_irpf_type que SÍ existe en el esquema
        await prisma.calculation.update({
            where: { id: calculationId },
            data: {
                subsidy_irpf_type: roi.irpf.type,
                updated_at: new Date()
            }
        })

        return {
            success: true,
            data: roi,
            municipality,
            autonomousCommunity
        }

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        console.error('Error in calculateFullROI:', error)
        return { error: errorMessage || 'Error desconocido' }
    }
}

/**
 * Recalcula el ROI con un tipo de IRPF diferente
 * (sin cambiar la configuración por defecto de la organización)
 * REFACTORED: Migrado de Supabase a Prisma Client
 */
export async function recalculateWithIRPFType(
    calculationId: string,
    irpfType: IRPFDeductionType
) {
    try {
        // Obtener datos actuales via Prisma
        const calc = await prisma.calculation.findUnique({
            where: { id: calculationId }
        })

        if (!calc) {
            return { error: 'Cálculo no encontrado' }
        }

        const components = calc.components as { total_cost?: number } | null
        const totalCost = components?.total_cost || 0
        const annualSavings = (calc.estimated_savings?.toNumber() || 0) * 12

        // Obtener beneficios municipales para recálculo
        const location = calc.location as { lat: number; lng: number } | null
        let ibiPercentage = 0
        let ibiDuration = 0
        let icioPercentage = 0

        if (location?.lat && location?.lng) {
            const benefitsResult = await getMunicipalBenefitsByCoordinates(location.lat, location.lng)
            if (benefitsResult.data) {
                ibiPercentage = benefitsResult.data.ibi_percentage || 0
                ibiDuration = benefitsResult.data.ibi_duration_years || 0
                icioPercentage = benefitsResult.data.icio_percentage || 0
            }
        }

        // Recalcular con nuevo tipo de IRPF
        const roi = calculateROI(
            totalCost,
            irpfType,
            ibiPercentage,
            ibiDuration,
            icioPercentage,
            annualSavings
        )

        // Actualizar solo el campo que existe en el esquema
        await prisma.calculation.update({
            where: { id: calculationId },
            data: {
                subsidy_irpf_type: roi.irpf.type,
                updated_at: new Date()
            }
        })

        return { success: true, data: roi }

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        console.error('Error in recalculateWithIRPFType:', error)
        return { error: errorMessage || 'Error desconocido' }
    }
}

/**
 * Obtiene un resumen del ROI para mostrar en la UI
 * REFACTORED: Migrado de Supabase a Prisma Client
 * NOTE: Los campos de subsidios detallados no existen en el esquema,
 *       se devuelven los datos disponibles.
 */
export async function getROISummary(calculationId: string) {
    try {
        const data = await prisma.calculation.findUnique({
            where: { id: calculationId },
            select: {
                subsidy_irpf_type: true,
                estimated_savings: true,
                system_size_kwp: true,
                components: true,
                location: true
            }
        })

        if (!data) {
            return { error: 'No se pudo obtener el resumen de ROI' }
        }

        return { data }
    } catch (error: unknown) {
        console.error('Error in getROISummary:', error)
        return { error: 'Error al obtener el resumen de ROI' }
    }
}
