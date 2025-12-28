'use client'

import { useEffect, useRef } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { TOUR_STEPS } from '@/lib/onboarding/tour-config'

export function OnboardingTour() {
    // Keep reference to driver instance
    const driverObj = useRef<any>(null)

    useEffect(() => {
        // Initialize driver
        driverObj.current = driver({
            showProgress: true,
            animate: true,
            allowClose: true,
            doneBtnText: '¡Listo!',
            nextBtnText: 'Siguiente',
            prevBtnText: 'Atrás',
            steps: TOUR_STEPS.map(step => ({
                element: step.targetId,
                popover: {
                    title: step.title,
                    description: step.content,
                    side: step.position || 'bottom',
                    align: 'start'
                }
            })),
            onDestroyed: () => {
                // Check if it was because of completion
                // We can't distinguish cancel vs done easily in v1 without state, 
                // but we can set 'seen' on start and maybe 'completed' on end.
            }
        })

        const handleStart = () => {
            // Check if user has already seen it
            // const seen = localStorage.getItem('onboarding_completed')
            // if (!seen) {
            driverObj.current.drive()
            // }
        }

        const handleRestart = () => {
            driverObj.current.drive()
        }

        // Auto-start logic handled by OnboardingProvider or init can remain, 
        // OR we can listen to the event directly here for "Restart"
        window.addEventListener('restart-tour', handleRestart)

        return () => {
            window.removeEventListener('restart-tour', handleRestart)
            driverObj.current?.destroy()
        }
    }, [])

    return null // Renders nothing, just attaches to DOM
}
