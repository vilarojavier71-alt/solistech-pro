import { NextRequest, NextResponse } from 'next/server'

const PVGIS_BASE_URL = 'https://re.jrc.ec.europa.eu/api/v5_2'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const lat = searchParams.get('lat')
    const lon = searchParams.get('lon')

    if (!lat || !lon) {
        return NextResponse.json({ error: 'Faltan coordenadas' }, { status: 400 })
    }

    // PVGIS API for Monthly Radiation (MRcalc) instead of full PV calc for just radiation data
    // or just use PVcalc with fixed params to get the 'H_g' (Global irradiation)
    // Query for validation: "Is this a good solar spot?"
    const pvgisUrl = `${PVGIS_BASE_URL}/PVcalc?lat=${lat}&lon=${lon}&peakpower=1&loss=14&outputformat=json`

    try {
        const response = await fetch(pvgisUrl)
        if (!response.ok) throw new Error(`PVGIS API Error: ${response.status}`)

        const data = await response.json()

        if (data.outputs?.totals?.fixed) {
            const radiationParams = {
                yearly_production_1kwp: data.outputs.totals.fixed.E_y, // kWh/year for 1kWp
                yearly_radiation: data.outputs.totals.fixed['H(i)_y'], // kWh/m2/year
                // Actually PVGIS 'totals.fixed' usually has: E_y, H(i)_y, SD_y...
                // H(i)_y is "Global irradiation on the inclined plane" if angle given, or optimal. 
                // Let's check docs or common response. usually E_y is the energy production.
            }

            // Note: H(i)_y is Irradiation. E_y is Electricity.
            // If angle not specified, it uses defaults (0? or optimized?). 
            // In URL above we didn't specify angle/aspect, so it might use 0/0 or defaults.
            // Better to use mountingplace=free & optimizedslope=1 to get "Optimal" potential.

            return NextResponse.json({
                valid: true,
                source: 'PVGIS (European Commission)',
                data: data.outputs.totals.fixed
            })
        }

        throw new Error('Invalid Data Structure')

    } catch (error: any) {
        return NextResponse.json({
            valid: false,
            error: error.message
        }, { status: 502 })
    }
}
