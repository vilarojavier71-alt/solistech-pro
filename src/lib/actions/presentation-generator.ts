'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUserWithRole } from '@/lib/session'
import { generatePresentation, type PresentationData } from '@/lib/powerpoint/generator'
import { generateSolarSimulation } from './ai-generation'

// HELPER: Robust Context Retrieval
async function getPresentationContext() {
    const user = await getCurrentUserWithRole()
    if (!user || !user.id) throw new Error('Usuario no autenticado (Sesión inválida)')

    const supabase = createAdminClient()

    // Using Admin Client to get org_id reliable
    const { data: profile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single()

    if (!profile?.organization_id) throw new Error('Usuario sin organización asignada en BD.')

    return { supabase, user, organizationId: profile.organization_id }
}


/**
 * Crea una presentación PowerPoint completa para un cliente
 * Incluye generación de imagen simulada con IA (opcional)
 */
export async function createPresentation(
    customerId: string,
    projectId: string,
    calculationId: string,
    originalPhotoUrl?: string
) {
    try {
        const { supabase, user, organizationId } = await getPresentationContext()

        // 1. Obtener datos completos del cálculo
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

        // Security Check: Org Match
        if (calc.organization_id !== organizationId) {
            return { error: 'No tienes permiso para acceder a este cálculo.' }
        }

        // 2. Validar que tenemos los datos necesarios
        if (!calc.components || !calc.pvgis_data) {
            return { error: 'El cálculo no tiene datos completos. Regenera el cálculo primero.' }
        }

        // 3. Generar imagen simulada con IA (OPCIONAL - solo si hay foto Y API key)
        let simulatedPhotoUrl: string | undefined = undefined
        // let aiGenerationAttempted = false

        if (originalPhotoUrl) {
            try {
                // aiGenerationAttempted = true
                const aiResult = await generateSolarSimulation(organizationId, {
                    originalPhotoUrl,
                    systemSizeKwp: calc.system_size_kwp || 0,
                    panelCount: calc.components.panels?.count || 0
                })

                if (aiResult.success && aiResult.imageUrl) {
                    simulatedPhotoUrl = aiResult.imageUrl
                }
            } catch (aiError) {
                // Error en IA - continuar sin imagen simulada
                console.error('AI Generation Warning:', aiError)
            }
        }

        // 4. Determinar tipo de deducción fiscal
        const fiscalDeductionType = calc.subsidy_irpf_type || '40'

        // 5. Crear registro de presentación en BD
        const { data: presentation, error: presentationError } = await supabase
            .from('presentations')
            .insert({
                organization_id: organizationId,
                customer_id: customerId,
                project_id: projectId,
                title: `Propuesta Solar - ${calc.project.customer.name}`,
                status: 'generating',
                original_photo_url: originalPhotoUrl,
                simulated_photo_url: simulatedPhotoUrl,
                fiscal_deduction_type: fiscalDeductionType
            })
            .select()
            .single()

        if (presentationError || !presentation) {
            return { error: 'Error al crear el registro de presentación' }
        }

        // 6. Preparar datos para el generador de PowerPoint
        const presentationData: PresentationData = {
            customerName: calc.project.customer.name,
            customerEmail: calc.project.customer.email,
            projectAddress: calc.location?.address || 'Dirección no especificada',
            systemSizeKwp: calc.system_size_kwp || 0,
            panelCount: calc.components.panels?.count || 0,
            panelModel: calc.components.panels?.model || 'Panel solar estándar',
            inverterModel: calc.components.inverter?.model || 'Inversor estándar',
            annualProductionKwh: calc.estimated_production_kwh || 0,
            monthlyProduction: calc.pvgis_data.monthly || Array(12).fill(0),
            currentBillEuros: calc.components.current_bill || 100,
            estimatedSavings: calc.estimated_savings || 0,
            totalCost: calc.components.total_cost || 0,
            fiscalDeductionType: fiscalDeductionType as '20' | '40' | '60',

            // Subvenciones adicionales (si existen en el cálculo)
            ibiPercentage: calc.subsidy_ibi_percentage || undefined,
            ibiDurationYears: calc.subsidy_ibi_duration_years || undefined,
            ibiTotalSavings: calc.subsidy_ibi_total || undefined,
            icioPercentage: calc.subsidy_icio_percentage || undefined,
            icioSavings: calc.subsidy_icio_amount || undefined,
            totalSubsidies: calc.total_subsidies || undefined,
            netCost: calc.net_cost || undefined,

            simulatedPhotoUrl,
            companyName: calc.organization.name,
            companyLogo: calc.organization.logo_url
        }

        // 7. Generar PowerPoint
        let pptxBuffer: Buffer
        try {
            pptxBuffer = await generatePresentation(presentationData)
        } catch (genError: any) {
            // Actualizar estado a error
            await supabase
                .from('presentations')
                .update({
                    status: 'error',
                    generation_error: genError.message
                })
                .eq('id', presentation.id)

            return { error: `Error al generar PowerPoint: ${genError.message}` }
        }

        // 8. Subir a Supabase Storage
        const fileName = `${presentation.id}.pptx`
        const { error: uploadError } = await supabase.storage
            .from('presentations')
            .upload(fileName, pptxBuffer, {
                contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                upsert: true
            })

        if (uploadError) {
            await supabase
                .from('presentations')
                .update({
                    status: 'error',
                    generation_error: `Error al subir archivo: ${uploadError.message}`
                })
                .eq('id', presentation.id)

            return { error: `Error al subir presentación: ${uploadError.message}` }
        }

        // 9. Obtener URL pública
        const { data: { publicUrl } } = supabase.storage
            .from('presentations')
            .getPublicUrl(fileName)

        // 10. Actualizar presentación con URL y estado
        const { error: updateError } = await supabase
            .from('presentations')
            .update({
                status: 'generated',
                pptx_file_url: publicUrl,
                pptx_file_size: pptxBuffer.length,
                generated_at: new Date().toISOString()
            })
            .eq('id', presentation.id)

        if (updateError) {
            console.error('Error updating presentation:', updateError)
        }

        return {
            success: true,
            presentationId: presentation.id,
            url: publicUrl,
            hasSimulatedImage: !!simulatedPhotoUrl
        }

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        console.error('Error in createPresentation:', error)
        return { error: errorMessage || 'Error desconocido' }
    }
}

/**
 * Obtiene todas las presentaciones de una organización
 */
export async function getOrganizationPresentations() {
    try {
        const { supabase, organizationId } = await getPresentationContext()

        const { data, error } = await supabase
            .from('presentations')
            .select(`
                *,
                customer:customers(name, email),
                project:projects(name)
            `)
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false })

        if (error) {
            return { error: error.message }
        }

        return { data }
    } catch (error: any) {
        return { error: error.message || 'Error de autenticación' }
    }
}

/**
 * Marca una presentación como enviada
 */
export async function markPresentationAsSent(
    presentationId: string,
    sentToEmail: string
) {
    try {
        const { supabase } = await getPresentationContext()

        const { error } = await supabase
            .from('presentations')
            .update({
                status: 'sent',
                sent_at: new Date().toISOString(),
                sent_to_email: sentToEmail
            })
            .eq('id', presentationId)

        if (error) {
            return { error: error.message }
        }

        return { success: true }
    } catch (error: any) {
        return { error: error.message || 'Error de autenticación' }
    }
}

/**
 * Elimina una presentación (archivo y registro)
 */
export async function deletePresentation(presentationId: string) {
    try {
        const { supabase } = await getPresentationContext()

        // Obtener datos de la presentación
        const { data: presentation } = await supabase
            .from('presentations')
            .select('pptx_file_url')
            .eq('id', presentationId)
            .single()

        if (presentation?.pptx_file_url) {
            // Extraer nombre de archivo de la URL
            const fileName = `${presentationId}.pptx`

            // Eliminar de Storage
            await supabase.storage
                .from('presentations')
                .remove([fileName])
        }

        // Eliminar registro de BD
        const { error } = await supabase
            .from('presentations')
            .delete()
            .eq('id', presentationId)

        if (error) {
            return { error: error.message }
        }

        return { success: true }
    } catch (error: any) {
        return { error: error.message || 'Error de autenticación' }
    }
}

