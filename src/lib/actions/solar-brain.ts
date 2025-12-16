'use server'

import { z } from 'zod'

// Types based on Google Solar API
export interface SolarPotential {
    maxArrayPanelsCount: number
    maxArrayAreaMeters2: number
    maxSunshineHoursPerYear: number
    carbonOffsetFactorKgPerMwh: number
    wholeRoofStats: {
        areaMeters2: number
        sunshineQuantiles: number[]
        groundAreaMeters2: number
    }
    solarPanels: SolarPanelConfig[]
    solarParts: SolarPart[]
    shadowAnalysis?: {
        avgShadingLoss: number
        shadingMapUrl: string
        optimalHours: string
    }
}

export interface SolarPanelConfig {
    center: { latitude: number; longitude: number }
    orientation: 'LANDSCAPE' | 'PORTRAIT'
    segmentIndex: number
    yearlyEnergyDcKwh: number
}

export interface SolarPart {
    segmentIndex: number
    roofSegmentStats: {
        pitchDegrees: number
        azimuthDegrees: number
        stats: {
            areaMeters2: number
            sunshineQuantiles: number[]
        }
    }
}

// Mock Data Generator
export async function analyzeRoof(address: string, lat: number, lng: number): Promise<{ success: boolean; data?: SolarPotential; error?: string }> {
    console.log(`Analyzing roof for ${address} at ${lat}, ${lng}`)

    // Simulate API delay (Optimized for MVP)
    await new Promise(resolve => setTimeout(resolve, 800))

    // Return Mock Data simulating a typical Spanish roof
    const mockData: SolarPotential = {
        maxArrayPanelsCount: 24,
        maxArrayAreaMeters2: 48.5,
        maxSunshineHoursPerYear: 1850,
        carbonOffsetFactorKgPerMwh: 0.4,
        wholeRoofStats: {
            areaMeters2: 120,
            sunshineQuantiles: [800, 1200, 1600, 2100],
            groundAreaMeters2: 110
        },
        solarPanels: Array.from({ length: 12 }).map((_, i) => ({
            center: { latitude: lat + (i * 0.00001), longitude: lng + (i * 0.00001) },
            orientation: 'PORTRAIT',
            segmentIndex: 0,
            yearlyEnergyDcKwh: 550
        })),
        solarParts: [
            {
                segmentIndex: 0,
                roofSegmentStats: {
                    pitchDegrees: 30, // 30 degrees tilt
                    azimuthDegrees: 180, // South facing
                    stats: {
                        areaMeters2: 60,
                        sunshineQuantiles: [1400, 1800]
                    }
                }
            }
        ]
    }

    // Add simulated shadow data (mocking a "shading map")
    const shadowMap = {
        avgShadingLoss: 2.5, // 2.5% loss due to shading
        shadingMapUrl: "https://via.placeholder.com/800x600.png?text=Shadow+Map+Simulation", // Placeholder
        optimalHours: "10:00 - 18:00"
    }

    mockData.shadowAnalysis = shadowMap

    return { success: true, data: mockData }
}
