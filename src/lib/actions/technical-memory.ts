'use server'

import { prisma } from '@/lib/db'
import { getCurrentUserWithRole } from '@/lib/session'
import { renderToBuffer } from '@react-pdf/renderer'
import { TechnicalMemoryPDF } from '@/components/pdf/technical-memory-pdf'

/**
 * Genera la memoria técnica en PDF para un cálculo
 */
export async function generateTechnicalMemory(calculationId: string) {
    try {
        const user = await getCurrentUserWithRole()
        if (!user) {
            return { error: 'No autenticado' }
        }

        // Obtener datos completos del cálculo usando Prisma
        // Note: Using 'as any' because calculations table relations may not be fully generated yet
        const calc = await (prisma.calculations as any).findFirst({
            where: {
                id: calculationId,
                organization_id: user.organizationId || undefined
            }
        }) as any

        if (!calc) {
            return { error: 'Cálculo no encontrado' }
        }

        // Parse JSON fields
        const components = calc.components as any || {}
        const pvgisData = calc.pvgis_data as any || {}
        const location = calc.location as any || {}

        // Validar que tenemos los datos necesarios
        if (!components || !pvgisData) {
            console.warn('Calculation missing components or pvgis_data:', calculationId)
        }

        // Preparar datos para el PDF
        const pdfData = {
            // Datos del proyecto
            projectName: calc.name || 'Instalación Fotovoltaica',
            customerName: 'Cliente',
            customerEmail: '',
            customerPhone: '',
            projectAddress: location?.address || location?.name || 'Dirección no especificada',

            // Datos técnicos
            systemSizeKwp: Number(calc.system_size_kwp) || 0,
            panelCount: components.panels?.count || 0,
            panelModel: components.panels?.model || 'Panel solar 450W',
            panelPowerWp: components.panels?.power || 450,
            inverterModel: components.inverter?.model || 'Inversor híbrido',
            inverterPowerKw: components.inverter?.power || 5,

            // Producción
            annualProductionKwh: Number(calc.estimated_production_kwh) || 0,
            monthlyProduction: pvgisData.monthly || Array(12).fill(0),

            // Ubicación
            latitude: location?.lat || 0,
            longitude: location?.lng || 0,
            roofOrientation: components.roof?.orientation || 'south',
            roofTilt: components.roof?.tilt || 30,

            // Validación de ingeniería
            roofAreaAvailable: components.financials?.availableArea || 0,
            roofAreaRequired: (components.panels?.count || 0) * 2,
            engineeringViable: true,
            engineeringNotes: '',

            // Datos de la organización
            companyName: 'MotorGap',
            companyLogo: undefined,

            // Fecha
            date: new Date().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        }

        // Generar PDF
        const pdfBuffer = await renderToBuffer(
            TechnicalMemoryPDF({ data: pdfData as any })
        )

        // Retornar el buffer directamente (el cliente lo convertirá a Blob)
        return pdfBuffer

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        console.error('Error in generateTechnicalMemory:', error)
        return { error: errorMessage || 'Error desconocido' }
    }
}

/**
 * Calcula el número óptimo de paneles dado un área disponible
 */
export async function calculateOptimalPanels(
    availableAreaM2: number,
    panelAreaM2: number = 2.3,
    safetyMargin: number = 1.2
): Promise<{
    maxPanels: number
    requiredArea: number
    utilizationPercentage: number
}> {
    // Área con margen de seguridad (20% para pasillos y sombras)
    const effectiveArea = availableAreaM2 / safetyMargin

    // Número máximo de paneles
    const maxPanels = Math.floor(effectiveArea / panelAreaM2)

    // Área requerida para esos paneles
    const requiredArea = maxPanels * panelAreaM2 * safetyMargin

    // Porcentaje de utilización del tejado
    const utilizationPercentage = (requiredArea / availableAreaM2) * 100

    return {
        maxPanels,
        requiredArea: Math.round(requiredArea * 10) / 10,
        utilizationPercentage: Math.round(utilizationPercentage)
    }
}

