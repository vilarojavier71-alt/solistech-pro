// PVGIS Service - Solar calculations using EU Commission data

/**
 * PVGIS API Client - Servicio Gratuito de la Comisión Europea
 * https://re.jrc.ec.europa.eu/pvg_tools/en/
 * 
 * Proporciona datos de irradiación solar y producción estimada
 * para cualquier ubicación en Europa, África y Asia.
 * 
 * Usa proxy local para evitar CORS: /api/proxy/pvgis
 */

const PVGIS_API_BASE = '/api/proxy/pvgis'

// Parámetros de entrada para PVGIS
export interface PVGISParams {
    lat: number               // Latitud (-90 a 90)
    lon: number               // Longitud (-180 a 180)
    peakpower: number         // Potencia pico instalada (kWp)
    loss?: number             // Pérdidas del sistema (default 14%)
    angle?: number            // Inclinación paneles (0-90°, default 35° para España)
    aspect?: number           // Azimut (-180 a 180, 0=Sur, -90=Este, 90=Oeste)
    pvtechchoice?: 'crystSi' | 'CIS' | 'CdTe' | 'Unknown'
    mountingplace?: 'free' | 'building'
}

// Respuesta de PVGIS simplificada
export interface PVGISResponse {
    inputs: {
        location: { latitude: number; longitude: number }
        meteo_data: { radiation_db: string; meteo_db: string }
        mounting_system: { fixed: { slope: { value: number }; azimuth: { value: number } } }
        pv_module: { technology: string; peak_power: number; system_loss: number }
    }
    outputs: {
        monthly: {
            fixed: Array<{
                month: number
                E_d: number    // Energía diaria media (kWh)
                E_m: number    // Energía mensual (kWh)
                H_i_d: number  // Irradiación diaria media (kWh/m²)
                H_i_m: number  // Irradiación mensual (kWh/m²)
            }>
        }
        totals: {
            fixed: {
                E_d: number   // Producción diaria media anual (kWh)
                E_m: number   // Producción mensual media (kWh)
                E_y: number   // Producción anual total (kWh)
                H_i_d: number // Irradiación diaria media (kWh/m²)
                H_i_m: number // Irradiación mensual media (kWh/m²)
                H_i_y: number // Irradiación anual (kWh/m²)
            }
        }
    }
}

// Resultado procesado para la UI
export interface SolarCalculationResult {
    annualProductionKWh: number
    monthlyProductionKWh: number
    dailyProductionKWh: number
    annualIrradiationKWhM2: number
    monthlyData: Array<{
        month: string
        production: number
        irradiation: number
    }>
    systemLoss: number
    panelTilt: number
    panelAzimuth: number
    location: { lat: number; lon: number }
}

const MONTHS_ES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

/**
 * Calcula la producción solar usando PVGIS API
 */
export async function calculateSolarProduction(params: PVGISParams): Promise<{
    success: boolean
    data?: SolarCalculationResult
    error?: string
}> {
    try {
        // Construir query params independientemente para evitar error con ruta relativa
        const queryParams = new URLSearchParams()

        // Parámetros obligatorios
        queryParams.set('lat', params.lat.toString())
        queryParams.set('lon', params.lon.toString())
        queryParams.set('peakpower', params.peakpower.toString())
        queryParams.set('outputformat', 'json')

        // Parámetros opcionales con defaults para España
        queryParams.set('loss', (params.loss ?? 14).toString())
        queryParams.set('angle', (params.angle ?? 35).toString())      // 35° óptimo España
        queryParams.set('aspect', (params.aspect ?? 0).toString())     // 0 = Sur
        queryParams.set('pvtechchoice', params.pvtechchoice ?? 'crystSi')
        queryParams.set('mountingplace', params.mountingplace ?? 'building')

        const fetchUrl = `${PVGIS_API_BASE}/PVcalc?${queryParams.toString()}`
        console.log('[PVGIS] Fetching:', fetchUrl)

        const response = await fetch(fetchUrl, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 86400 } // Cache 24h
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('[PVGIS] Error:', response.status, errorText)

            if (response.status === 400) {
                return { success: false, error: 'Ubicación fuera de cobertura PVGIS' }
            }
            return { success: false, error: `Error PVGIS: ${response.status}` }
        }

        const pvgisData: PVGISResponse = await response.json()

        // Transformar respuesta
        const result: SolarCalculationResult = {
            annualProductionKWh: Math.round(pvgisData.outputs.totals.fixed.E_y),
            monthlyProductionKWh: Math.round(pvgisData.outputs.totals.fixed.E_m),
            dailyProductionKWh: Math.round(pvgisData.outputs.totals.fixed.E_d * 10) / 10,
            annualIrradiationKWhM2: Math.round(pvgisData.outputs.totals.fixed.H_i_y),
            monthlyData: pvgisData.outputs.monthly.fixed.map((m, i) => ({
                month: MONTHS_ES[i],
                production: Math.round(m.E_m),
                irradiation: Math.round(m.H_i_m * 10) / 10
            })),
            systemLoss: pvgisData.inputs.pv_module.system_loss,
            panelTilt: pvgisData.inputs.mounting_system.fixed.slope.value,
            panelAzimuth: pvgisData.inputs.mounting_system.fixed.azimuth.value,
            location: {
                lat: pvgisData.inputs.location.latitude,
                lon: pvgisData.inputs.location.longitude
            }
        }

        return { success: true, data: result }

    } catch (error) {
        console.error('[PVGIS] Exception:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        }
    }
}

/**
 * Constantes para cálculos solares en España
 */
export const SOLAR_CONSTANTS = {
    PANEL_AREA_M2: 2.0,           // Área típica de un panel (m²)
    PANEL_POWER_KWP: 0.4,         // Potencia típica por panel (kWp)
    ELECTRICITY_PRICE_EUR: 0.18,  // Precio medio luz España 2024 (€/kWh)
    INSTALLATION_COST_PER_KWP: 1200, // Coste instalación €/kWp
    PANEL_EFFICIENCY: 0.20,       // Eficiencia típica (20%)
    SYSTEM_LOSSES: 14,            // Pérdidas típicas sistema (14%)
    OPTIMAL_TILT_SPAIN: 35,       // Inclinación óptima España (°)
    OPTIMAL_AZIMUTH_SOUTH: 0,     // Azimut óptimo = Sur
}

/**
 * Calcula número de paneles y potencia a partir del área
 */
export function calculatePanelsFromArea(areaM2: number): {
    numPanels: number
    totalKWp: number
    estimatedCost: number
} {
    const numPanels = Math.floor(areaM2 / SOLAR_CONSTANTS.PANEL_AREA_M2)
    const totalKWp = numPanels * SOLAR_CONSTANTS.PANEL_POWER_KWP
    const estimatedCost = totalKWp * SOLAR_CONSTANTS.INSTALLATION_COST_PER_KWP

    return { numPanels, totalKWp, estimatedCost }
}

/**
 * Calcula ROI y tiempo de amortización
 */
export function calculateROI(annualProductionKWh: number, installationCost: number): {
    annualSavingsEur: number
    paybackYears: number
    roi25Years: number
    co2OffsetKg: number
} {
    const annualSavingsEur = annualProductionKWh * SOLAR_CONSTANTS.ELECTRICITY_PRICE_EUR
    const paybackYears = installationCost / annualSavingsEur
    const roi25Years = (annualSavingsEur * 25) - installationCost
    const co2OffsetKg = annualProductionKWh * 0.4 // 0.4 kg CO2/kWh en España

    return {
        annualSavingsEur: Math.round(annualSavingsEur),
        paybackYears: Math.round(paybackYears * 10) / 10,
        roi25Years: Math.round(roi25Years),
        co2OffsetKg: Math.round(co2OffsetKg)
    }
}
