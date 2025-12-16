'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { completeOnboarding } from '@/lib/actions/onboarding'
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

    // Safety check for hydration
    const [isMounted, setIsMounted] = useState(false)

    const router = useRouter()
    const pathname = usePathname()

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => setIsMounted(true), [])

    // 1. PERSISTENCE CHECK
    useEffect(() => {
        const checkStatus = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setIsLoading(false)
                return
            }

            // Check Users or Profiles table based on schema
            const { data: userRecord } = await supabase
                .from('users')
                .select('has_completed_onboarding')
                .eq('id', user.id)
                .single()

            // If not completed and we are in dashboard, Start Tour
            if (userRecord && !userRecord.has_completed_onboarding) {
                if (window.location.pathname.includes('/dashboard')) {
                    setIsActive(true)
                }
            }
            setIsLoading(false)
        }

        if (isMounted) checkStatus()
    }, [supabase, isMounted])

    // 2. ROUTE AWARENESS ENGINE
    const currentStep = TOUR_STEPS[currentStepIndex] || null

    useEffect(() => {
        if (!isActive || !currentStep) return

        // If step requires a different route, Push and Wait
        // The Overlay component will rely on "targetElement" existence.
        // If we change route, the Overlay will re-mount/update.
        if (currentStep.route && currentStep.route !== pathname) {
            console.log(`ðŸš€ Tour: Redirecting to ${currentStep.route}`)
            router.push(currentStep.route)
        }
    }, [isActive, currentStep, pathname, router])


    // 3. ACTIONS
    const nextStep = useCallback(async () => {
        if (currentStepIndex < TOUR_STEPS.length - 1) {
            setCurrentStepIndex(prev => prev + 1)
        } else {
            // End
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
