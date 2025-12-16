"use client"
// Client boundary forced

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr' // Usando librería moderna
import { TOUR_STEPS, TourStep } from '@/lib/onboarding/tour-config'
import { completeOnboarding } from '@/lib/actions/onboarding'

// 1. Definimos la firma de la función en la interfaz
interface OnboardingContextType {
    isActive: boolean
    currentStepIndex: number
    currentStep: TourStep | null
    nextStep: () => void
    prevStep: () => void
    skipTour: () => void
    restartOnboardingTour: () => void // 👉 NUEVA FUNCIÓN AÑADIDA
    checkAndStartTour: () => Promise<void>
    isLoading: boolean
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: ReactNode }) {
    const [isActive, setIsActive] = useState(false)
    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    const [isLoading, setIsLoading] = useState(true)

    const router = useRouter()
    const pathname = usePathname()

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const currentStep = TOUR_STEPS[currentStepIndex] || null

    const checkAndStartTour = useCallback(async () => {
        setIsLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setIsLoading(false)
                return
            }

            // Updated to query 'users' table based on migration
            const { data: userRecord } = await supabase
                .from('users')
                .select('has_completed_onboarding')
                .eq('id', user.id)
                .single()

            if (userRecord && !userRecord.has_completed_onboarding) {
                // Optional: Only start in dashboard
                if (window.location.pathname.includes('/dashboard')) {
                    setIsActive(true)
                }
            }
        } catch (error) {
            console.error("Error checking onboarding status:", error)
        } finally {
            setIsLoading(false)
        }
    }, [supabase])

    useEffect(() => {
        if (isActive && currentStep?.route && pathname !== currentStep.route) {
            router.push(currentStep.route)
        }
    }, [isActive, currentStep, pathname, router])

    const nextStep = useCallback(async () => {
        if (currentStepIndex < TOUR_STEPS.length - 1) {
            setCurrentStepIndex(prev => prev + 1)
        } else {
            await finishTour()
        }
    }, [currentStepIndex])

    const prevStep = useCallback(() => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1)
        }
    }, [currentStepIndex])

    const finishTour = async () => {
        setIsActive(false)
        await completeOnboarding()
    }

    const skipTour = async () => {
        setIsActive(false)
        await completeOnboarding()
    }

    // 2. Implementamos la lógica de reinicio
    const restartOnboardingTour = () => {
        setCurrentStepIndex(0) // Volver al paso 1
        setIsActive(true)      // Activar el tour
    }

    return (
        <OnboardingContext.Provider value={{
            isActive,
            currentStepIndex,
            currentStep,
            nextStep,
            prevStep,
            skipTour,
            restartOnboardingTour, // 👉 Exponemos la función al contexto
            checkAndStartTour,
            isLoading
        }}>
            {children}
        </OnboardingContext.Provider>
    )
}

export const useOnboarding = () => {
    const context = useContext(OnboardingContext)
    if (context === undefined) {
        throw new Error('useOnboarding must be used within an OnboardingProvider')
    }
    return context
}
