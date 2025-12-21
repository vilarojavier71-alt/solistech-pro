'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
    Search,
    Building2,
    MapPin,
    FileCheck,
    Loader2,
    Copy,
    ExternalLink,
    CheckCircle2,
    AlertCircle,
    Target,
    Calendar,
    Ruler,
    Home
} from 'lucide-react'
import { searchCadastreByCoordinates, findNearestParcel } from '@/lib/actions/catastro'
import { InteractiveLocationPicker } from '@/components/calculator/location-picker-wrapper'
import { cn } from '@/lib/utils'

interface CadastralResult {
    rc: string
    address: string
    city: string
    google_address?: string
    match_type?: 'exact' | 'approximate' | 'proximity_spiral'
}

export default function CatastroPage() {
    const [location, setLocation] = useState<{ lat: number; lng: number }>({ lat: 40.4168, lng: -3.7038 })
    const [address, setAddress] = useState<string>('')
    const [isSearching, setIsSearching] = useState(false)
    const [result, setResult] = useState<CadastralResult | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [searchSource, setSearchSource] = useState<string>('')

    // Handle location change from map
    const handleLocationChange = useCallback((newLoc: { lat: number; lng: number; address?: string }) => {
        setLocation({ lat: newLoc.lat, lng: newLoc.lng })
        if (newLoc.address) {
            setAddress(newLoc.address)
        }
        // Clear previous results when location changes
        setResult(null)
        setError(null)
    }, [])

    // Search cadastre by current coordinates
    const handleSearch = async () => {
        setIsSearching(true)
        setError(null)
        setResult(null)

        try {
            const response = await searchCadastreByCoordinates(location.lat, location.lng, address)

            if (response.success && response.data) {
                setResult(response.data as CadastralResult)
                setSearchSource(response.source || 'Coordenadas')
                toast.success('✅ Referencia Catastral encontrada')
            } else {
                // Try spiral search as fallback
                const spiralResponse = await findNearestParcel(location.lat, location.lng)

                if (spiralResponse.success && spiralResponse.data) {
                    setResult(spiralResponse.data as CadastralResult)
                    setSearchSource('Búsqueda Espiral')
                    toast.success('✅ Parcela cercana encontrada')
                } else {
                    setError(response.message || 'No se encontró referencia catastral')
                    toast.error('No se encontró referencia catastral')
                }
            }
        } catch (err) {
            setError('Error de conexión con el Catastro')
            toast.error('Error de conexión con el Catastro')
        } finally {
            setIsSearching(false)
        }
    }

    // Copy RC to clipboard
    const copyRC = () => {
        if (result?.rc) {
            navigator.clipboard.writeText(result.rc)
            toast.success('Referencia Catastral copiada')
        }
    }

    // Open in Sede Electrónica
    const openInSede = () => {
        if (result?.rc) {
            window.open(
                `https://www1.sedecatastro.gob.es/CYCBienInmueble/OVCConCiworh.aspx?del=&mession=&RefC=${result.rc}`,
                '_blank'
            )
        }
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Building2 className="h-8 w-8 text-primary" />
                        Consulta Catastral
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Obtén la Referencia Catastral automáticamente desde el mapa
                    </p>
                </div>
                <Badge variant="outline" className="text-xs">
                    Datos oficiales SEDE Catastro
                </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Map */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-primary" />
                            Selecciona la Ubicación
                        </CardTitle>
                        <CardDescription>
                            Haz clic en el mapa o arrastra el marcador para posicionarte sobre el inmueble
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Map */}
                        <InteractiveLocationPicker
                            initialLocation={location}
                            onLocationChange={handleLocationChange}
                            height="400px"
                        />

                        {/* Coordinates Display */}
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div className="flex items-center gap-2">
                                <Target className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-mono">
                                    {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                                </span>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                                Precisión: 6 decimales
                            </Badge>
                        </div>

                        {/* Search Button */}
                        <Button
                            onClick={handleSearch}
                            disabled={isSearching}
                            className="w-full"
                            size="lg"
                        >
                            {isSearching ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Consultando Catastro...
                                </>
                            ) : (
                                <>
                                    <Search className="mr-2 h-4 w-4" />
                                    Buscar Referencia Catastral
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Right Column - Results */}
                <div className="space-y-6">
                    {/* Result Card */}
                    {result && (
                        <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                                        <CheckCircle2 className="h-5 w-5" />
                                        Datos Catastrales Verificados
                                    </CardTitle>
                                    <Badge className="bg-emerald-500">
                                        {searchSource}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Referencia Catastral */}
                                <div className="p-4 bg-white dark:bg-background rounded-lg border">
                                    <Label className="text-xs text-muted-foreground">Referencia Catastral</Label>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-xl font-mono font-bold tracking-wider">
                                            {result.rc}
                                        </span>
                                        <div className="flex gap-2">
                                            <Button size="icon" variant="ghost" onClick={copyRC}>
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" onClick={openInSede}>
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Address */}
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <Home className="h-4 w-4 text-muted-foreground mt-1" />
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Dirección Catastral</Label>
                                            <p className="text-sm font-medium">{result.address}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Municipio</Label>
                                            <p className="text-sm font-medium">{result.city}</p>
                                        </div>
                                    </div>

                                    {result.match_type && (
                                        <div className="flex items-center gap-2 pt-2">
                                            <Badge variant="outline" className={cn(
                                                result.match_type === 'exact' && 'border-emerald-500 text-emerald-600',
                                                result.match_type === 'approximate' && 'border-amber-500 text-amber-600',
                                                result.match_type === 'proximity_spiral' && 'border-blue-500 text-blue-600'
                                            )}>
                                                {result.match_type === 'exact' && '🎯 Coincidencia Exacta'}
                                                {result.match_type === 'approximate' && '📍 Aproximación (~7m)'}
                                                {result.match_type === 'proximity_spiral' && '🔍 Búsqueda Espiral (~15m)'}
                                            </Badge>
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                {/* Actions */}
                                <div className="grid grid-cols-2 gap-2">
                                    <Button variant="outline" onClick={openInSede}>
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        Ver en SEDE
                                    </Button>
                                    <Button variant="outline" onClick={copyRC}>
                                        <FileCheck className="mr-2 h-4 w-4" />
                                        Copiar RC
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Error Card */}
                    {error && !result && (
                        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                                    <AlertCircle className="h-5 w-5" />
                                    No se encontró Referencia
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                                <div className="mt-4 p-3 bg-white dark:bg-background rounded-lg border">
                                    <p className="text-xs text-muted-foreground">
                                        💡 <strong>Consejo:</strong> Mueve el pin hacia el centro del edificio o parcela.
                                        El Catastro puede no reconocer puntos en lindes o zonas exteriores.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Instructions Card (when no result) */}
                    {!result && !error && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileCheck className="h-5 w-5 text-primary" />
                                    Cómo Funciona
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <div className="flex gap-3">
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                                            1
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Posiciona el marcador</p>
                                            <p className="text-xs text-muted-foreground">
                                                Haz clic en el mapa o arrastra el pin sobre el tejado/inmueble
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                                            2
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Busca la Referencia</p>
                                            <p className="text-xs text-muted-foreground">
                                                Pulsa "Buscar" para consultar la SEDE del Catastro
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                                            3
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Usa los datos</p>
                                            <p className="text-xs text-muted-foreground">
                                                Copia la RC para trámites o verifica en la SEDE oficial
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <div className="p-3 bg-muted rounded-lg">
                                    <p className="text-xs text-muted-foreground">
                                        🔒 <strong>Nota:</strong> Los datos provienen de la Sede Electrónica del Catastro
                                        (Ministerio de Hacienda). Son datos públicos y oficiales.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
