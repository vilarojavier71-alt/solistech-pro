import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Constants for calculations
const PANEL_POWER = 550 // Watts per panel (modern high-efficiency panel)
const ELECTRICITY_PRICE = 0.25 // EUR per kWh (average Spain)
const SYSTEM_COST_PER_KW = 1200 // EUR per kWp installed
const PVGIS_BASE_URL = 'https://re.jrc.ec.europa.eu/api/v5_2'

interface CalculationRequest {
    consumption: number
    installationType: string
    location: {
        lat: number
        lng: number
    }
    roofOrientation: string
    roofTilt: number
}

import { getCurrentUserWithRole } from '@/lib/session'

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
        const org = await prisma.organizations.findUnique({
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

        const body: CalculationRequest = await request.json()
        const { consumption, location, roofOrientation, roofTilt } = body

        // Convert orientation to azimuth
        const azimuth = ORIENTATION_MAP[roofOrientation] || 180

        // Call PVGis API for real production data
        const pvgisUrl = `${PVGIS_BASE_URL}/PVcalc?lat=${location.lat}&lon=${location.lng}&peakpower=1&loss=14&angle=${roofTilt}&aspect=${azimuth}&outputformat=json`

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
            console.warn('PVGis API failed, using fallback calculation:', pvgisError)
            annualProduction = calculateFallbackProduction(location.lat, roofOrientation, roofTilt)
        }

        // Calculate optimal system size
        const systemSize = Math.ceil((consumption / annualProduction) * 10) / 10 // Round to 0.1 kWp

        // Calculate actual production with the sized system
        const totalProduction = Math.round(annualProduction * systemSize)

        // Calculate number of panels
        const panels = Math.ceil((systemSize * 1000) / PANEL_POWER)

        // Financial calculations
        const annualSavings = Math.round(totalProduction * ELECTRICITY_PRICE)
        const systemCost = systemSize * SYSTEM_COST_PER_KW * 1000

        // Cambio: ROI Anual en lugar de Payback
        const annualROI = Math.round((annualSavings / systemCost) * 100 * 10) / 10
        const roi = Math.round((annualSavings / systemCost) * 100 * 10) / 10

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
        console.error('Calculation error:', error)
        return NextResponse.json(
            { error: 'Error al calcular la instalación' },
            { status: 500 }
        )
    }

}

// Fallback calculation when PVGis is unavailable
function calculateFallbackProduction(lat: number, orientation: string, tilt: number): number {
    // Base production in Spain (average kWh/kWp/year)
    let baseProduction = 1400

    // Adjust for latitude (better in south)
    if (lat < 37) baseProduction += 200 // Southern Spain
    else if (lat > 42) baseProduction -= 150 // Northern Spain

    // Adjust for orientation
    if (orientation === 'south') baseProduction *= 1.0
    else if (orientation === 'southeast' || orientation === 'southwest') baseProduction *= 0.95
    else if (orientation === 'east' || orientation === 'west') baseProduction *= 0.85
    else baseProduction *= 0.7 // North or poor orientations

    // Adjust for tilt (30° is optimal in Spain)
    const tiltFactor = 1 - Math.abs(tilt - 30) * 0.005
    baseProduction *= tiltFactor

    return Math.round(baseProduction)
}
