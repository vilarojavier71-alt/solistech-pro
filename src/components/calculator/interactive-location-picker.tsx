'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Target, Loader2, Navigation } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// Fix for default marker icon in Next.js
import 'leaflet/dist/leaflet.css'

// Custom marker icon
const createCustomIcon = (isConfirmed: boolean) => L.divIcon({
    className: 'custom-marker',
    html: `
        <div class="relative">
            <div class="absolute -top-8 -left-3 w-6 h-6 ${isConfirmed ? 'bg-emerald-500' : 'bg-blue-500'} rounded-full border-2 border-white shadow-lg flex items-center justify-center animate-bounce">
                <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                </svg>
            </div>
            <div class="absolute -bottom-1 left-0 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent ${isConfirmed ? 'border-t-emerald-500' : 'border-t-blue-500'}"></div>
        </div>
    `,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
})

interface LocationPickerProps {
    initialLocation?: { lat: number; lng: number }
    onLocationChange: (location: { lat: number; lng: number; address?: string; source: 'pin_drop' | 'city_select' | 'manual' }) => void
    height?: string
    className?: string
}

// Component to handle map clicks
function MapClickHandler({
    onLocationSelect,
    setIsConfirmed
}: {
    onLocationSelect: (lat: number, lng: number) => void
    setIsConfirmed: (v: boolean) => void
}) {
    useMapEvents({
        click: (e) => {
            onLocationSelect(e.latlng.lat, e.latlng.lng)
            setIsConfirmed(true)
        }
    })
    return null
}

// Component to fly to location
function FlyToLocation({ location }: { location: { lat: number; lng: number } }) {
    const map = useMap()

    useEffect(() => {
        map.flyTo([location.lat, location.lng], 18, { duration: 1 })
    }, [location.lat, location.lng, map])

    return null
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay)
        return () => clearTimeout(timer)
    }, [value, delay])

    return debouncedValue
}

export function InteractiveLocationPicker({
    initialLocation = { lat: 40.4168, lng: -3.7038 },
    onLocationChange = () => { }, // Default empty function to prevent TypeError
    height = '350px',
    className
}: LocationPickerProps) {
    const [mounted, setMounted] = useState(false)
    const [position, setPosition] = useState(initialLocation)
    const [address, setAddress] = useState<string>('')
    const [isLoading, setIsLoading] = useState(false)
    const [isConfirmed, setIsConfirmed] = useState(false)
    const [isLocating, setIsLocating] = useState(false)
    const markerRef = useRef<L.Marker>(null)

    // Store callback in ref to avoid useEffect dependency issues
    const onLocationChangeRef = useRef(onLocationChange)
    onLocationChangeRef.current = onLocationChange

    // Mounted check to prevent hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    // Debounce position for geocoding
    const debouncedPosition = useDebounce(position, 500)

    // Reverse geocode when position changes
    useEffect(() => {
        const reverseGeocode = async () => {
            if (!debouncedPosition.lat || !debouncedPosition.lng) return

            setIsLoading(true)
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?lat=${debouncedPosition.lat}&lon=${debouncedPosition.lng}&format=json&accept-language=es`,
                    { headers: { 'User-Agent': 'MotorGap' } }
                )

                if (response.ok) {
                    const data = await response.json()
                    const displayName = data.display_name || `${debouncedPosition.lat.toFixed(4)}, ${debouncedPosition.lng.toFixed(4)}`
                    setAddress(displayName)

                    // Notify parent with full data (using ref to avoid dependency issues)
                    onLocationChangeRef.current?.({
                        lat: debouncedPosition.lat,
                        lng: debouncedPosition.lng,
                        address: displayName,
                        source: isConfirmed ? 'pin_drop' : 'city_select'
                    })
                }
            } catch (error) {
                console.error('Geocoding error:', error)
            } finally {
                setIsLoading(false)
            }
        }

        reverseGeocode()
    }, [debouncedPosition, isConfirmed])

    // Handle location selection from map click
    const handleLocationSelect = useCallback((lat: number, lng: number) => {
        const newPos = { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) }
        setPosition(newPos)
        toast.success(`📍 Ubicación capturada: ${lat.toFixed(4)}, ${lng.toFixed(4)}`)
    }, [])

    // Handle marker drag
    const handleMarkerDrag = useCallback(() => {
        const marker = markerRef.current
        if (marker) {
            const latlng = marker.getLatLng()
            setPosition({ lat: Number(latlng.lat.toFixed(6)), lng: Number(latlng.lng.toFixed(6)) })
            setIsConfirmed(true)
        }
    }, [])

    // Get current location
    const handleGetCurrentLocation = useCallback(() => {
        if (!navigator.geolocation) {
            toast.error('Tu navegador no soporta geolocalización')
            return
        }

        setIsLocating(true)
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const newPos = {
                    lat: Number(pos.coords.latitude.toFixed(6)),
                    lng: Number(pos.coords.longitude.toFixed(6))
                }
                setPosition(newPos)
                setIsConfirmed(true)
                setIsLocating(false)
                toast.success('📍 Ubicación GPS obtenida')
            },
            (error) => {
                setIsLocating(false)
                toast.error('No se pudo obtener la ubicación')
                console.error('Geolocation error:', error)
            },
            { enableHighAccuracy: true, timeout: 10000 }
        )
    }, [])

    // Show loading skeleton until mounted to prevent hydration mismatch
    if (!mounted) {
        return (
            <Card className={cn("overflow-hidden relative", className)}>
                <div style={{ height }} className="flex items-center justify-center bg-muted/50">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        <span className="text-sm">Cargando mapa...</span>
                    </div>
                </div>
            </Card>
        )
    }

    return (
        <Card className={cn("overflow-hidden relative", className)}>
            {/* Header with coordinates */}
            <div className="absolute top-2 left-2 right-2 z-[1000] flex items-center justify-between gap-2">
                <Badge
                    variant={isConfirmed ? "default" : "secondary"}
                    className={cn(
                        "gap-1 shadow-lg backdrop-blur-sm",
                        isConfirmed
                            ? "bg-emerald-500/90 text-white border-emerald-600"
                            : "bg-background/80"
                    )}
                >
                    {isLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                        <MapPin className="h-3 w-3" />
                    )}
                    <span className="font-mono text-xs">
                        {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
                    </span>
                    {isConfirmed && <span className="ml-1">✓</span>}
                </Badge>

                <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 shadow-lg backdrop-blur-sm bg-background/80"
                    onClick={handleGetCurrentLocation}
                    disabled={isLocating}
                >
                    {isLocating ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                        <Navigation className="h-3 w-3" />
                    )}
                    <span className="ml-1 text-xs">Mi ubicación</span>
                </Button>
            </div>

            {/* Map Container */}
            <div style={{ height }} className="relative">
                <MapContainer
                    center={[position.lat, position.lng]}
                    zoom={17}
                    style={{ height: '100%', width: '100%' }}
                    className="z-0"
                >
                    {/* Satellite Layer - Esri World Imagery (free, high quality) */}
                    <TileLayer
                        attribution='&copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    />

                    {/* Labels overlay */}
                    <TileLayer
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                        opacity={0.7}
                    />

                    {/* Click handler */}
                    <MapClickHandler
                        onLocationSelect={handleLocationSelect}
                        setIsConfirmed={setIsConfirmed}
                    />

                    {/* Fly to location when it changes */}
                    <FlyToLocation location={position} />

                    {/* Draggable Marker */}
                    <Marker
                        position={[position.lat, position.lng]}
                        draggable={true}
                        ref={markerRef}
                        icon={createCustomIcon(isConfirmed)}
                        eventHandlers={{
                            dragend: handleMarkerDrag
                        }}
                    />
                </MapContainer>
            </div>

            {/* Address footer */}
            {address && (
                <div className="p-3 bg-muted/50 border-t">
                    <div className="flex items-start gap-2">
                        <Target className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <p className="text-xs text-muted-foreground line-clamp-2">
                            {address}
                        </p>
                    </div>
                </div>
            )}

            {/* Instructions overlay */}
            {!isConfirmed && (
                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-[1000]">
                    <Badge variant="outline" className="bg-background/90 shadow-lg animate-pulse">
                        👆 Haz clic en el mapa para marcar la ubicación exacta
                    </Badge>
                </div>
            )}
        </Card>
    )
}
