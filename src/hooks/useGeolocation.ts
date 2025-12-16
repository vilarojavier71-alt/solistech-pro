/**
 * useGeolocation Hook
 * 
 * Hook para obtener la ubicación del usuario con alta precisión.
 * Incluye manejo de errores y permisos.
 */

"use client"

import * as React from "react"

interface GeolocationPosition {
    latitude: number
    longitude: number
    accuracy: number
    altitude: number | null
    altitudeAccuracy: number | null
    heading: number | null
    speed: number | null
    timestamp: string
}

interface UseGeolocationReturn {
    location: GeolocationPosition | null
    error: string | null
    isLoading: boolean
    requestLocation: () => void
}

export function useGeolocation(): UseGeolocationReturn {
    const [location, setLocation] = React.useState<GeolocationPosition | null>(null)
    const [error, setError] = React.useState<string | null>(null)
    const [isLoading, setIsLoading] = React.useState(false)

    const requestLocation = React.useCallback(() => {
        if (!navigator.geolocation) {
            setError("Geolocalización no soportada en este navegador")
            return
        }

        setIsLoading(true)
        setError(null)

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    altitude: position.coords.altitude,
                    altitudeAccuracy: position.coords.altitudeAccuracy,
                    heading: position.coords.heading,
                    speed: position.coords.speed,
                    timestamp: new Date(position.timestamp).toISOString()
                })
                setIsLoading(false)
            },
            (error) => {
                let errorMessage = "Error desconocido"

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "Permiso de ubicación denegado"
                        break
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Ubicación no disponible"
                        break
                    case error.TIMEOUT:
                        errorMessage = "Tiempo de espera agotado"
                        break
                }

                setError(errorMessage)
                setIsLoading(false)
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        )
    }, [])

    // Solicitar ubicación al montar
    React.useEffect(() => {
        requestLocation()
    }, [requestLocation])

    return {
        location,
        error,
        isLoading,
        requestLocation
    }
}
