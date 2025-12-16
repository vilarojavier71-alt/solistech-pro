'use server'

import { getCurrentUserWithRole } from '@/lib/session'
import { renderToBuffer } from '@react-pdf/renderer'
import { TechnicalMemoryPDF } from '@/components/pdf/technical-memory-pdf'

/**
 * Genera la memoria técnica en PDF para un cálculo
 */
export async function generateTechnicalMemory(calculationId: string) {
    const supabase = await createClient()

    try {
        // Obtener datos completos del cálculo
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

        // Validar que tenemos los datos necesarios
        if (!calc.components || !calc.pvgis_data) {
            return { error: 'El cálculo no tiene datos completos' }
        }

        // Preparar datos para el PDF
        const pdfData = {
            // Datos del proyecto
            projectName: calc.project?.name || 'Instalación Fotovoltaica',
            customerName: calc.project?.customer?.full_name || 'Cliente',
            customerEmail: calc.project?.customer?.email || '',
            customerPhone: calc.project?.customer?.phone || '',
            projectAddress: calc.location?.address || 'Dirección no especificada',

            // Datos técnicos
            systemSizeKwp: calc.system_size_kwp || 0,
            panelCount: calc.components.panels?.count || 0,
            panelModel: calc.components.panels?.model || 'Panel solar 450W',
            panelPowerWp: calc.components.panels?.power || 450,
            inverterModel: calc.components.inverter?.model || 'Inversor híbrido',
            inverterPowerKw: calc.components.inverter?.power || 5,

            // Producción
            annualProductionKwh: calc.estimated_production_kwh || 0,
            monthlyProduction: calc.pvgis_data.monthly || Array(12).fill(0),

            // Ubicación
            latitude: calc.location?.lat || 0,
            longitude: calc.location?.lng || 0,
            roofOrientation: calc.roof_orientation || 'south',
            roofTilt: calc.roof_tilt || 30,

            // Validación de ingeniería
            roofAreaAvailable: calc.roof_area_available || 0,
            roofAreaRequired: calc.roof_area_required || 0,
            engineeringViable: calc.engineering_viable !== false,
            engineeringNotes: calc.engineering_notes || '',

            // Datos de la organización
            companyName: calc.organization?.name || 'SolisTech',
            companyLogo: calc.organization?.logo_url,

            // Fecha
            date: new Date().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        }

        // Generar PDF
        const pdfBuffer = await renderToBuffer(
            TechnicalMemoryPDF(pdfData)
        )

        // Subir a Supabase Storage
        const fileName = `memoria-tecnica-${calculationId}.pdf`
        const { error: uploadError } = await supabase.storage
            .from('technical-memories')
            .upload(fileName, pdfBuffer, {
                contentType: 'application/pdf',
                upsert: true
            })

        if (uploadError) {
            console.error('Error uploading PDF:', uploadError)
            return { error: 'Error al subir el PDF' }
        }

        // Obtener URL pública
        const { data: { publicUrl } } = supabase.storage
            .from('technical-memories')
            .getPublicUrl(fileName)

        return {
            success: true,
            url: publicUrl,
            fileName
        }

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

