'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import {
    KPICardPremium,
    KPIGrid,
    AccordionPremium,
    AccordionGrid,
    AccordionField,
    OptimisticAction,
    LoadingStatePremium
} from '@/components/premium'
import {
    Zap,
    TrendingUp,
    Calendar,
    DollarSign,
    Battery,
    Wrench,
    BarChart3,
    Settings,
    ChevronDown,
    MapPin,
    Download,
    Save,
    FileText,
    Sparkles,
    Loader2
} from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { CreateOrganizationForm } from '@/components/onboarding/create-organization-form'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { SPANISH_CITIES, searchCities, type CityLocation } from '@/lib/data/spanish-cities'
import { calculateFullROI } from '@/lib/actions/roi-calculator'
import { ProductionChart } from './production-chart'
import { SubsidiesPanel } from './subsidies-panel'
import { TooltipInfo, CommonTooltips } from '@/components/ui/tooltip-info'
import { SaveProjectDialog } from './save-project-dialog'
import { createPresentation } from '@/lib/actions/presentation-generator' // AI Presentation
import { useCalculator } from '@/hooks/use-calculator'

// ============================================
// SOLAR CALCULATOR PREMIUM - FULL FEATURED
// ============================================

export function SolarCalculatorPremium({ isPro = false, customers = [] }: { isPro?: boolean, customers?: any[] }) {
    // PROTECTED FEATURE GATE
    if (!isPro) {
        return (
            <div className="relative w-full h-[600px] rounded-xl overflow-hidden border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-900 flex flex-col items-center justify-center text-center p-8 space-y-6">
                <div className="absolute inset-0 bg-grid-slate-200/50 dark:bg-grid-navy-700/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />

                <div className="relative z-10 bg-white/80 dark:bg-navy-800/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-amber-200/50 dark:border-amber-700/50 max-w-md mx-auto animate-in zoom-in-95 duration-500">
                    <div className="h-16 w-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                    </div>

                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        Funcionalidad Premium
                    </h2>

                    <p className="text-slate-600 dark:text-slate-300 mb-6">
                        Desbloquea la Calculadora Solar profesional con datos de radiación satelital, análisis de ROI avanzado y generación de memorias técnicas.
                    </p>

                    <Button
                        size="lg"
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25"
                        onClick={() => window.location.href = '/dashboard/settings/billing'}
                    >
                        Actualizar a Plan PRO
                    </Button>

                    <p className="text-xs text-slate-500 mt-4">
                        Incluye acceso a subvenciones y panel de ingeniero.
                    </p>
                </div>

                {/* Background visual clutter to simulate blocked app */}
                <div className="absolute inset-0 z-0 blur-sm pointer-events-none opacity-50 flex flex-col gap-4 p-8">
                    <div className="h-32 bg-slate-200 dark:bg-navy-700 rounded-lg w-full" />
                    <div className="grid grid-cols-3 gap-4">
                        <div className="h-24 bg-slate-200 dark:bg-navy-700 rounded-lg" />
                        <div className="h-24 bg-slate-200 dark:bg-navy-700 rounded-lg" />
                        <div className="h-24 bg-slate-200 dark:bg-navy-700 rounded-lg" />
                    </div>
                </div>
            </div>
        )
    }

    // Form state - ALL options from original
    const [consumption, setConsumption] = useState<number>(4000)
    const [installationType, setInstallationType] = useState<string>('residential')
    const [location, setLocation] = useState<{ lat: number; lng: number }>({ lat: 40.4168, lng: -3.7038 })
    const [locationName, setLocationName] = useState<string>('Madrid, España')
    const [roofOrientation, setRoofOrientation] = useState<string>('south')
    const [roofTilt, setRoofTilt] = useState<number>(30)
    const [availableArea, setAvailableArea] = useState<number>(0)

    // Location selector states
    const [useManualCoords, setUseManualCoords] = useState<boolean>(false)
    const [citySearch, setCitySearch] = useState<string>('')
    const [filteredCities, setFilteredCities] = useState<CityLocation[]>(SPANISH_CITIES.slice(0, 10))
    const [manualLat, setManualLat] = useState<string>('40.4168')
    const [manualLng, setManualLng] = useState<string>('-3.7038')

    // Subsidies states
    const [region, setRegion] = useState<string>('Comunidad Valenciana')
    const [showSubsidies, setShowSubsidies] = useState<boolean>(true)
    const [subsidies, setSubsidies] = useState<any[]>([])
    const [subsidiesBreakdown, setSubsidiesBreakdown] = useState<any>(null)

    // Results and loading states
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [savedCalculationId, setSavedCalculationId] = useState<string | null>(null)
    const [fullCalculation, setFullCalculation] = useState<any | null>(null)
    const [isCalculatingROI, setIsCalculatingROI] = useState(false)
    const [expertMode, setExpertMode] = useState(false)
    const [showOrgModal, setShowOrgModal] = useState(false)
    const [showSaveModal, setShowSaveModal] = useState(false)


    // Load subsidies when region changes
    useEffect(() => {
        const fetchSubsidies = async () => {
            try {
                const response = await fetch(`/api/subsidies?region=${encodeURIComponent(region)}`)
                const data = await response.json()
                setSubsidies(data)
            } catch (error) {
                console.error('Error loading subsidies:', error)
            }
        }
        if (region) {
            fetchSubsidies()
        }
    }, [region])

    // City search filter
    useEffect(() => {
        if (citySearch.length > 0) {
            const results = searchCities(citySearch)
            setFilteredCities(results.slice(0, 10))
        } else {
            setFilteredCities(SPANISH_CITIES.slice(0, 10))
        }
    }, [citySearch])

    // State for presentation generation
    const [isGeneratingPresentation, setIsGeneratingPresentation] = useState(false)

    const handleCreatePresentation = async () => {
        if (!savedCalculationId) {
            toast.error('Primero realiza un cálculo para tener datos base.')
            return
        }

        setIsGeneratingPresentation(true)
        toast.info('Iniciando Inteligencia Artificial... Generando narrativa y diapositivas.')

        try {
            const customerId = customers.length > 0 ? customers[0].id : undefined

            if (!customerId) {
                toast.warning('Se requiere al menos un cliente en la base de datos para asignar la presentación.')
                setIsGeneratingPresentation(false)
                return
            }

            const result = await createPresentation(
                customerId,
                undefined,
                savedCalculationId
            )

            if (result.error) {
                toast.error(result.error)
            } else if (result.success && result.buffer) {
                toast.success('¡Presentación Generada!')

                // Decode base64 to blob
                const binaryString = window.atob(result.buffer)
                const len = binaryString.length
                const bytes = new Uint8Array(len)
                for (let i = 0; i < len; i++) {
                    bytes[i] = binaryString.charCodeAt(i)
                }
                const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' })

                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `Propuesta_Solar_IA_${new Date().toISOString().slice(0, 10)}.pptx`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
            }
        } catch (err) {
            console.error(err)
            toast.error('Error en el motor de IA')
        } finally {
            setIsGeneratingPresentation(false)
        }
    }

    // Hook centralizado para cálculos
    const { calculate, generatePDF, isCalculating, isGeneratingPDF } = useCalculator()

    const handleCalculate = async () => {
        setLoading(true)
        try {
            const result = await calculate({
                consumption,
                installationType,
                location,
                roofOrientation,
                roofTilt,
                locationName,
                availableArea
            })

            if (result.savedId) {
                setSavedCalculationId(result.savedId)
                setResult(result.calculation)

                // Calculate ROI with subsidies
                if (showSubsidies) {
                    setIsCalculatingROI(true)
                    const roiResult = await calculateFullROI(result.savedId)

                    if (roiResult.success && roiResult.data) {
                        setFullCalculation(roiResult.data)
                        const breakdown = calculateSubsidiesBreakdown(
                            roiResult.data.gross_cost || 0,
                            subsidies
                        )
                        setSubsidiesBreakdown(breakdown)
                    }
                    setIsCalculatingROI(false)
                }
            }

            toast.success('Cálculo completado y guardado')
        } catch (error: unknown) {
            const err = error instanceof Error ? error : new Error('Error desconocido')
            if (err.message === 'ORGANIZATION_REQUIRED') {
                setShowOrgModal(true)
                return
            }
            toast.error(err.message || 'Error al calcular')
        } finally {
            setLoading(false)
        }
    }

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

        return { direct, irpf, total: direct + irpf }
    }

    const handleGeneratePDF = async () => {
        if (!savedCalculationId) {
            toast.error('Primero debes calcular una instalación')
            return
        }

        try {
            await generatePDF(savedCalculationId)
            // El hook maneja la descarga automáticamente
        } catch (error) {
            // El hook ya muestra el error con toast
        }
    }

    return (
        <div className="space-y-8">
            {/* ============================================
          INPUT SECTION - ALL OPTIONS
          ============================================ */}

            <Card className="card-premium shadow-premium">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-primary" />
                        Configuración de la Instalación
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Basic Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Label>Consumo Anual (kWh)</Label>
                                <TooltipInfo
                                    title="⚡ Consumo Anual"
                                    content="Energía eléctrica que consumes al año.
Encuéntralo en tu factura de luz o calcula: consumo mensual x 12"
                                />
                            </div>
                            <Input
                                type="number"
                                value={consumption}
                                onChange={(e) => setConsumption(Number(e.target.value))}
                                className="input-premium"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Tipo de Instalación</Label>
                            <Select value={installationType} onValueChange={setInstallationType}>
                                <SelectTrigger className="input-premium">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="residential">Residencial</SelectItem>
                                    <SelectItem value="commercial">Comercial</SelectItem>
                                    <SelectItem value="industrial">Industrial</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Label>Área Disponible (m²)</Label>
                                <TooltipInfo
                                    title="📏 Área Disponible"
                                    content="Espacio útil en tu tejado para instalar paneles.
Cada panel ocupa ~2 m². Ejemplo: 10 paneles = 20 m²"
                                />
                            </div>
                            <Input
                                type="number"
                                value={availableArea}
                                onChange={(e) => setAvailableArea(Number(e.target.value))}
                                className="input-premium"
                                placeholder="Opcional"
                            />
                        </div>
                    </div>

                    {/* Location Selector */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-base font-semibold">Ubicación</Label>
                            <div className="flex items-center gap-2">
                                <Label className="text-sm">Coordenadas manuales</Label>
                                <Switch
                                    checked={useManualCoords}
                                    onCheckedChange={setUseManualCoords}
                                />
                            </div>
                        </div>

                        {!useManualCoords ? (
                            <div className="space-y-2">
                                <Input
                                    placeholder="Buscar ciudad..."
                                    value={citySearch}
                                    onChange={(e) => setCitySearch(e.target.value)}
                                    className="input-premium"
                                />
                                <Select
                                    value={locationName}
                                    onValueChange={(value) => {
                                        const city = filteredCities.find(c => `${c.name}, ${c.province}` === value)
                                        if (city) {
                                            setLocation({ lat: city.lat, lng: city.lng })
                                            setLocationName(`${city.name}, ${city.province}`)
                                        }
                                    }}
                                >
                                    <SelectTrigger className="input-premium">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredCities.map((city) => (
                                            <SelectItem key={`${city.name}-${city.province}`} value={`${city.name}, ${city.province}`}>
                                                {city.name}, {city.province} ({city.region})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Latitud</Label>
                                        <Input
                                            type="number"
                                            step="0.0001"
                                            value={manualLat}
                                            onChange={(e) => {
                                                setManualLat(e.target.value)
                                                setLocation({ ...location, lat: parseFloat(e.target.value) })
                                            }}
                                            className="input-premium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Longitud</Label>
                                        <Input
                                            type="number"
                                            step="0.0001"
                                            value={manualLng}
                                            onChange={(e) => {
                                                setManualLng(e.target.value)
                                                setLocation({ ...location, lng: parseFloat(e.target.value) })
                                            }}
                                            className="input-premium"
                                        />
                                    </div>
                                </div>

                                {/* GEO-INTELLIGENCE PREVIEW */}
                                <div className="rounded-lg border border-indigo-100 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/30 overflow-hidden">
                                    <div className="relative h-40 w-full bg-slate-200">
                                        <iframe
                                            width="100%"
                                            height="100%"
                                            frameBorder="0"
                                            scrolling="no"
                                            marginHeight={0}
                                            marginWidth={0}
                                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.lng - 0.05}%2C${location.lat - 0.05}%2C${location.lng + 0.05}%2C${location.lat + 0.05}&layer=mapnik&marker=${location.lat}%2C${location.lng}`}
                                            className="opacity-90 hover:opacity-100 transition-opacity"
                                        />
                                        <div className="absolute bottom-2 right-2 bg-white/90 dark:bg-black/80 px-2 py-1 text-[10px] rounded shadow">
                                            © OpenStreetMap
                                        </div>
                                    </div>

                                    <div className="p-3">
                                        <SolarPotentialIndicator lat={location.lat} lng={location.lng} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Roof Configuration */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Label>Orientación del Tejado</Label>
                                {CommonTooltips.orientacion}
                            </div>
                            <Select value={roofOrientation} onValueChange={setRoofOrientation}>
                                <SelectTrigger className="input-premium">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="south">Sur (Óptima)</SelectItem>
                                    <SelectItem value="southeast">Sureste</SelectItem>
                                    <SelectItem value="southwest">Suroeste</SelectItem>
                                    <SelectItem value="east">Este</SelectItem>
                                    <SelectItem value="west">Oeste</SelectItem>
                                    <SelectItem value="north">Norte</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Label>Inclinación del Tejado: {roofTilt}°</Label>
                                {CommonTooltips.inclinacion}
                            </div>
                            <Slider
                                value={[roofTilt]}
                                onValueChange={([value]) => setRoofTilt(value)}
                                min={0}
                                max={90}
                                step={5}
                                className="mt-2"
                            />
                        </div>
                    </div>

                    {/* Subsidies Configuration */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-base font-semibold">Subvenciones</Label>
                            <Switch
                                checked={showSubsidies}
                                onCheckedChange={setShowSubsidies}
                            />
                        </div>
                        {showSubsidies && (
                            <Select value={region} onValueChange={setRegion}>
                                <SelectTrigger className="input-premium">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Andalucía">Andalucía</SelectItem>
                                    <SelectItem value="Aragón">Aragón</SelectItem>
                                    <SelectItem value="Asturias">Asturias</SelectItem>
                                    <SelectItem value="Islas Baleares">Islas Baleares</SelectItem>
                                    <SelectItem value="Canarias">Canarias</SelectItem>
                                    <SelectItem value="Cantabria">Cantabria</SelectItem>
                                    <SelectItem value="Castilla y León">Castilla y León</SelectItem>
                                    <SelectItem value="Castilla-La Mancha">Castilla-La Mancha</SelectItem>
                                    <SelectItem value="Cataluña">Cataluña</SelectItem>
                                    <SelectItem value="Comunidad Valenciana">Comunidad Valenciana</SelectItem>
                                    <SelectItem value="Extremadura">Extremadura</SelectItem>
                                    <SelectItem value="Galicia">Galicia</SelectItem>
                                    <SelectItem value="Madrid">Madrid</SelectItem>
                                    <SelectItem value="Murcia">Murcia</SelectItem>
                                    <SelectItem value="Navarra">Navarra</SelectItem>
                                    <SelectItem value="País Vasco">País Vasco</SelectItem>
                                    <SelectItem value="La Rioja">La Rioja</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    {/* Calculate Button */}
                    <OptimisticAction
                        onAction={handleCalculate}
                        successMessage="Cálculo completado"
                        loadingMessage="Calculando instalación óptima..."
                    >
                        <Button
                            size="lg"
                            className="w-full"
                            style={{
                                background: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)',
                                color: 'white',
                                fontWeight: 600,
                                border: 'none',
                                boxShadow: '0 4px 6px -1px rgba(8, 145, 178, 0.3), 0 2px 4px -1px rgba(8, 145, 178, 0.2)'
                            }}
                            disabled={loading || isCalculating}
                        >
                            <Zap className="mr-2 h-5 w-5" />
                            {loading ? 'Calculando...' : 'Calcular Instalación'}
                        </Button>
                    </OptimisticAction>
                </CardContent>
            </Card>

            {/* Loading State */}
            {loading && (
                <LoadingStatePremium
                    type="narrative"
                    steps={[
                        { label: "Consultando datos de irradiación solar" },
                        { label: "Calculando producción óptima" },
                        { label: "Analizando ROI y subvenciones" },
                        { label: "Generando resultados" }
                    ]}
                    currentStep={2}
                    progress={65}
                />
            )}

            {/* Results - Level 1: KPIs Hero */}
            {result && !loading && (
                <>
                    <KPIGrid>
                        <KPICardPremium
                            icon={<Zap />}
                            label="Potencia"
                            value={`${result.systemSize} kWp`}
                            subtitle={`${result.panels} paneles`}
                            trend={{ value: "+2.3%", direction: "up" }}
                            sparkline={result.monthlyProduction?.slice(0, 12) || [12, 15, 13, 18, 20, 22, 25, 23, 21, 24, 26, 28]}
                            variant="teal"
                        />

                        <KPICardPremium
                            icon={<TrendingUp />}
                            label="ROI Anual"
                            value={`${fullCalculation?.roi_with_subsidies || result.roi}%`}
                            subtitle="Retorno de inversión"
                            variant="gold"
                        />

                        <KPICardPremium
                            icon={<Calendar />}
                            label="Payback"
                            value={`${fullCalculation?.payback_with_subsidies || result.payback} años`}
                            subtitle="Amortización"
                            variant="premium"
                        />

                        <KPICardPremium
                            icon={<DollarSign />}
                            label="Ahorro Anual"
                            value={`€${result.savings?.toLocaleString()}`}
                            subtitle="En factura eléctrica"
                            trend={{ value: "+€450", direction: "up" }}
                            variant="gold"
                        />

                        <KPICardPremium
                            icon={<Battery />}
                            label="Producción"
                            value={`${result.production?.toLocaleString()} kWh`}
                            subtitle="Energía anual"
                            sparkline={result.monthlyProduction?.slice(0, 12)}
                            variant="teal"
                        />
                    </KPIGrid>

                    {/* Level 2: Technical Accordions */}
                    <AccordionPremium
                        type="multiple"
                        items={[
                            {
                                id: 'system',
                                title: 'Configuración del Sistema',
                                icon: <Wrench />,
                                badge: 'Detalles técnicos',
                                defaultOpen: true,
                                content: (
                                    <AccordionGrid cols={3}>
                                        <AccordionField label="Paneles" value={`${result.panels} x 450W`} />
                                        <AccordionField label="Potencia Total" value={`${result.systemSize} kWp`} />
                                        <AccordionField label="Área Requerida" value={`${result.requiredArea || (result.panels * 2)} m²`} />
                                        <AccordionField label="Orientación" value={roofOrientation === 'south' ? 'Sur (Óptima)' : roofOrientation} />
                                        <AccordionField label="Inclinación" value={`${roofTilt}°`} />
                                        <AccordionField label="Ubicación" value={locationName} />
                                        <AccordionField label="Tipo" value={installationType === 'residential' ? 'Residencial' : installationType} />
                                        <AccordionField label="Consumo Anual" value={`${consumption.toLocaleString()} kWh`} />
                                        <AccordionField label="Producción Anual" value={`${result.production?.toLocaleString()} kWh`} />
                                    </AccordionGrid>
                                )
                            },
                            {
                                id: 'financial',
                                title: 'Análisis Financiero',
                                icon: <DollarSign />,
                                badge: showSubsidies ? 'Con subvenciones' : 'Sin subvenciones',
                                content: (
                                    <div className="space-y-6">
                                        <AccordionGrid cols={2}>
                                            <AccordionField
                                                label="Inversión Bruta"
                                                value={`€${fullCalculation?.gross_cost?.toLocaleString() || '18,500'}`}
                                            />
                                            {showSubsidies && subsidiesBreakdown && (
                                                <>
                                                    <AccordionField
                                                        label="Subvenciones Directas"
                                                        value={`€${subsidiesBreakdown.direct.toLocaleString()}`}
                                                    />
                                                    <AccordionField
                                                        label="Deducción IRPF"
                                                        value={`€${subsidiesBreakdown.irpf.toLocaleString()}`}
                                                    />
                                                    <AccordionField
                                                        label="Total Subvenciones"
                                                        value={`€${subsidiesBreakdown.total.toLocaleString()}`}
                                                    />
                                                </>
                                            )}
                                            <AccordionField
                                                label="Coste Neto"
                                                value={`€${fullCalculation?.net_cost?.toLocaleString() || '14,300'}`}
                                            />
                                            <AccordionField
                                                label="Ahorro Anual"
                                                value={`€${result.savings?.toLocaleString()}`}
                                            />
                                            <AccordionField
                                                label="ROI"
                                                value={`${fullCalculation?.roi_with_subsidies || result.roi}%`}
                                            />
                                            <AccordionField
                                                label="Payback"
                                                value={`${fullCalculation?.payback_with_subsidies || result.payback} años`}
                                            />
                                        </AccordionGrid>

                                        {showSubsidies && subsidies.length > 0 && (
                                            <SubsidiesPanel subsidies={subsidies} />
                                        )}
                                    </div>
                                )
                            },
                            {
                                id: 'production',
                                title: 'Producción y Consumo',
                                icon: <BarChart3 />,
                                badge: '12 meses',
                                content: (
                                    <div className="space-y-6">
                                        <AccordionGrid cols={3}>
                                            <AccordionField
                                                label="Producción Anual"
                                                value={`${result.production?.toLocaleString()} kWh`}
                                            />
                                            <AccordionField
                                                label="Consumo Anual"
                                                value={`${consumption.toLocaleString()} kWh`}
                                            />
                                            <AccordionField
                                                label="Autoconsumo"
                                                value={`${Math.min(100, Math.round((result.production / consumption) * 100))}%`}
                                            />
                                        </AccordionGrid>

                                        {result.monthlyProduction && (
                                            <ProductionChart monthlyProduction={result.monthlyProduction} />
                                        )}
                                    </div>
                                )
                            }
                        ]}
                    />

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-4">
                        <Button
                            variant="outline"
                            onClick={handleGeneratePDF}
                            disabled={!savedCalculationId || isGeneratingPDF}
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            {isGeneratingPDF ? 'Generando PDF...' : 'Generar Memoria Técnica PDF'}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                if (!result) {
                                    toast.error('Primero debes realizar un cálculo')
                                    return
                                }
                                setShowSaveModal(true)
                            }}
                            disabled={!result}
                        >
                            <Save className="mr-2 h-4 w-4" />
                            Guardar como Proyecto
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleCreatePresentation}
                            disabled={isGeneratingPresentation || !result}
                            className={cn(isGeneratingPresentation && "animate-pulse border-amber-500 text-amber-600")}
                        >
                            {isGeneratingPresentation ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generando con IA...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-4 w-4 text-amber-500" />
                                    Crear Presentación IA
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Level 3: Expert Mode */}
                    <div className="flex justify-center">
                        <Button
                            variant="ghost"
                            onClick={() => setExpertMode(!expertMode)}
                            className="text-slate-600 dark:text-slate-400"
                        >
                            <Settings className="mr-2 h-4 w-4" />
                            {expertMode ? 'Ocultar' : 'Mostrar'} Modo Ingeniero
                            <ChevronDown className={cn(
                                "ml-2 h-4 w-4 transition-transform",
                                expertMode && "rotate-180"
                            )} />
                        </Button>
                    </div>

                    {expertMode && fullCalculation && (
                        <Card className="glass-strong border-2 border-navy-500/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Settings className="h-5 w-5 text-navy-600" />
                                    Modo Ingeniero - Datos Completos
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <pre className="text-xs bg-slate-50 dark:bg-navy-900 p-4 rounded-lg overflow-auto max-h-96">
                                        {JSON.stringify(fullCalculation, null, 2)}
                                    </pre>
                                    <Button variant="outline" className="w-full">
                                        <Download className="mr-2 h-4 w-4" />
                                        Exportar Datos Completos a JSON
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                </>
            )}

            <Dialog open={showOrgModal} onOpenChange={setShowOrgModal}>
                <DialogContent className="sm:max-w-[500px] border-none bg-transparent shadow-none p-0">
                    <CreateOrganizationForm />
                </DialogContent>
            </Dialog>

            <SaveProjectDialog
                open={showSaveModal}
                onOpenChange={setShowSaveModal}
                calculationData={{
                    systemSize: result?.systemSize,
                    production: result?.production,
                    savings: result?.savings,
                    panels: result?.panels,
                    roi: fullCalculation?.roi_with_subsidies || result?.roi,
                    location: location
                }}
                customers={customers}
            />
        </div>
    )
}

function SolarPotentialIndicator({ lat, lng }: { lat: number, lng: number }) {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(false)

    // Debounce effect
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData()
        }, 1000) // 1s debounce
        return () => clearTimeout(timer)
    }, [lat, lng])

    const fetchData = async () => {
        setLoading(true)
        setError(false)
        try {
            const res = await fetch(`/api/solar-radiation?lat=${lat}&lon=${lng}`)
            if (res.ok) {
                const json = await res.json()
                setData(json.data)
            } else {
                setError(true)
            }
        } catch (e) {
            setError(true)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="text-xs text-slate-500 flex items-center animate-pulse"><Loader2 className="h-3 w-3 animate-spin mr-2" /> Analizando radiación solar satelital...</div>

    if (error) return <div className="text-xs text-red-500">Sin datos de satélite</div>

    if (!data) return null

    // Determine quality label
    const production = data.E_y // Annual kWh per 1kWp
    let quality = 'Estándar'
    let color = 'text-yellow-600'

    if (production > 1600) { quality = 'Excelente'; color = 'text-green-600' }
    else if (production > 1400) { quality = 'Muy Buena'; color = 'text-emerald-600' }
    else if (production > 1200) { quality = 'Buena'; color = 'text-blue-600' }

    return (
        <div className="flex items-center justify-between text-sm mt-3 pt-3 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-full bg-white shadow-sm ring-1 ring-inset ${color.replace('text-', 'ring-').replace('600', '100')} ${color.replace('text-', 'bg-').replace('600', '50')}`}>
                    <Sparkles className={`h-3 w-3 ${color}`} />
                </div>
                <div>
                    <span className="block font-bold text-slate-700 dark:text-slate-200">
                        {production?.toFixed(0)} <span className="text-[10px] font-normal text-slate-500">kWh/kWp/año</span>
                    </span>
                </div>
            </div>

            <div className="text-right">
                <span className={`block font-bold ${color}`}>{quality}</span>
                <span className="text-[10px] text-slate-400">Datos PVGIS (UE)</span>
            </div>
        </div>
    )
}
