
/**
 * Fallback calculation when PVGis is unavailable
 * Exported for testing
 */
export function calculateFallbackProduction(lat: number, orientation: string, tilt: number): number {
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
