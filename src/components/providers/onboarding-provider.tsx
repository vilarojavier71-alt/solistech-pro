"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { TOUR_STEPS, TourStep } from '@/lib/onboarding/tour-config'
import { completeOnboarding, checkOnboardingStatus } from '@/lib/actions/onboarding'

interface OnboardingContextType {
    isActive: boolean
    currentStepIndex: number
    currentStep: TourStep | null
    nextStep: () => void
    prevStep: () => void
    skipTour: () => void
    restartOnboardingTour: () => void
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
    const { data: session, status } = useSession()

    const currentStep = TOUR_STEPS[currentStepIndex] || null

    const checkAndStartTour = useCallback(async () => {
        setIsLoading(true)
        try {
            if (status === 'loading') return
            if (!session?.user) {
                setIsLoading(false)
                return
            }

            const result = await checkOnboardingStatus()
            if (result && !result.hasCompletedOnboarding) {
                if (window.location.pathname.includes('/dashboard')) {
                    setIsActive(true)
                }
            }
        } catch (error) {
            console.error("Error checking onboarding status:", error)
        } finally {
            setIsLoading(false)
        }
    }, [session, status])

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

    const restartOnboardingTour = () => {
        setCurrentStepIndex(0)
        setIsActive(true)
    }

    return (
        <OnboardingContext.Provider value={{
            isActive,
            currentStepIndex,
            currentStep,
            nextStep,
            prevStep,
            skipTour,
            restartOnboardingTour,
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
