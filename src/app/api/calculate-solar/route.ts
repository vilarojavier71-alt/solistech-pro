import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUserWithRole } from '@/lib/session'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { calculateFallbackProduction } from '@/lib/solar/utils'

// Constants for calculations
const PANEL_POWER = 550 // Watts per panel (modern high-efficiency panel)
const ELECTRICITY_PRICE = 0.25 // EUR per kWh (average Spain)
const SYSTEM_COST_PER_KW = 1200 // EUR per kWp installed
const PVGIS_BASE_URL = 'https://re.jrc.ec.europa.eu/api/v5_2'
const ALLOWED_PVGIS_HOST = 're.jrc.ec.europa.eu'

// Zod schema para validación estricta
const CalculationRequestSchema = z.object({
    consumption: z.number().positive().max(1000000, 'Consumo excesivo'),
    installationType: z.enum(['residential', 'commercial', 'industrial']),
    location: z.object({
        lat: z.number().min(-90).max(90, 'Latitud inválida'),
        lng: z.number().min(-180).max(180, 'Longitud inválida')
    }),
    roofOrientation: z.enum(['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest']),
    roofTilt: z.number().min(0).max(90, 'Inclinación inválida')
})

type CalculationRequest = z.infer<typeof CalculationRequestSchema>

// Orientation to azimuth mapping
const ORIENTATION_MAP: Record<string, number> = {
    north: 0,
    northeast: 45,
    east: 90,
    southeast: 135,
    south: 180, // Optimal in Northern Hemisphere
    southwest: 225,
    west: 270,
    northwest: 315
}

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUserWithRole()
        if (!user || !user.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify Subscription with Prisma
        const org = await prisma.organization.findUnique({
            where: { id: user.organizationId },
            select: { subscription_plan: true, is_god_mode: true }
        })

        const isPro = org?.subscription_plan === 'pro' || org?.is_god_mode
        if (!isPro) {
            return NextResponse.json(
                {
                    error: 'UPGRADE_REQUIRED',
                    message: 'La calculadora solar está disponible solo para planes PRO.'
                },
                { status: 403 }
            )
        }

        // Validar payload con Zod
        const rawBody = await request.json()
        const validationResult = CalculationRequestSchema.safeParse(rawBody)

        if (!validationResult.success) {
            logger.warn('Invalid calculation request', {
                source: 'calculate-solar',
                action: 'validation_error',
                errors: (validationResult.error as any).errors
            })
            return NextResponse.json(
                { error: 'Datos inválidos', details: (validationResult.error as any).errors },
                { status: 400 }
            )
        }

        const { consumption, location, roofOrientation, roofTilt } = validationResult.data

        // Convert orientation to azimuth
        const azimuth = ORIENTATION_MAP[roofOrientation] || 180

        // SSRF Protection: Validar que la URL solo apunte a PVGIS oficial
        const pvgisUrl = `${PVGIS_BASE_URL}/PVcalc?lat=${location.lat}&lon=${location.lng}&peakpower=1&loss=14&angle=${roofTilt}&aspect=${azimuth}&outputformat=json`

        // Validar hostname antes de hacer fetch
        try {
            const urlObj = new URL(pvgisUrl)
            if (urlObj.hostname !== ALLOWED_PVGIS_HOST) {
                logger.error('SSRF attempt detected', {
                    source: 'calculate-solar',
                    action: 'ssrf_blocked',
                    attemptedHost: urlObj.hostname,
                    userId: user.id
                })
                throw new Error('URL no permitida')
            }
        } catch (urlError) {
            logger.error('Invalid URL construction', {
                source: 'calculate-solar',
                action: 'url_validation_error',
                error: urlError instanceof Error ? urlError.message : 'Unknown'
            })
            throw new Error('URL inválida')
        }

        let annualProduction = 0
        let monthlyData: number[] = []

        try {
            const pvgisResponse = await fetch(pvgisUrl)
            const pvgisData = await pvgisResponse.json()

            if (pvgisData.outputs?.totals?.fixed) {
                // Annual production per kWp
                annualProduction = pvgisData.outputs.totals.fixed.E_y
                // Monthly production
                monthlyData = pvgisData.outputs.monthly?.fixed?.map((m: any) => m.E_m) || []
            } else {
                throw new Error('Invalid PVGis response')
            }
        } catch (pvgisError) {
            // Fallback to estimation if PVGis fails
            logger.warn('PVGis API failed, using fallback calculation', {
                source: 'calculate-solar',
                action: 'pvgis_fallback',
                error: pvgisError instanceof Error ? pvgisError.message : 'Unknown error',
                location: { lat: location.lat, lng: location.lng }
            })
            annualProduction = calculateFallbackProduction(location.lat, roofOrientation, roofTilt)
        }

        // Validar que annualProduction sea válido antes de calcular
        if (annualProduction <= 0 || !isFinite(annualProduction)) {
            logger.warn('Invalid annual production', {
                source: 'calculate-solar',
                action: 'invalid_production',
                annualProduction
            })
            annualProduction = calculateFallbackProduction(location.lat, roofOrientation, roofTilt)
        }

        // Calculate optimal system size (proteger contra división por cero)
        const systemSize = annualProduction > 0
            ? Math.ceil((consumption / annualProduction) * 10) / 10
            : Math.ceil((consumption / 1400) * 10) / 10 // Fallback a 1400 kWh/kWp/año

        // Validar que systemSize sea razonable
        if (systemSize <= 0 || systemSize > 10000) {
            throw new Error('Tamaño de sistema inválido')
        }

        // Calculate actual production with the sized system
        const totalProduction = Math.round(annualProduction * systemSize)

        // Calculate number of panels
        const panels = Math.ceil((systemSize * 1000) / PANEL_POWER)

        // Financial calculations (proteger contra valores inválidos)
        const annualSavings = Math.max(0, Math.round(totalProduction * ELECTRICITY_PRICE))
        const systemCost = Math.max(0, systemSize * SYSTEM_COST_PER_KW * 1000)

        // Cambio: ROI Anual en lugar de Payback (proteger contra división por cero)
        const annualROI = systemCost > 0
            ? Math.round((annualSavings / systemCost) * 100 * 10) / 10
            : 0
        const roi = annualROI

        return NextResponse.json({
            systemSize,
            panels,
            production: totalProduction,
            savings: annualSavings,
            roi,
            annualROI: annualROI,
            monthlyProduction: monthlyData.map(m => Math.round(m * systemSize))
        })

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        logger.error('Calculation error', {
            source: 'calculate-solar',
            action: 'calculation_error',
            error: errorMessage,
            stack: error instanceof Error ? error.stack : undefined
        })
        return NextResponse.json(
            { error: 'Error al calcular la instalación', message: errorMessage },
            { status: 500 }
        )
    }

}

// Fallback calculation when PVGis is unavailable
// Exported for testing
// Fallback calculation moved to @/lib/solar/utils
