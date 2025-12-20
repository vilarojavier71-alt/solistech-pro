'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { completeOnboarding, checkOnboardingStatus } from '@/lib/actions/onboarding'
import { TOUR_STEPS, TourStep } from '@/lib/onboarding/tour-config'

interface TourContextType {
    isActive: boolean
    currentStepIndex: number
    currentStep: TourStep | null
    nextStep: () => void
    prevStep: () => void
    skipTour: () => void
    startTour: () => void
    isLoading: boolean
}

const TourContext = createContext<TourContextType | undefined>(undefined)

export function TourProvider({ children }: { children: ReactNode }) {
    const [isActive, setIsActive] = useState(false)
    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [isMounted, setIsMounted] = useState(false)

    const router = useRouter()
    const pathname = usePathname()
    const { data: session, status } = useSession()

    useEffect(() => setIsMounted(true), [])

    // Check onboarding status using server action
    useEffect(() => {
        const checkStatus = async () => {
            if (status === 'loading') return

            if (!session?.user) {
                setIsLoading(false)
                return
            }

            try {
                const result = await checkOnboardingStatus()
                if (result && !result.hasCompletedOnboarding) {
                    if (window.location.pathname.includes('/dashboard')) {
                        setIsActive(true)
                    }
                }
            } catch (error) {
                console.error('Error checking onboarding status:', error)
            }
            setIsLoading(false)
        }

        if (isMounted) checkStatus()
    }, [session, status, isMounted])

    const currentStep = TOUR_STEPS[currentStepIndex] || null

    useEffect(() => {
        if (!isActive || !currentStep) return

        if (currentStep.route && currentStep.route !== pathname) {
            console.log(`🚀 Tour: Redirecting to ${currentStep.route}`)
            router.push(currentStep.route)
        }
    }, [isActive, currentStep, pathname, router])

    const nextStep = useCallback(async () => {
        if (currentStepIndex < TOUR_STEPS.length - 1) {
            setCurrentStepIndex(prev => prev + 1)
        } else {
            setIsActive(false)
            await completeOnboarding()
        }
    }, [currentStepIndex])

    const prevStep = useCallback(() => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1)
        }
    }, [currentStepIndex])

    const skipTour = useCallback(async () => {
        setIsActive(false)
        await completeOnboarding()
    }, [])

    const startTour = useCallback(() => {
        setCurrentStepIndex(0)
        setIsActive(true)
    }, [])

    return (
        <TourContext.Provider value={{
            isActive,
            currentStepIndex,
            currentStep,
            nextStep,
            prevStep,
            skipTour,
            startTour,
            isLoading
        }}>
            {children}
        </TourContext.Provider>
    )
}

export function useTour() {
    const context = useContext(TourContext)
    if (context === undefined) {
        throw new Error('useTour must be used within a TourProvider')
    }
    return context
}
