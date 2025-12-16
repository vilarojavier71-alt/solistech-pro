'use server'

import { getCurrentUserWithRole } from '@/lib/session'
import { getMunicipalBenefitsByCoordinates } from './municipal-benefits'
import { calculateROI, suggestIRPFType, validateROIInputs, type IRPFDeductionType } from '@/lib/solar/roi-calculator'

/**
 * Calcula el ROI completo para un cálculo existente
 * Integra automáticamente las bonificaciones municipales
 */
export async function calculateFullROI(calculationId: string) {
    const supabase = await createClient()

    try {
        // 1. Obtener datos del cálculo con relaciones
        const { data: calc, error: calcError } = await supabase
            .from('calculations')
            .select(`
                *,
                project:projects(
                    *,
                    customer:customers(*)
                ),
                organization:organizations(*)
            `)
            .eq('id', calculationId)
            .single()

        if (calcError || !calc) {
            return { error: 'Cálculo no encontrado' }
        }

        // 2. Validar que tenemos los datos necesarios
        const totalCost = calc.components?.total_cost || 0
        const estimatedSavings = calc.estimated_savings || 0
        const annualSavings = estimatedSavings * 12 // Convertir mensual a anual

        const validation = validateROIInputs(totalCost, annualSavings)
        if (!validation.valid) {
            return { error: validation.errors.join(', ') }
        }

        // 3. Obtener bonificaciones municipales por coordenadas
        const location = calc.location as { lat: number; lng: number; address?: string }
        const { data: benefits, error: benefitsError } = await getMunicipalBenefitsByCoordinates(
            location.lat,
            location.lng
        )

        // Si no hay bonificaciones municipales, usar valores por defecto (0)
        const ibiPercentage = benefits?.ibi_percentage || 0
        const ibiDuration = benefits?.ibi_duration_years || 0
        const icioPercentage = benefits?.icio_percentage || 0
        const municipality = benefits?.municipality || null
        const autonomousCommunity = benefits?.autonomous_community || null

        // 4. Obtener configuración de organización (IRPF por defecto)
        const { data: orgSettings } = await supabase
            .from('organization_settings')
            .select('default_fiscal_deduction')
            .eq('organization_id', calc.organization_id)
            .single()

        // Determinar tipo de IRPF (usar configuración org o sugerir automáticamente)
        const irpfType: IRPFDeductionType =
            (orgSettings?.default_fiscal_deduction as IRPFDeductionType) ||
            suggestIRPFType(calc.system_size_kwp || 0)

        // 5. Calcular ROI completo
        const roi = calculateROI(
            totalCost,
            irpfType,
            ibiPercentage,
            ibiDuration,
            icioPercentage,
            annualSavings
        )

        // 6. Actualizar cálculo con datos fiscales
        const { error: updateError } = await supabase
            .from('calculations')
            .update({
                // Región y municipio
                subsidy_region: autonomousCommunity,
                subsidy_municipality: municipality,

                // IRPF
                subsidy_irpf_type: roi.irpf.type,
                subsidy_irpf_percentage: roi.irpf.percentage,
                subsidy_irpf_amount: roi.irpf.amount,
                subsidy_irpf_max_amount: roi.irpf.maxAmount,

                // IBI
                subsidy_ibi_percentage: roi.ibi.percentage,
                subsidy_ibi_duration_years: roi.ibi.durationYears,
                subsidy_ibi_annual: roi.ibi.annualSavings,
                subsidy_ibi_total: roi.ibi.totalSavings,

                // ICIO
                subsidy_icio_percentage: roi.icio.percentage,
                subsidy_icio_amount: roi.icio.amount,

                // Totales
                total_subsidies: roi.totalSubsidies,
                net_cost: roi.netCost,

                // ROI
                roi_with_subsidies: roi.roi25Years,
                annual_roi_with_subsidies: roi.annualROI,

                updated_at: new Date().toISOString()
            })
            .eq('id', calculationId)

        if (updateError) {
            console.error('Error updating calculation:', updateError)
            return { error: 'Error al actualizar el cálculo' }
        }

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
 */
export async function recalculateWithIRPFType(
    calculationId: string,
    irpfType: IRPFDeductionType
) {
    const supabase = await createClient()

    try {
        // Obtener datos actuales
        const { data: calc } = await supabase
            .from('calculations')
            .select('*')
            .eq('id', calculationId)
            .single()

        if (!calc) {
            return { error: 'Cálculo no encontrado' }
        }

        const totalCost = calc.components?.total_cost || 0
        const annualSavings = (calc.estimated_savings || 0) * 12

        // Recalcular con nuevo tipo de IRPF
        const roi = calculateROI(
            totalCost,
            irpfType,
            calc.subsidy_ibi_percentage || 0,
            calc.subsidy_ibi_duration_years || 0,
            calc.subsidy_icio_percentage || 0,
            annualSavings
        )

        // Actualizar solo los campos de IRPF y totales
        const { error: updateError } = await supabase
            .from('calculations')
            .update({
                subsidy_irpf_type: roi.irpf.type,
                subsidy_irpf_percentage: roi.irpf.percentage,
                subsidy_irpf_amount: roi.irpf.amount,
                subsidy_irpf_max_amount: roi.irpf.maxAmount,
                total_subsidies: roi.totalSubsidies,
                net_cost: roi.netCost,
                roi_with_subsidies: roi.roi25Years,
                annual_roi_with_subsidies: roi.annualROI,
                updated_at: new Date().toISOString()
            })
            .eq('id', calculationId)

        if (updateError) {
            return { error: 'Error al actualizar el cálculo' }
        }

        return { success: true, data: roi }

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        console.error('Error in recalculateWithIRPFType:', error)
        return { error: errorMessage || 'Error desconocido' }
    }
}

/**
 * Obtiene un resumen del ROI para mostrar en la UI
 */
export async function getROISummary(calculationId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('calculations')
        .select(`
            total_subsidies,
            net_cost,
            roi_with_subsidies,
            annual_roi_with_subsidies,
            subsidy_irpf_type,
            subsidy_irpf_amount,
            subsidy_ibi_total,
            subsidy_icio_amount,
            subsidy_region,
            subsidy_municipality,
            estimated_savings
        `)
        .eq('id', calculationId)
        .single()

    if (error || !data) {
        return { error: 'No se pudo obtener el resumen de ROI' }
    }

    return { data }
}

