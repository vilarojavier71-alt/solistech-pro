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

export async function saveCalculation(data: SaveCalculationData) {
    try {
        const sessionUser = await getCurrentUserWithRole()
        if (!sessionUser || !sessionUser.id) {
            return { error: 'No autenticado. Por favor inicie sesión.' }
        }

        // Get fresh user data from DB
        const dbUser = await prisma.users.findUnique({
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
        const safeAnnualROI = Math.min(Math.max(data.annualROI || 0, 0), 100)

        // Verify organization exists
        const orgExists = await prisma.organizations.findUnique({
            where: { id: organizationId },
            select: { id: true }
        })

        if (!orgExists) {
            return { error: 'La organización asignada no es válida.', code: 'ORGANIZATION_REQUIRED' }
        }

        // Note: 'calculations' table may not exist in current schema
        // For now, we'll log and return success stub
        console.log('[CALCULATOR] Would save calculation:', {
            organizationId,
            systemSize: data.systemSize,
            production: data.production,
            savings: data.savings,
            roi: safeROI
        })

        revalidatePath('/dashboard/calculator')
        return { success: true, message: 'Cálculo procesado (tabla calculations pendiente)' }

    } catch (error: any) {
        console.error('Save calculation error:', error)
        return { error: `Error al guardar cálculo: ${error.message || 'Error desconocido'}` }
    }
}
