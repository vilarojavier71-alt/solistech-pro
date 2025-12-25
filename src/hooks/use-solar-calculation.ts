/**
 * Hook centralizado para cálculos solares
 * Reemplaza fetch() directo en componentes de calculadora
 */

'use client'

import { useState } from 'react'
import { useApiMutation } from './use-api-request'
import { saveCalculation } from '@/lib/actions/calculator'
import { calculateFullROI } from '@/lib/actions/roi-calculator'

interface SolarCalculationInput {
    consumption: number
    installationType: string
    location: { lat: number; lng: number }
    roofOrientation: string
    roofTilt: number
    locationName?: string
    availableArea?: number
}

interface SolarCalculationResult {
    systemSize: number
    panels: number
    production: number
    savings: number
    roi: number
    annualROI?: number
    monthlyProduction: number[]
}

export function useSolarCalculation() {
    const [result, setResult] = useState<SolarCalculationResult | null>(null)
    const [savedCalculationId, setSavedCalculationId] = useState<string | null>(null)
    const [isCalculating, setIsCalculating] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const { mutate: calculateSolar, isLoading: isApiLoading } = useApiMutation<
        SolarCalculationResult,
        SolarCalculationInput
    >('/api/calculate-solar', {
        method: 'POST',
        onError: (err) => {
            setError(err)
            setIsCalculating(false)
        }
    })

    const calculate = async (input: SolarCalculationInput) => {
        try {
            setIsCalculating(true)
            setError(null)

            // Calcular con API
            const calculationResult = await calculateSolar(input)
            setResult(calculationResult)

            // Guardar cálculo automáticamente
            const savedCalc = await saveCalculation({
                systemSize: calculationResult.systemSize,
                panels: calculationResult.panels,
                production: calculationResult.production,
                consumption: input.consumption,
                location: {
                    lat: input.location.lat,
                    lng: input.location.lng,
                    name: input.locationName || ''
                },
                roofOrientation: input.roofOrientation,
                roofTilt: input.roofTilt,
                savings: calculationResult.savings,
                roi: calculationResult.roi,
                annualROI: calculationResult.annualROI,
                monthlyProduction: calculationResult.monthlyProduction,
                availableArea: input.availableArea
            })

            if (savedCalc?.error) {
                if (savedCalc.code === 'ORGANIZATION_REQUIRED') {
                    throw new Error('ORGANIZATION_REQUIRED')
                }
                throw new Error(savedCalc.error)
            }

            if (savedCalc?.id) {
                setSavedCalculationId(savedCalc.id)
                return { calculation: calculationResult, savedId: savedCalc.id }
            }

            return { calculation: calculationResult, savedId: null }
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Error en el cálculo')
            setError(error)
            throw error
        } finally {
            setIsCalculating(false)
        }
    }

    const calculateROI = async (calculationId: string) => {
        try {
            const roiResult = await calculateFullROI(calculationId)
            return roiResult
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Error al calcular ROI')
            setError(error)
            throw error
        }
    }

    return {
        calculate,
        calculateROI,
        result,
        savedCalculationId,
        isCalculating: isCalculating || isApiLoading,
        error
    }
}


