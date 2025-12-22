'use client'

import { useState } from 'react'
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
    Home,
    Map
} from 'lucide-react'
import { searchCadastreByCoordinates, findNearestParcel, geocodeAddress } from '@/lib/actions/catastro'
import { cn } from '@/lib/utils'

interface CadastralResult {
    rc: string
    address: string
    city: string
    google_address?: string
    match_type?: 'exact' | 'approximate' | 'proximity_spiral'
    lat?: number
    lng?: number
}

export default function CatastroPage() {
    const [searchAddress, setSearchAddress] = useState('')
    const [directRC, setDirectRC] = useState('')
    const [isSearching, setIsSearching] = useState(false)
    const [isSearchingRC, setIsSearchingRC] = useState(false)
    const [result, setResult] = useState<CadastralResult | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [searchSource, setSearchSource] = useState<string>('')
    const [lastCoords, setLastCoords] = useState<{ lat: number; lng: number } | null>(null)

    // Search cadastre by address
    const handleSearchByAddress = async () => {
        if (!searchAddress.trim()) {
            toast.error('Introduce una dirección')
            return
        }

        setIsSearching(true)
        setError(null)
        setResult(null)

        try {
            // First geocode the address
            const geoResponse = await geocodeAddress(searchAddress)

            if (!geoResponse.success || !geoResponse.data) {
                setError('Dirección no encontrada. Prueba con más detalles.')
                toast.error('Dirección no encontrada')
                setIsSearching(false)
                return
            }

            const { lat, lng } = geoResponse.data
            setLastCoords({ lat, lng })

            // Then search cadastre
            const response = await searchCadastreByCoordinates(lat, lng, searchAddress)

            if (response.success && response.data) {
                setResult({ ...response.data as CadastralResult, lat, lng })
                setSearchSource(response.source || 'Dirección')
                toast.success('✅ Referencia Catastral encontrada')
            } else {
                // Try spiral search as fallback
                const spiralResponse = await findNearestParcel(lat, lng)

                if (spiralResponse.success && spiralResponse.data) {
                    setResult({ ...spiralResponse.data as CadastralResult, lat, lng })
                    setSearchSource('Búsqueda Espiral')
                    toast.success('✅ Parcela cercana encontrada')
                } else {
                    setError(response.message || 'No se encontró referencia catastral en esta ubicación')
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

    // Direct RC lookup
    const handleSearchByRC = async () => {
        if (!directRC.trim() || directRC.length < 14) {
            toast.error('Introduce una referencia catastral válida (mínimo 14 caracteres)')
            return
        }

        setIsSearchingRC(true)
        setError(null)

        // Open directly in SEDE
        window.open(
            `https://www1.sedecatastro.gob.es/CYCBienInmueble/OVCConCiworh.aspx?del=&mession=&RefC=${directRC.trim()}`,
            '_blank'
        )

        toast.success('Abriendo en Sede Electrónica...')
        setIsSearchingRC(false)
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

    // Open in Google Maps
    const openInGoogleMaps = () => {
        if (lastCoords) {
            window.open(
                `https://www.google.com/maps/search/?api=1&query=${lastCoords.lat},${lastCoords.lng}`,
                '_blank'
            )
        } else if (searchAddress) {
            window.open(
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchAddress)}`,
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
                        Obtén la Referencia Catastral a partir de una dirección
                    </p>
                </div>
                <Badge variant="outline" className="text-xs">
                    Datos oficiales SEDE Catastro
                </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Search */}
                <div className="space-y-6">
                    {/* Search by Address */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-primary" />
                                Buscar por Dirección
                            </CardTitle>
                            <CardDescription>
                                Introduce la dirección completa del inmueble
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="address">Dirección completa</Label>
                                <Input
                                    id="address"
                                    placeholder="Ej: Calle Mayor 15, Madrid"
                                    value={searchAddress}
                                    onChange={(e) => setSearchAddress(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearchByAddress()}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Incluye calle, número, código postal y municipio para mayor precisión
                                </p>
                            </div>

                            <Button
                                onClick={handleSearchByAddress}
                                disabled={isSearching}
                                className="w-full"
                                size="lg"
                            >
                                {isSearching ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Buscando en Catastro...
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

                    {/* Direct RC Lookup */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileCheck className="h-5 w-5 text-primary" />
                                Consultar por RC
                            </CardTitle>
                            <CardDescription>
                                Si ya tienes la Referencia Catastral
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="rc">Referencia Catastral</Label>
                                <Input
                                    id="rc"
                                    placeholder="Ej: 9872023VH5797S0001WX"
                                    value={directRC}
                                    onChange={(e) => setDirectRC(e.target.value.toUpperCase())}
                                    maxLength={20}
                                    className="font-mono"
                                />
                            </div>

                            <Button
                                onClick={handleSearchByRC}
                                disabled={isSearchingRC}
                                variant="outline"
                                className="w-full"
                            >
                                {isSearchingRC ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Abriendo...
                                    </>
                                ) : (
                                    <>
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        Ver en Sede Electrónica
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

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
                                    <Button variant="outline" onClick={openInGoogleMaps}>
                                        <Map className="mr-2 h-4 w-4" />
                                        Ver en Maps
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
                                        💡 <strong>Consejo:</strong> Asegúrate de incluir el número de portal
                                        y el código postal. Prueba con formatos como &quot;Calle Mayor 15, 28001 Madrid&quot;.
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
                                            <p className="text-sm font-medium">Introduce la dirección</p>
                                            <p className="text-xs text-muted-foreground">
                                                Escribe la dirección completa con calle, número y municipio
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
                                                El sistema geocodifica y consulta la SEDE del Catastro
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

                                {/* Quick examples */}
                                <div className="space-y-2">
                                    <p className="text-xs font-medium text-muted-foreground">Ejemplos de búsqueda:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            'Calle Gran Vía 1, Madrid',
                                            'Paseo de Gracia 92, Barcelona',
                                            'Plaza Mayor 1, Salamanca'
                                        ].map((example) => (
                                            <Button
                                                key={example}
                                                variant="outline"
                                                size="sm"
                                                className="text-xs h-7"
                                                onClick={() => setSearchAddress(example)}
                                            >
                                                {example}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
