/**
 * useHapticFeedback Hook
 * 
 * Hook para proporcionar feedback háptico (vibración) en dispositivos móviles.
 * Compatible con Vibration API.
 */

"use client"

import * as React from "react"

interface UseHapticFeedbackReturn {
    vibrate: (pattern: number | number[]) => void
    isSupported: boolean
}

export function useHapticFeedback(): UseHapticFeedbackReturn {
    const [isSupported, setIsSupported] = React.useState(false)

    React.useEffect(() => {
        setIsSupported("vibrate" in navigator)
    }, [])

    const vibrate = React.useCallback(
        (pattern: number | number[]) => {
            if (!isSupported) return

            try {
                navigator.vibrate(pattern)
            } catch (error) {
                console.error("Error al vibrar:", error)
            }
        },
        [isSupported]
    )

    return {
        vibrate,
        isSupported
    }
}
