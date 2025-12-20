"use client"

import { useEffect } from "react"
// ?? CORRECCIÓN: Importamos el hook del contexto, no del config
import { useOnboarding } from "@/components/providers/onboarding-provider"

export function OnboardingTourInit() {
    const { checkAndStartTour } = useOnboarding()

    useEffect(() => {
        // Delegamos la lógica al Provider
        checkAndStartTour()
    }, [checkAndStartTour])

    return null // Este componente no renderiza nada visual, es solo lógico
}
