'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MapPin, Pencil, Trash2, Calculator, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

// Importación dinámica para evitar SSR
const LeafletMap = dynamic(
    () => import('./leaflet-map-inner'),
    {
        ssr: false,
        loading: () => (
            <div className="h-[400px] flex items-center justify-center bg-muted rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }
)

interface RoofDrawingMapProps {
    onAreaCalculated: (data: {
        areaM2: number
        centerLat: number
        centerLng: number
        polygon: [number, number][]
    }) => void
    initialAddress?: string
}

export function RoofDrawingMap({ onAreaCalculated, initialAddress }: RoofDrawingMapProps) {
    const [mounted, setMounted] = useState(false)
    const [address, setAddress] = useState(initialAddress || '')
    const [center, setCenter] = useState<[number, number]>([40.4168, -3.7038]) // Madrid default
    const [zoom, setZoom] = useState(18)
    const [isDrawing, setIsDrawing] = useState(false)
    const [polygonPoints, setPolygonPoints] = useState<[number, number][]>([])
    const [areaM2, setAreaM2] = useState<number | null>(null)
    const [isGeocoding, setIsGeocoding] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Geocodificar dirección usando Nominatim (OSM - gratuito)
    async function geocodeAddress() {
        if (!address.trim()) return

        setIsGeocoding(true)
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
                { headers: { 'Accept-Language': 'es' } }
            )
            const data = await res.json()

            if (data.length > 0) {
                const { lat, lon } = data[0]
                setCenter([parseFloat(lat), parseFloat(lon)])
                setZoom(19)
                toast.success('Ubicación encontrada')
            } else {
                toast.error('Dirección no encontrada')
            }
        } catch (error) {
            toast.error('Error al buscar dirección')
        } finally {
            setIsGeocoding(false)
        }
    }

    // Añadir punto al polígono
    function handlePointAdded(point: [number, number]) {
        setPolygonPoints(prev => [...prev, point])
    }

    // Calcular área del polígono usando fórmula de Shoelace
    function calculateArea(points: [number, number][]): number {
        if (points.length < 3) return 0

        // Convertir a metros usando aproximación para España
        const R = 6371000 // Radio tierra en metros
        const toRad = (deg: number) => deg * Math.PI / 180

        // Centro del polígono
        const centerLat = points.reduce((s, p) => s + p[0], 0) / points.length
        const centerLon = points.reduce((s, p) => s + p[1], 0) / points.length
        const mPerDegLat = R * toRad(1)
        const mPerDegLon = R * toRad(1) * Math.cos(toRad(centerLat))

        // Convertir a coordenadas métricas locales
        const metersPoints = points.map(p => [
            (p[0] - centerLat) * mPerDegLat,
            (p[1] - centerLon) * mPerDegLon
        ])

        // Fórmula de Shoelace
        let area = 0
        for (let i = 0; i < metersPoints.length; i++) {
            const j = (i + 1) % metersPoints.length
            area += metersPoints[i][0] * metersPoints[j][1]
            area -= metersPoints[j][0] * metersPoints[i][1]
        }

        return Math.abs(area / 2)
    }

    // Cerrar polígono y calcular
    function finishPolygon() {
        if (polygonPoints.length < 3) {
            toast.error('Dibuja al menos 3 puntos')
            return
        }

        const area = calculateArea(polygonPoints)
        setAreaM2(area)
        setIsDrawing(false)

        // Calcular centro
        const centerLat = polygonPoints.reduce((s, p) => s + p[0], 0) / polygonPoints.length
        const centerLng = polygonPoints.reduce((s, p) => s + p[1], 0) / polygonPoints.length

        onAreaCalculated({
            areaM2: Math.round(area * 100) / 100,
            centerLat,
            centerLng,
            polygon: polygonPoints
        })

        toast.success(`Área calculada: ${Math.round(area)} m²`)
    }

    function resetPolygon() {
        setPolygonPoints([])
        setAreaM2(null)
        setIsDrawing(false)
    }

    if (!mounted) {
        return (
            <Card>
                <CardContent className="h-[500px] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Dibuja el área de tu tejado
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Barra de búsqueda */}
                <div className="flex gap-2">
                    <div className="flex-1">
                        <Label htmlFor="address" className="sr-only">Dirección</Label>
                        <Input
                            id="address"
                            placeholder="Buscar dirección (ej: Calle Gran Vía 1, Madrid)"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && geocodeAddress()}
                        />
                    </div>
                    <Button onClick={geocodeAddress} disabled={isGeocoding}>
                        {isGeocoding ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                    </Button>
                </div>

                {/* Controles de dibujo */}
                <div className="flex gap-2 flex-wrap">
                    <Button
                        variant={isDrawing ? "destructive" : "default"}
                        onClick={() => {
                            if (isDrawing) {
                                finishPolygon()
                            } else {
                                resetPolygon()
                                setIsDrawing(true)
                                toast.info('Haz clic en el mapa para dibujar el área')
                            }
                        }}
                    >
                        {isDrawing ? (
                            <>
                                <Calculator className="h-4 w-4 mr-2" />
                                Cerrar y Calcular ({polygonPoints.length} puntos)
                            </>
                        ) : (
                            <>
                                <Pencil className="h-4 w-4 mr-2" />
                                Dibujar Polígono
                            </>
                        )}
                    </Button>
                    {polygonPoints.length > 0 && (
                        <Button variant="outline" onClick={resetPolygon}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Borrar
                        </Button>
                    )}
                    {areaM2 !== null && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-md text-green-800 dark:text-green-200 font-medium">
                            Área: {Math.round(areaM2)} m²
                        </div>
                    )}
                </div>

                {/* Mapa */}
                <div className="h-[400px] rounded-lg overflow-hidden border">
                    <LeafletMap
                        center={center}
                        zoom={zoom}
                        polygonPoints={polygonPoints}
                        isDrawing={isDrawing}
                        onPointAdded={handlePointAdded}
                    />
                </div>

                <p className="text-sm text-muted-foreground">
                    💡 Usa la vista satélite de Google Maps para identificar tu tejado, luego dibuja aquí el área disponible.
                </p>
            </CardContent>
        </Card>
    )
}
