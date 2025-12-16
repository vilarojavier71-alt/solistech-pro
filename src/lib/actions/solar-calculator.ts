'use server'

type CalculationResult = {
    kwp: number
    panelCount: number
    estimatedGeneration: number // kWh/month
    estimatedSavings: number // €/month (approx)
    hspUsed: number
}

// HSP Approximation by region (simplified for MVP)
const HSP_DATA: Record<string, number> = {
    'andalucia': 5.2,
    'aragon': 4.6,
    'asturias': 3.6,
    'baleares': 4.8,
    'canarias': 5.5,
    'cantabria': 3.5,
    'castilla-la-mancha': 5.0,
    'castilla-y-leon': 4.5,
    'cataluna': 4.4,
    'extremadura': 5.1,
    'galicia': 3.8,
    'madrid': 4.8,
    'murcia': 5.3,
    'navarra': 4.1,
    'pais-vasco': 3.6,
    'rioja': 4.2,
    'valencia': 4.9,
    'default': 4.5
}

function getHSP(location: string): number {
    const key = location.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    for (const region of Object.keys(HSP_DATA)) {
        if (key.includes(region)) return HSP_DATA[region]
    }
    return HSP_DATA['default']
}

export async function calculateSystemSize(location: string, monthlyConsumption: number): Promise<CalculationResult> {
    // Artificial delay for realism
    await new Promise(resolve => setTimeout(resolve, 500))

    const hsp = getHSP(location)
    const systemEfficiency = 0.8
    const panelPowerW = 450
    const electricityPrice = 0.15 // €/kWh average

    // Formula: kWp = (Consumption_Monthly / 30 days) / (HSP * efficiency)
    const dailyConsumption = monthlyConsumption / 30
    const requiredKwp = dailyConsumption / (hsp * systemEfficiency)

    // Calculate panels
    const panelCount = Math.ceil((requiredKwp * 1000) / panelPowerW)

    // Real installation size based on panels
    const installedKwp = (panelCount * panelPowerW) / 1000

    // Estimated generation with installed capacity
    const estimatedDailyGeneration = installedKwp * hsp * systemEfficiency
    const estimatedMonthlyGeneration = estimatedDailyGeneration * 30

    return {
        kwp: Number(installedKwp.toFixed(2)),
        panelCount,
        estimatedGeneration: Math.round(estimatedMonthlyGeneration),
        estimatedSavings: Math.round(estimatedMonthlyGeneration * electricityPrice),
        hspUsed: hsp
    }
}
