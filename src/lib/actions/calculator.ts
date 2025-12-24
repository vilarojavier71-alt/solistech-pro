'use server'

import { prisma } from '@/lib/db'
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
    availableArea?: number
}

// ... (existing imports and interface)

export async function createProjectFromCalculation(
    data: SaveCalculationData,
    customerId: string,
    name: string
) {
    try {
        const sessionUser = await getCurrentUserWithRole()
        if (!sessionUser || !sessionUser.id) {
            return { error: 'No autenticado.' }
        }

        const dbUser = await prisma.user.findUnique({
            where: { id: sessionUser.id },
            select: { organization_id: true }
        })

        const organizationId = dbUser?.organization_id || sessionUser.organizationId
        if (!organizationId) {
            return { error: 'Organización requerida.' }
        }

        // Verify customer belongs to organization
        const customer = await prisma.customer.findUnique({
            where: { id: customerId },
            select: { organization_id: true }
        })

        if (!customer || customer.organization_id !== organizationId) {
            return { error: 'Cliente inválido.' }
        }

        const newProject = await prisma.project.create({
            data: {
                organization_id: organizationId,
                client_id: customerId,
                name: name,
                status: 'quote',
                installation_type: 'residential', // Default, could be mapped if present in data
                system_size_kwp: data.systemSize,
                estimated_production_kwh: data.production,
                estimated_savings: data.savings,
                description: `Proyecto generado desde Calculadora.\nSistema: ${data.panels} paneles.\nProducción estimada: ${data.production} kWh/año.\nROI: ${data.roi}%`,
                location: data.location as any, // Cast JSON
                created_by: sessionUser.id
            }
        })

        revalidatePath('/dashboard/projects')
        return { success: true, projectId: newProject.id }

    } catch (error: any) {
        console.error('Error creating project from calc:', error)
        return { error: error.message || 'Error al crear proyecto' }
    }
}

export async function saveCalculation(data: SaveCalculationData) {
    // ... (existing saveCalculation implementation) 
    try {
        const sessionUser = await getCurrentUserWithRole()
        if (!sessionUser || !sessionUser.id) {
            return { error: 'No autenticado. Por favor inicie sesión.' }
        }

        // Get fresh user data from DB
        const dbUser = await prisma.user.findUnique({
            where: { id: sessionUser.id },
            select: { organization_id: true }
        })

        if (!dbUser) {
            return { error: `Error al validar usuario: Usuario no encontrado en BD` }
        }

        const organizationId = dbUser.organization_id || sessionUser.organizationId
        if (!organizationId) {
            return { error: 'Su usuario no tiene una organización asignada válida.', code: 'ORGANIZATION_REQUIRED' }
        }

        // Validate and limit numeric values
        const safeROI = Math.min(Math.max(data.roi || 0, 0), 9999)

        // Verify organization exists
        const orgExists = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: { id: true }
        })

        if (!orgExists) {
            return { error: 'La organización asignada no es válida.', code: 'ORGANIZATION_REQUIRED' }
        }

        // Create calculation record
        const calculation = await prisma.calculation.create({
            data: {
                organization_id: organizationId,
                system_size_kwp: data.systemSize,
                estimated_production_kwh: data.production,
                estimated_savings: data.savings,
                location: data.location as any,
                components: {
                    panels: { count: data.panels },
                    monthlyProduction: data.monthlyProduction,
                    consumption: data.consumption,
                    roof: { tilt: data.roofTilt, orientation: data.roofOrientation },
                    financials: {
                        roi: data.roi,
                        payback: data.payback,
                        availableArea: data.availableArea
                    }
                } as any,
                pvgis_data: {
                    monthly: data.monthlyProduction
                } as any,
                subsidy_irpf_type: '40' // Default, assumes standard deduction
            }
        })

        return { success: true, id: calculation.id, message: 'Cálculo guardado correctamente' }
    } catch (error: any) {
        console.error('Save calculation error:', error)
        return { error: `Error al guardar cálculo: ${error.message || 'Error desconocido'}` }
    }
}

