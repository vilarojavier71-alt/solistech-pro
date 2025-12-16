/**
 * ROI Calculator - Motor de cálculo de retorno de inversión
 * Incluye deducciones fiscales IRPF, bonificaciones IBI/ICIO
 * 
 * Base Legal:
 * - IRPF: Real Decreto-ley 19/2021 + Ley 35/2006
 * - IBI/ICIO: Ordenanzas municipales
 */

// ============================================================================
// TIPOS Y CONFIGURACIÓN
// ============================================================================

export type IRPFDeductionType = '20' | '40' | '60'

export interface IRPFConfig {
    percentage: number
    maxAmount: number
    requirement: string
    description: string
}

export const IRPF_DEDUCTIONS: Record<IRPFDeductionType, IRPFConfig> = {
    '20': {
        percentage: 20,
        maxAmount: 5000,
        requirement: 'Reducción de demanda de calefacción/refrigeración ≥7%',
        description: 'Deducción del 20% por mejora de eficiencia energética'
    },
    '40': {
        percentage: 40,
        maxAmount: 7500,
        requirement: 'Reducción de consumo de energía primaria no renovable ≥30%',
        description: 'Deducción del 40% por reducción significativa de consumo'
    },
    '60': {
        percentage: 60,
        maxAmount: 15000,
        requirement: 'Rehabilitación integral del edificio (mejora letra energética)',
        description: 'Deducción del 60% por rehabilitación energética completa'
    }
}

// ============================================================================
// INTERFACES
// ============================================================================

export interface IRPFResult {
    type: IRPFDeductionType
    percentage: number
    amount: number
    maxAmount: number
    requirement: string
    description: string
}

export interface IBIResult {
    percentage: number
    durationYears: number
    annualSavings: number
    totalSavings: number
}

export interface ICIOResult {
    percentage: number
    amount: number
}

export interface ROICalculation {
    // Costes
    totalCost: number

    // Subvenciones
    irpf: IRPFResult
    ibi: IBIResult
    icio: ICIOResult
    totalSubsidies: number
    netCost: number

    // Ahorros
    annualElectricitySavings: number

    // Rentabilidad
    annualROI: number // Porcentaje de retorno anual
    roi25Years: number
    totalSavings25Years: number
}

// ============================================================================
// FUNCIONES DE CÁLCULO
// ============================================================================

/**
 * Calcula la deducción IRPF según el tipo
 */
export function calculateIRPF(
    totalCost: number,
    type: IRPFDeductionType
): IRPFResult {
    const config = IRPF_DEDUCTIONS[type]
    const amount = Math.min(
        totalCost * (config.percentage / 100),
        config.maxAmount
    )

    return {
        type,
        percentage: config.percentage,
        amount: Math.round(amount),
        maxAmount: config.maxAmount,
        requirement: config.requirement,
        description: config.description
    }
}

/**
 * Calcula la bonificación IBI (Impuesto sobre Bienes Inmuebles)
 * 
 * Fórmula:
 * 1. Valor catastral ≈ 70% del coste del proyecto
 * 2. IBI anual = Valor catastral × 0.7% (tasa media)
 * 3. Ahorro anual = IBI anual × (bonificación % / 100)
 * 4. Ahorro total = Ahorro anual × años de bonificación
 */
export function calculateIBI(
    projectCost: number,
    ibiPercentage: number,
    durationYears: number
): IBIResult {
    // Valor catastral aproximado (70% del coste del proyecto)
    const catastralValue = projectCost * 0.7

    // IBI típico: 0.4% - 1.1% del valor catastral (media: 0.7%)
    const averageIBIRate = 0.007
    const annualIBI = catastralValue * averageIBIRate

    // Bonificación municipal
    const annualSavings = annualIBI * (ibiPercentage / 100)
    const totalSavings = annualSavings * durationYears

    return {
        percentage: ibiPercentage,
        durationYears,
        annualSavings: Math.round(annualSavings),
        totalSavings: Math.round(totalSavings)
    }
}

/**
 * Calcula la bonificación ICIO (Impuesto sobre Construcciones)
 * 
 * Fórmula:
 * 1. ICIO típico = 2-4% del presupuesto de obra (media: 3%)
 * 2. Ahorro = ICIO × (bonificación % / 100)
 */
export function calculateICIO(
    projectCost: number,
    icioPercentage: number
): ICIOResult {
    // ICIO típico: 2% - 4% del presupuesto (media: 3%)
    const averageICIORate = 0.03
    const icioAmount = projectCost * averageICIORate

    // Bonificación municipal
    const amount = icioAmount * (icioPercentage / 100)

    return {
        percentage: icioPercentage,
        amount: Math.round(amount)
    }
}

/**
 * Calcula el ROI completo con todas las subvenciones
 * 
 * @param totalCost - Coste total del proyecto (€)
 * @param irpfType - Tipo de deducción IRPF ('20', '40', '60')
 * @param ibiPercentage - Porcentaje de bonificación IBI (0-100)
 * @param ibiDuration - Años de bonificación IBI
 * @param icioPercentage - Porcentaje de bonificación ICIO (0-100)
 * @param annualElectricitySavings - Ahorro anual en factura eléctrica (€/año)
 * @returns Cálculo completo de ROI
 */
export function calculateROI(
    totalCost: number,
    irpfType: IRPFDeductionType,
    ibiPercentage: number,
    ibiDuration: number,
    icioPercentage: number,
    annualElectricitySavings: number
): ROICalculation {
    // Calcular subvenciones
    const irpf = calculateIRPF(totalCost, irpfType)
    const ibi = calculateIBI(totalCost, ibiPercentage, ibiDuration)
    const icio = calculateICIO(totalCost, icioPercentage)

    // Total de subvenciones
    const totalSubsidies = irpf.amount + ibi.totalSavings + icio.amount
    const netCost = totalCost - totalSubsidies

    // Cálculo de rentabilidad anual y ROI a 25 años
    const annualROI = (annualElectricitySavings / netCost) * 100
    const totalSavings25Years = (annualElectricitySavings * 25) - netCost
    const roi25Years = (totalSavings25Years / netCost) * 100

    return {
        totalCost: Math.round(totalCost),
        irpf,
        ibi,
        icio,
        totalSubsidies: Math.round(totalSubsidies),
        netCost: Math.round(netCost),
        annualElectricitySavings: Math.round(annualElectricitySavings),
        annualROI: Math.round(annualROI * 10) / 10, // 1 decimal
        roi25Years: Math.round(roi25Years * 100) / 100, // 2 decimales
        totalSavings25Years: Math.round(totalSavings25Years)
    }
}

/**
 * Determina automáticamente el tipo de deducción IRPF óptimo
 * basándose en el tamaño del sistema
 * 
 * Criterios:
 * - 60%: Sistemas >10kWp (rehabilitación integral)
 * - 40%: Sistemas 5-10kWp (reducción ≥30%)
 * - 20%: Sistemas <5kWp (mejora básica)
 */
export function suggestIRPFType(systemSizeKwp: number): IRPFDeductionType {
    if (systemSizeKwp >= 10) return '60'
    if (systemSizeKwp >= 5) return '40'
    return '20'
}

/**
 * Valida que los datos de entrada sean correctos
 */
export function validateROIInputs(
    totalCost: number,
    annualElectricitySavings: number
): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (totalCost <= 0) {
        errors.push('El coste total debe ser mayor que 0')
    }

    if (annualElectricitySavings <= 0) {
        errors.push('El ahorro anual debe ser mayor que 0')
    }

    if (annualElectricitySavings > totalCost) {
        errors.push('El ahorro anual no puede ser mayor que el coste total')
    }

    return {
        valid: errors.length === 0,
        errors
    }
}
