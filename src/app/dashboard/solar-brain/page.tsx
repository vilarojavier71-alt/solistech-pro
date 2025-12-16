'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Sun, Battery, Banknote, Leaf, ArrowLeft, TrendingUp, MapPin, Calculator } from 'lucide-react'
import { toast } from 'sonner'
import {
    calculateSolarProduction,
    calculatePanelsFromArea,
    calculateROI,
    SOLAR_CONSTANTS,
    type SolarCalculationResult
} from '@/lib/services/pvgis'

interface FullResult {
    areaM2: number
    panels: { numPanels: number; totalKWp: number; estimatedCost: number }
    pvgis: SolarCalculationResult
    roi: { annualSavingsEur: number; paybackYears: number; roi25Years: number; co2OffsetKg: number }
}

export default function SolarBrainPage() {
    const [step, setStep] = useState<'input' | 'calculating' | 'result'>('input')
    const [address, setAddress] = useState('')
    const [areaM2, setAreaM2] = useState('')
    const [lat, setLat] = useState('')
    const [lng, setLng] = useState('')
    const [isGeocoding, setIsGeocoding] = useState(false)
    const [result, setResult] = useState<FullResult | null>(null)

    // Geocodificar dirección
    async function geocodeAddress() {
        if (!address.trim()) {
            toast.error('Introduce una dirección')
            return
        }

        setIsGeocoding(true)
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
                { headers: { 'Accept-Language': 'es' } }
            )
            const data = await res.json()

            if (data.length > 0) {
                setLat(data[0].lat)
                setLng(data[0].lon)
                toast.success('Coordenadas obtenidas')
            } else {
                toast.error('Dirección no encontrada')
            }
        } catch (error) {
            toast.error('Error al buscar dirección')
        } finally {
            setIsGeocoding(false)
        }
    }

    async function handleCalculate() {
        const area = parseFloat(areaM2)
        const latitude = parseFloat(lat)
        const longitude = parseFloat(lng)

        if (isNaN(area) || area < 4) {
            toast.error('El área debe ser al menos 4 m² (2 paneles)')
            return
        }

        if (isNaN(latitude) || isNaN(longitude)) {
            toast.error('Primero busca una dirección para obtener coordenadas')
            return
        }

        setStep('calculating')

        try {
            // 1. Calcular paneles desde área
            const panels = calculatePanelsFromArea(area)

            // 2. Llamar a PVGIS
            toast.info(`Consultando datos solares para ${panels.numPanels} paneles...`)

            const pvgisResult = await calculateSolarProduction({
                lat: latitude,
                lon: longitude,
                peakpower: panels.totalKWp,
                angle: SOLAR_CONSTANTS.OPTIMAL_TILT_SPAIN,
                aspect: SOLAR_CONSTANTS.OPTIMAL_AZIMUTH_SOUTH
            })

            if (!pvgisResult.success || !pvgisResult.data) {
                toast.error(pvgisResult.error || 'Error al obtener datos PVGIS')
                setStep('input')
                return
            }

            // 3. Calcular ROI
            const roi = calculateROI(pvgisResult.data.annualProductionKWh, panels.estimatedCost)

            // 4. Guardar resultado completo
            setResult({
                areaM2: area,
                panels,
                pvgis: pvgisResult.data,
                roi
            })

            toast.success('¡Análisis completado!')
            setStep('result')

        } catch (error) {
            console.error('Error en análisis:', error)
            toast.error('Error al procesar los datos')
            setStep('input')
        }
    }

    function resetAnalysis() {
        setStep('input')
        setResult(null)
    }

    return (
        <div className="container mx-auto py-8 max-w-6xl animate-in fade-in duration-500">
            {/* Header */}
            <div className="text-center space-y-2 mb-8">
                <h1 className="text-4xl font-black tracking-tight lg:text-5xl">
                    SolarBrain <span className="text-primary">Open</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Calcula el potencial solar de tu tejado con datos oficiales de la
                    <span className="text-primary font-medium"> Comisión Europea (PVGIS)</span>.
                </p>
            </div>

            {step === 'input' && (
                <Card className="max-w-xl mx-auto">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calculator className="h-5 w-5 text-primary" />
                            Datos del Tejado
                        </CardTitle>
                        <CardDescription>
                            Introduce los datos de tu instalación para calcular la producción solar.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Dirección */}
                        <div className="space-y-2">
                            <Label htmlFor="address">Dirección</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="address"
                                    placeholder="Ej: Calle Gran Vía 1, Madrid"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && geocodeAddress()}
                                />
                                <Button onClick={geocodeAddress} disabled={isGeocoding} variant="secondary">
                                    {isGeocoding ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                                </Button>
                            </div>
                            {lat && lng && (
                                <p className="text-xs text-muted-foreground">
                                    📍 Coordenadas: {parseFloat(lat).toFixed(4)}, {parseFloat(lng).toFixed(4)}
                                </p>
                            )}
                        </div>

                        {/* Área del tejado */}
                        <div className="space-y-2">
                            <Label htmlFor="area">Área disponible del tejado (m²)</Label>
                            <Input
                                id="area"
                                type="number"
                                placeholder="Ej: 40"
                                value={areaM2}
                                onChange={(e) => setAreaM2(e.target.value)}
                                min={4}
                            />
                            <p className="text-xs text-muted-foreground">
                                💡 Tip: Un panel típico ocupa 2 m². Mide el área útil sin sombras.
                            </p>
                        </div>

                        {/* Vista previa de cálculo */}
                        {areaM2 && parseFloat(areaM2) >= 4 && (
                            <div className="p-4 bg-muted/50 rounded-lg space-y-1">
                                <p className="text-sm font-medium">Vista previa:</p>
                                <p className="text-sm text-muted-foreground">
                                    ~{Math.floor(parseFloat(areaM2) / 2)} paneles × 400W = {(Math.floor(parseFloat(areaM2) / 2) * 0.4).toFixed(1)} kWp
                                </p>
                            </div>
                        )}

                        <Button
                            onClick={handleCalculate}
                            className="w-full"
                            size="lg"
                            disabled={!lat || !lng || !areaM2}
                        >
                            <Sun className="h-4 w-4 mr-2" />
                            Calcular Producción Solar
                        </Button>
                    </CardContent>
                </Card>
            )}

            {step === 'calculating' && (
                <Card className="max-w-md mx-auto">
                    <CardContent className="py-12 text-center space-y-4">
                        <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary" />
                        <div>
                            <h3 className="text-xl font-bold">Analizando...</h3>
                            <p className="text-muted-foreground">
                                Consultando base de datos solar europea
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {step === 'result' && result && (
                <div className="space-y-6">
                    <Button variant="ghost" onClick={resetAnalysis}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Nueva simulación
                    </Button>

                    {/* Métricas principales */}
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-full bg-amber-500/20">
                                        <Sun className="h-6 w-6 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Producción Anual</p>
                                        <p className="text-2xl font-bold">
                                            {result.pvgis.annualProductionKWh.toLocaleString()} kWh
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-full bg-blue-500/20">
                                        <Battery className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Paneles</p>
                                        <p className="text-2xl font-bold">
                                            {result.panels.numPanels} × {SOLAR_CONSTANTS.PANEL_POWER_KWP} kWp
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-full bg-green-500/20">
                                        <Banknote className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Ahorro Anual</p>
                                        <p className="text-2xl font-bold">
                                            {result.roi.annualSavingsEur.toLocaleString()} €
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-full bg-purple-500/20">
                                        <TrendingUp className="h-6 w-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Amortización</p>
                                        <p className="text-2xl font-bold">
                                            {result.roi.paybackYears} años
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Detalles */}
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Datos de la Instalación</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-muted-foreground">Área del tejado</span>
                                    <span className="font-medium">{Math.round(result.areaM2)} m²</span>
                                </div>
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-muted-foreground">Potencia total</span>
                                    <span className="font-medium">{result.panels.totalKWp.toFixed(1)} kWp</span>
                                </div>
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-muted-foreground">Inclinación óptima</span>
                                    <span className="font-medium">{result.pvgis.panelTilt}°</span>
                                </div>
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-muted-foreground">Orientación</span>
                                    <span className="font-medium">Sur ({result.pvgis.panelAzimuth}°)</span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-muted-foreground">Coste estimado</span>
                                    <span className="font-bold text-lg">{result.panels.estimatedCost.toLocaleString()} €</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Leaf className="h-5 w-5 text-green-600" />
                                    Impacto Ambiental
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-muted-foreground">CO₂ evitado / año</span>
                                    <span className="font-medium text-green-600">{result.roi.co2OffsetKg.toLocaleString()} kg</span>
                                </div>
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-muted-foreground">Irradiación anual</span>
                                    <span className="font-medium">{result.pvgis.annualIrradiationKWhM2} kWh/m²</span>
                                </div>
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-muted-foreground">ROI a 25 años</span>
                                    <span className="font-bold text-green-600">+{result.roi.roi25Years.toLocaleString()} €</span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-muted-foreground">Pérdidas sistema</span>
                                    <span className="font-medium">{result.pvgis.systemLoss}%</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Producción mensual */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Producción Mensual Estimada</CardTitle>
                            <CardDescription>
                                Datos calculados por PVGIS (Comisión Europea)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
                                {result.pvgis.monthlyData.map((month) => (
                                    <div
                                        key={month.month}
                                        className="text-center p-2 rounded-lg bg-muted/50"
                                    >
                                        <p className="text-xs text-muted-foreground truncate">{month.month.slice(0, 3)}</p>
                                        <p className="text-sm font-bold">{month.production}</p>
                                        <p className="text-xs text-muted-foreground">kWh</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
