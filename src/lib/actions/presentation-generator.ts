'use server'

import { prisma } from '@/lib/db'
import { getCurrentUserWithRole } from '@/lib/session'
import { generatePresentation, type PresentationData } from '@/lib/powerpoint/generator'
import { generateSolarSimulation } from './ai-generation'
import { generatePresentationText } from './ai-text-generation'

async function getPresentationContext() {
    const user = await getCurrentUserWithRole()
    if (!user || !user.id) throw new Error('Usuario no autenticado')

    const profile = await prisma.user.findUnique({
        where: { id: user.id },
        select: { organization_id: true }
    })

    if (!profile?.organization_id) throw new Error('Usuario sin organización')

    return { user, organizationId: profile.organization_id }
}

export async function createPresentation(
    customerId: string,
    projectId: string | undefined, // Optional
    calculationId: string,
    originalPhotoUrl?: string
) {
    try {
        const { user, organizationId } = await getPresentationContext()

        // Get calculation data
        const calc = await prisma.calculations.findUnique({
            where: { id: calculationId },
            include: {
                organization: true,
                project: {
                    include: { customer: true }
                }
            }
        })

        if (!calc) return { error: 'Cálculo no encontrado' }
        if (calc.organization_id !== organizationId) {
            return { error: 'No tienes permiso para acceder a este cálculo' }
        }

        // Generate AI simulation if photo provided
        let simulatedPhotoUrl: string | undefined
        if (originalPhotoUrl) {
            try {
                const aiResult = await generateSolarSimulation(organizationId, {
                    originalPhotoUrl,
                    systemSizeKwp: Number(calc.system_size_kwp || 0),
                    panelCount: (calc.components as any)?.panels?.count || 0
                })
                if (aiResult.success && aiResult.imageUrl) {
                    simulatedPhotoUrl = aiResult.imageUrl
                }
            } catch (aiError) {
                console.error('AI Generation Warning:', aiError)
            }
        }

        const fiscalDeductionType = (calc as any).subsidy_irpf_type || '40'

        // Create presentation record
        const presentation = await prisma.presentations.create({
            data: {
                organization_id: organizationId,
                customer_id: customerId,
                project_id: projectId,
                title: `Propuesta Solar - ${calc.project?.customer?.name || 'Cliente'}`,
                status: 'generating',
                original_photo_url: originalPhotoUrl || null,
                simulated_photo_url: simulatedPhotoUrl || null,
                fiscal_deduction_type: fiscalDeductionType
            }
        })

        // Prepare PowerPoint data
        const components = calc.components as any || {}
        const pvgisData = (calc as any).pvgis_data || {}

        // Generate AI Text Content
        let aiTextContent = {
            executiveSummary: undefined,
            environmentalImpact: undefined,
            financialAnalysis: undefined,
            technicalDetails: undefined
        } as any

        try {
            console.log('[PRESENTATION] Generating AI text content...')
            aiTextContent = await generatePresentationText(organizationId, {
                customerName: calc.project?.customer?.name || 'Cliente',
                systemSize: Number(calc.system_size_kwp || 0),
                production: Number(calc.estimated_production_kwh || 0),
                savings: Number(calc.estimated_savings || 0),
                roi: (calc.components as any)?.financials?.roi || 0,
                location: (calc.location as any)?.name || 'Ubicación'
            })
        } catch (textError) {
            console.error('AI Text Gen Error:', textError)
        }

        const presentationData: PresentationData = {
            customerName: calc.project?.customer?.name || 'Cliente',
            customerEmail: calc.project?.customer?.email || '',
            projectAddress: (calc.location as any)?.address || 'Dirección no especificada',
            systemSizeKwp: Number(calc.system_size_kwp || 0),
            panelCount: components.panels?.count || 0,
            panelModel: components.panels?.model || 'Panel solar estándar',
            inverterModel: components.inverter?.model || 'Inversor estándar',
            annualProductionKwh: Number(calc.estimated_production_kwh || 0),
            monthlyProduction: pvgisData.monthly || Array(12).fill(0),
            currentBillEuros: components.current_bill || 100,
            estimatedSavings: Number((calc as any).estimated_savings || 0),
            totalCost: components.total_cost || 0,
            fiscalDeductionType: fiscalDeductionType as '20' | '40' | '60',
            simulatedPhotoUrl,
            companyName: calc.organization?.name || 'MotorGap',
            companyLogo: calc.organization?.logo_url || undefined,
            // AI Content
            executiveSummary: aiTextContent.executiveSummary,
            environmentalImpact: aiTextContent.environmentalImpact,
            financialAnalysis: aiTextContent.financialAnalysis,
            technicalDetails: aiTextContent.technicalDetails
        }

        // Generate PowerPoint
        let pptxBuffer: Buffer
        try {
            pptxBuffer = await generatePresentation(presentationData)
        } catch (genError: any) {
            await prisma.presentations.update({
                where: { id: presentation.id },
                data: { status: 'failed' }
            })
            return { error: `Error al generar PowerPoint: ${genError.message}` }
        }

        // Note: File upload to storage needs to be implemented separately
        // For now, store base64 or return buffer
        console.log(`[PRESENTATION] Generated ${pptxBuffer.length} bytes for presentation ${presentation.id}`)

        await prisma.presentations.update({
            where: { id: presentation.id },
            data: {
                status: 'completed',
                updated_at: new Date()
            }
        })

        return {
            success: true,
            presentationId: presentation.id,
            hasSimulatedImage: !!simulatedPhotoUrl,
            buffer: pptxBuffer.toString('base64')
        }

    } catch (error: any) {
        console.error('Error in createPresentation:', error)
        return { error: error.message || 'Error desconocido' }
    }
}

export async function getOrganizationPresentations() {
    try {
        const { organizationId } = await getPresentationContext()

        const presentations = await prisma.presentations.findMany({
            where: { organization_id: organizationId },
            include: {
                customer: { select: { name: true, email: true } },
                project: { select: { name: true } }
            },
            orderBy: { created_at: 'desc' }
        })

        return { data: presentations }
    } catch (error: any) {
        return { error: error.message || 'Error de autenticación' }
    }
}

export async function markPresentationAsSent(presentationId: string, sentToEmail: string) {
    try {
        await prisma.presentations.update({
            where: { id: presentationId },
            data: {
                status: 'sent',
                // sent_at: new Date(),
                // sent_to_email: sentToEmail
            }
        })
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function deletePresentation(presentationId: string) {
    try {
        await prisma.presentations.delete({
            where: { id: presentationId }
        })
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}
