'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Calculator, MapPin, Zap, TrendingUp, Download, Save, DollarSign, Sparkles, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { ProductionChart } from './production-chart'
import { SubsidiesPanel } from './subsidies-panel'
import { saveCalculation } from '@/lib/actions/calculator'
import { calculateFullROI } from '@/lib/actions/roi-calculator'
import { generateTechnicalMemory } from '@/lib/actions/technical-memory'
import { Switch } from '@/components/ui/switch'
import { SPANISH_CITIES, searchCities, type CityLocation } from '@/lib/data/spanish-cities'
import { InteractiveLocationPicker as LocationPicker } from './location-picker-wrapper'

interface CalculationResult {
    systemSize: number
    panels: number
    production: number
    savings: number
    roi: number
    annualROI: number
    monthlyProduction?: number[]
    requiredArea?: number
}

export function SolarCalculator() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<CalculationResult | null>(null)
    const [savedCalculationId, setSavedCalculationId] = useState<string | null>(null)
    const [fullCalculation, setFullCalculation] = useState<any | null>(null)
    const [isCalculatingROI, setIsCalculatingROI] = useState(false)

    // Form state
    const [consumption, setConsumption] = useState<number>(4000)
    const [installationType, setInstallationType] = useState<string>('residential')
    const [location, setLocation] = useState<{ lat: number; lng: number }>({ lat: 40.4168, lng: -3.7038 }) // Madrid by default
    const [locationName, setLocationName] = useState<string>('Madrid, España')
    const [roofOrientation, setRoofOrientation] = useState<string>('south')
    const [roofTilt, setRoofTilt] = useState<number>(30)
    const [availableArea, setAvailableArea] = useState<number>(0)

    // Estados para selector de ubicación
    const [useManualCoords, setUseManualCoords] = useState<boolean>(false)
    const [citySearch, setCitySearch] = useState<string>('')
    const [filteredCities, setFilteredCities] = useState<CityLocation[]>(SPANISH_CITIES.slice(0, 10))
    const [manualLat, setManualLat] = useState<string>('40.4168')
    const [manualLng, setManualLng] = useState<string>('-3.7038')
    const [locationSource, setLocationSource] = useState<'pin_drop' | 'city_select' | 'manual'>('city_select')

    // Estados para subvenciones (Fase 9)
    const [region, setRegion] = useState<string>('Comunidad Valenciana')
    const [showSubsidies, setShowSubsidies] = useState<boolean>(true)
    const [subsidies, setSubsidies] = useState<any[]>([])
    const [subsidiesBreakdown, setSubsidiesBreakdown] = useState<any>(null)

    // Cargar subvenciones cuando cambia la región
    useEffect(() => {
        const fetchSubsidies = async () => {
            try {
                const response = await fetch(`/api/subsidies?region=${encodeURIComponent(region)}`)
                const data = await response.json()
                setSubsidies(data)
            } catch (error) {
                console.error('Error cargando subvenciones:', error)
            }
        }
        if (region) {
            fetchSubsidies()
        }
    }, [region])

    // Función para calcular el desglose de subvenciones
    const calculateSubsidiesBreakdown = (grossCost: number, subsidiesList: any[]) => {
        let direct = 0
        let irpf = 0

        subsidiesList.forEach(sub => {
            if (sub.subsidy_type === 'direct_grant') {
                const amount = Math.min(
                    grossCost * (sub.percentage / 100),
                    sub.max_amount || Infinity
                )
                direct += amount
            }
            if (sub.subsidy_type === 'irpf_deduction') {
                const amount = Math.min(
                    grossCost * (sub.percentage / 100),
                    sub.max_amount || Infinity
                )
                irpf += amount
            }
        })

        const total = direct + irpf
        return { direct, irpf, total }
    }

    const handleCalculate = async () => {
        setLoading(true)
        try {
            // Aquí integraremos con PVGis
            const response = await fetch('/api/calculate-solar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    consumption,
                    installationType,
                    location,
                    roofOrientation,
                    roofTilt
                })
            })

            if (!response.ok) throw new Error('Error en el cálculo')

            const data = await response.json()
            setResult(data)

            // Guardar cálculo en BD automáticamente
            try {
                const savedCalc = await saveCalculation({
                    systemSize: data.systemSize,
                    panels: data.panels,
                    production: data.production,
                    consumption,
                    location: { lat: location.lat, lng: location.lng, name: locationName },
                    roofOrientation,
                    roofTilt,
                    savings: data.savings,
                    roi: data.roi,
                    annualROI: data.annualROI,
                    monthlyProduction: data.monthlyProduction,
                    availableArea: availableArea || undefined
                })

                if (savedCalc?.id) {
                    setSavedCalculationId(savedCalc.id)

                    // Calcular ROI automáticamente con el nuevo motor
                    if (showSubsidies) {
                        setIsCalculatingROI(true)
                        const roiResult = await calculateFullROI(savedCalc.id)

                        if (roiResult.success && roiResult.data) {
                            // Recargar cálculo completo con subvenciones
                            setFullCalculation({
                                ...savedCalc,
                                ...roiResult.data
                            })
                            toast.success(`âœ… Subvenciones calculadas: ${roiResult.data.totalSubsidies.toLocaleString()}â‚¬ en ayudas`)
                        } else {
                            toast.warning('No se pudieron calcular las subvenciones automáticamente')
                        }
                        setIsCalculatingROI(false)
                    }
                }
            } catch (saveError) {
                console.error('Error saving calculation:', saveError)
                // No bloqueamos el flujo si falla el guardado
            }

            toast.success('Cálculo completado')
        } catch (error) {
            toast.error('Error al calcular la instalación')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Datos de la Instalación</CardTitle>
                    <CardDescription>
                        Introduce los datos para calcular el sistema óptimo
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Consumo Anual */}
                    <div className="space-y-2">
                        <Label>Consumo Anual (kWh)</Label>
                        <Input
                            type="number"
                            value={consumption}
                            onChange={(e) => setConsumption(Number(e.target.value))}
                            placeholder="4000"
                        />
                        <p className="text-xs text-muted-foreground">
                            Lo puedes encontrar en tu factura eléctrica
                        </p>
                    </div>

                    {/* Tipo de Instalación */}
                    <div className="space-y-2">
                        <Label>Tipo de Instalación</Label>
                        <Select value={installationType} onValueChange={setInstallationType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="residential">Residencial (Vivienda)</SelectItem>
                                <SelectItem value="commercial">Comercial (Negocio)</SelectItem>
                                <SelectItem value="industrial">Industrial (Fábrica)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Ubicación - Mapa Interactivo */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-primary" />
                                Ubicación del Tejado
                            </Label>
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={useManualCoords}
                                    onCheckedChange={setUseManualCoords}
                                />
                                <span className="text-xs text-muted-foreground">
                                    Entrada manual
                                </span>
                            </div>
                        </div>

                        {!useManualCoords ? (
                            <>
                                {/* City Search Fallback */}
                                <div className="flex gap-2">
                                    <Input
                                        value={citySearch}
                                        onChange={(e) => {
                                            const query = e.target.value
                                            setCitySearch(query)
                                            if (query.length > 0) {
                                                setFilteredCities(searchCities(query))
                                            } else {
                                                setFilteredCities(SPANISH_CITIES.slice(0, 10))
                                            }
                                        }}
                                        placeholder="Buscar ciudad para centrar el mapa..."
                                        className="flex-1"
                                    />
                                    <Select
                                        value={locationName}
                                        onValueChange={(value) => {
                                            const city = SPANISH_CITIES.find(c => c.name === value)
                                            if (city) {
                                                setLocationName(city.name)
                                                setLocation({ lat: city.lat, lng: city.lng })
                                                setManualLat(city.lat.toString())
                                                setManualLng(city.lng.toString())
                                                setCitySearch('')
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="w-[200px]">
                                            <SelectValue placeholder="Ciudad" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredCities.map((city) => (
                                                <SelectItem key={city.name} value={city.name}>
                                                    {city.name} ({city.province})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Interactive Map */}
                                <LocationPicker
                                    initialLocation={location}
                                    onLocationChange={(newLoc) => {
                                        setLocation({ lat: newLoc.lat, lng: newLoc.lng })
                                        setManualLat(newLoc.lat.toString())
                                        setManualLng(newLoc.lng.toString())
                                        if (newLoc.address) {
                                            setLocationName(newLoc.address.split(',')[0] || newLoc.address)
                                        }
                                        setLocationSource(newLoc.source)
                                    }}
                                    height="300px"
                                />

                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    👆 Haz clic en el mapa o arrastra el marcador para ubicación precisa
                                </p>
                            </>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label className="text-xs">Latitud</Label>
                                    <Input
                                        type="number"
                                        step="0.000001"
                                        value={manualLat}
                                        onChange={(e) => {
                                            setManualLat(e.target.value)
                                            const lat = parseFloat(e.target.value)
                                            if (!isNaN(lat)) {
                                                setLocation({ ...location, lat })
                                                setLocationName(`${lat.toFixed(4)}, ${location.lng.toFixed(4)}`)
                                            }
                                        }}
                                        placeholder="40.4168"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Longitud</Label>
                                    <Input
                                        type="number"
                                        step="0.000001"
                                        value={manualLng}
                                        onChange={(e) => {
                                            setManualLng(e.target.value)
                                            const lng = parseFloat(e.target.value)
                                            if (!isNaN(lng)) {
                                                setLocation({ ...location, lng })
                                                setLocationName(`${location.lat.toFixed(4)}, ${lng.toFixed(4)}`)
                                            }
                                        }}
                                        placeholder="-3.7038"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground col-span-2">
                                    💡 Precisión de 6 decimales para máxima exactitud
                                </p>
                            </div>
                        )}
                    </div>


                    {/* Orientación del Tejado */}
                    <div className="space-y-2">
                        <Label>Orientación del Tejado</Label>
                        <Select value={roofOrientation} onValueChange={setRoofOrientation}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="south">Sur (Óptimo)</SelectItem>
                                <SelectItem value="southeast">Sureste</SelectItem>
                                <SelectItem value="southwest">Suroeste</SelectItem>
                                <SelectItem value="east">Este</SelectItem>
                                <SelectItem value="west">Oeste</SelectItem>
                                <SelectItem value="north">Norte</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Inclinación */}
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <Label>Inclinación del Tejado</Label>
                            <span className="text-sm text-muted-foreground">{roofTilt}°</span>
                        </div>
                        <Slider
                            value={[roofTilt]}
                            onValueChange={(value: number[]) => setRoofTilt(value[0])}
                            min={0}
                            max={90}
                            step={5}
                        />
                        <p className="text-xs text-muted-foreground">
                            0° = Plano | 30° = Ideal | 90° = Vertical
                        </p>
                    </div>

                    {/* Ãrea Disponible (NUEVO FASE 8) */}
                    <div className="space-y-2">
                        <Label>Ãrea Disponible en Tejado (mÂ²)</Label>
                        <Input
                            type="number"
                            value={availableArea}
                            onChange={(e) => setAvailableArea(Number(e.target.value))}
                            placeholder="Ej: 50"
                        />
                        <p className="text-xs text-muted-foreground">
                            Opcional. Se usará para validar si caben los paneles.
                        </p>
                    </div>

                    {/* Selector de Región (FASE 9) */}
                    <div className="space-y-2 border-t pt-4 mt-4">
                        <Label>Región / Comunidad Autónoma</Label>
                        <Select value={region} onValueChange={setRegion}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Comunidad Valenciana">Comunidad Valenciana</SelectItem>
                                <SelectItem value="Madrid">Madrid</SelectItem>
                                <SelectItem value="Cataluña">Cataluña</SelectItem>
                                <SelectItem value="Andalucía">Andalucía</SelectItem>
                                <SelectItem value="Islas Baleares">Islas Baleares</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Selecciona tu región para ver las ayudas disponibles
                        </p>
                    </div>

                    {/* Toggle Subvenciones (FASE 9) */}
                    <div className="flex items-center justify-between space-x-2 border p-4 rounded-lg bg-green-50">
                        <div className="space-y-0.5">
                            <Label htmlFor="subsidies-toggle">Aplicar Subvenciones y Ayudas</Label>
                            <p className="text-xs text-muted-foreground">
                                Mostrar coste neto tras aplicar subvenciones disponibles ({subsidies.length} disponibles)
                            </p>
                        </div>
                        <Switch
                            id="subsidies-toggle"
                            checked={showSubsidies}
                            onCheckedChange={setShowSubsidies}
                        />
                    </div>

                    {/* Botón Calcular */}
                    <Button
                        onClick={handleCalculate}
                        disabled={loading}
                        className="w-full"
                        size="lg"
                    >
                        {loading ? (
                            <>Calculando...</>
                        ) : (
                            <>
                                <Calculator className="mr-2 h-4 w-4" />
                                Calcular Sistema Óptimo
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Resultados */}
            {result && (
                <Card className="border-green-200 bg-green-50/50">
                    <CardHeader>
                        <CardTitle className="text-green-900">Resultados del Cálculo</CardTitle>
                        <CardDescription>Sistema solar óptimo para tu instalación</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Validation Alert */}
                        {availableArea > 0 && (result.panels * 2) > availableArea && (
                            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg flex items-start gap-3">
                                <div className="mt-1">âš ï¸</div>
                                <div className="flex-1">
                                    <h4 className="font-semibold">¡Ãrea Insuficiente!</h4>
                                    <p className="text-sm mt-1">
                                        Necesitas aprox. <span className="font-bold">{(result.panels * 2).toFixed(1)} m²</span> para {result.panels} paneles,
                                        pero solo tienes <span className="font-bold">{availableArea} m²</span> disponibles.
                                    </p>
                                    {(() => {
                                        const maxPanels = Math.floor(availableArea / (2 * 1.2))
                                        const maxPower = (maxPanels * 450) / 1000
                                        return (
                                            <div className="mt-3 p-3 bg-white rounded border border-red-300">
                                                <p className="text-sm font-semibold text-red-900">ðŸ’¡ Sugerencia:</p>
                                                <p className="text-sm mt-1">
                                                    Reduce a <span className="font-bold">{maxPanels} paneles</span> ({maxPower.toFixed(1)} kWp)
                                                    para que quepa en tu tejado.
                                                </p>
                                            </div>
                                        )
                                    })()}
                                </div>
                            </div>
                        )}

                        {availableArea > 0 && (result.panels * 2) <= availableArea && (
                            <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg flex items-center gap-3">
                                <div>✅</div>
                                <div className="text-sm font-medium">Instalación viable: Ocupará el {((result.panels * 2 / availableArea) * 100).toFixed(0)}% del tejado.</div>
                            </div>
                        )}

                        {/* Panel de Subvenciones con ROI completo (NUEVO - FASE 9) */}
                        {isCalculatingROI && (
                            <Card className="border-blue-200 bg-blue-50">
                                <CardContent className="flex items-center justify-center py-8">
                                    <div className="flex items-center gap-3">
                                        <Sparkles className="h-5 w-5 animate-pulse text-blue-600" />
                                        <p className="text-blue-900 font-medium">Calculando subvenciones automáticamente...</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {fullCalculation && !isCalculatingROI && (
                            <SubsidiesPanel calculation={fullCalculation} />
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-white rounded-lg border">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                    <Zap className="h-4 w-4" />
                                    <span>Potencia</span>
                                </div>
                                <div className="text-2xl font-bold text-green-700">
                                    {result.systemSize} kWp
                                </div>
                            </div>

                            <div className="p-4 bg-white rounded-lg border">
                                <div className="text-sm text-muted-foreground mb-1">Paneles</div>
                                <div className="text-2xl font-bold">{result.panels} uds</div>
                            </div>

                            <div className="p-4 bg-white rounded-lg border">
                                <div className="text-sm text-muted-foreground mb-1">Producción Anual</div>
                                <div className="text-2xl font-bold">{result.production.toLocaleString()} kWh</div>
                            </div>

                            <div className="p-4 bg-white rounded-lg border">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                    <TrendingUp className="h-4 w-4" />
                                    <span>Ahorro Anual</span>
                                </div>
                                <div className="text-2xl font-bold text-green-600">
                                    {result.savings.toLocaleString()}€
                                </div>
                            </div>

                            <div className="p-4 bg-white rounded-lg border">
                                <div className="text-sm text-muted-foreground mb-1">ROI</div>
                                <div className="text-2xl font-bold">{result.roi}%</div>
                            </div>

                            <div className="p-4 bg-white rounded-lg border">
                                <div className="text-sm text-muted-foreground mb-1">ROI Anual</div>
                                <div className="text-2xl font-bold">{result.annualROI}%</div>
                            </div>
                        </div>

                        {/* Gráfica de Producción Mensual */}
                        {result.monthlyProduction && result.monthlyProduction.length > 0 && (
                            <div className="mt-6 p-4 bg-white rounded-lg border">
                                <h3 className="text-sm font-semibold mb-4">Producción Mensual Estimada</h3>
                                <ProductionChart monthlyProduction={result.monthlyProduction} />
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-4">
                            <Button className="w-full" onClick={async () => {
                                try {
                                    await saveCalculation({
                                        systemSize: result.systemSize,
                                        panels: result.panels,
                                        production: result.production,
                                        consumption,
                                        location: { lat: location.lat, lng: location.lng, name: locationName },
                                        roofOrientation,
                                        roofTilt,
                                        savings: result.savings,
                                        roi: result.roi,
                                        annualROI: result.annualROI,
                                        monthlyProduction: result.monthlyProduction
                                    })
                                    toast.success('Cálculo guardado correctamente')
                                } catch (error) {
                                    toast.error('Error al guardar el cálculo')
                                }
                            }}>
                                <Save className="mr-2 h-4 w-4" />
                                Guardar
                            </Button>

                            <Button variant="outline" className="w-full" onClick={async () => {
                                if (!savedCalculationId) {
                                    toast.error('Primero guarda el cálculo')
                                    return
                                }

                                toast.loading('Generando memoria técnica...')
                                const result = await generateTechnicalMemory(savedCalculationId)

                                if (result.error) {
                                    toast.error(result.error)
                                } else {
                                    toast.success('Memoria técnica generada')
                                    // Descargar automáticamente
                                    window.open(result.url, '_blank')
                                }
                            }}>
                                <FileText className="mr-2 h-4 w-4" />
                                Memoria Técnica
                            </Button>

                            <Button variant="outline" className="w-full" onClick={() => {
                                toast.info('Exportación a PDF próximamente')
                            }}>
                                <Download className="mr-2 h-4 w-4" />
                                Exportar PDF
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
