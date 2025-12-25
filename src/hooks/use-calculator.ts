/**
 * Hook centralizado para calculadora solar
 * Reemplaza fetch() directo y centraliza lógica de PDF
 * ISO 27001: No-Raw-Fetch Policy
 */

'use client'

import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { saveCalculation } from '@/lib/actions/calculator'
import { calculateFullROI } from '@/lib/actions/roi-calculator'
import { generateTechnicalMemory } from '@/lib/actions/technical-memory'

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
    payback?: number
    monthlyProduction: number[]
}

interface PDFGenerationResult {
    success: boolean
    blob?: Blob
    error?: string
}

export function useCalculator() {
    // Mutation para cálculo solar
    const calculateMutation = useMutation<SolarCalculationResult, Error, SolarCalculationInput>({
        mutationFn: async (input: SolarCalculationInput) => {
            const response = await fetch('/api/calculate-solar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    consumption: input.consumption,
                    installationType: input.installationType,
                    location: input.location,
                    roofOrientation: input.roofOrientation,
                    roofTilt: input.roofTilt
                })
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
                throw new Error(errorData.message || errorData.error || 'Error al calcular')
            }

            return response.json()
        },
        onError: (error) => {
            toast.error(error.message || 'Error al calcular la instalación')
        }
    })

    // Mutation para guardar cálculo
    const saveMutation = useMutation<
        { id: string } | { error: string; code?: string },
        Error,
        { calculation: SolarCalculationResult; input: SolarCalculationInput }
    >({
        mutationFn: async ({ calculation, input }) => {
            return await saveCalculation({
                systemSize: calculation.systemSize,
                panels: calculation.panels,
                production: calculation.production,
                consumption: input.consumption,
                location: {
                    lat: input.location.lat,
                    lng: input.location.lng,
                    name: input.locationName || ''
                },
                roofOrientation: input.roofOrientation,
                roofTilt: input.roofTilt,
                savings: calculation.savings,
                roi: calculation.roi,
                annualROI: calculation.annualROI,
                payback: calculation.payback,
                monthlyProduction: calculation.monthlyProduction,
                availableArea: input.availableArea
            })
        },
        onError: (error) => {
            toast.error(error.message || 'Error al guardar cálculo')
        }
    })

    // Mutation para generar PDF
    const pdfMutation = useMutation<PDFGenerationResult, Error, string>({
        mutationFn: async (calculationId: string) => {
            const result = await generateTechnicalMemory(calculationId)

            // Validar que el resultado sea un Buffer, no un error
            if (!result || typeof result === 'object' && 'error' in result) {
                const errorMsg = (result as { error: string }).error || 'Error desconocido al generar PDF'
                throw new Error(errorMsg)
            }

            // Convertir Buffer a Blob de forma segura
            if (result instanceof Buffer || result instanceof Uint8Array) {
                const blob = new Blob([result], { type: 'application/pdf' })
                return { success: true, blob }
            }

            // Si ya es un Blob, retornarlo directamente
            if (result instanceof Blob) {
                return { success: true, blob: result }
            }

            throw new Error('Formato de PDF inválido')
        },
        onError: (error) => {
            toast.error(error.message || 'Error al generar PDF')
        },
        onSuccess: (result) => {
            if (result.success && result.blob) {
                // Crear URL y descargar
                try {
                    const url = URL.createObjectURL(result.blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `memoria-tecnica-${new Date().toISOString().slice(0, 10)}.pdf`
                    document.body.appendChild(a)
                    a.click()
                    URL.revokeObjectURL(url)
                    document.body.removeChild(a)
                    toast.success('PDF generado correctamente')
                } catch (err) {
                    toast.error('Error al descargar PDF')
                }
            }
        }
    })

    // Función principal de cálculo
    const calculate = async (input: SolarCalculationInput) => {
        try {
            // 1. Calcular
            const calculation = await calculateMutation.mutateAsync(input)

            // 2. Guardar automáticamente
            const saved = await saveMutation.mutateAsync({ calculation, input })

            if ('error' in saved) {
                if (saved.code === 'ORGANIZATION_REQUIRED') {
                    throw new Error('ORGANIZATION_REQUIRED')
                }
                throw new Error(saved.error)
            }

            return {
                calculation,
                savedId: saved.id
            }
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Error desconocido')
            throw err
        }
    }

    // Función para generar PDF
    const generatePDF = async (calculationId: string) => {
        return await pdfMutation.mutateAsync(calculationId)
    }

    // Función para calcular ROI
    const calculateROI = async (calculationId: string) => {
        try {
            return await calculateFullROI(calculationId)
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Error al calcular ROI')
            throw err
        }
    }

    return {
        calculate,
        generatePDF,
        calculateROI,
        isCalculating: calculateMutation.isPending || saveMutation.isPending,
        isGeneratingPDF: pdfMutation.isPending,
        error: calculateMutation.error || saveMutation.error || pdfMutation.error
    }
}

