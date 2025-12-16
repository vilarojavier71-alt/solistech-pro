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
    Loader2,
    Calculator
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { CreateOrganizationForm } from '@/components/onboarding/create-organization-form'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { SPANISH_CITIES, searchCities, type CityLocation } from '@/lib/data/spanish-cities'
import { saveCalculation } from '@/lib/actions/calculator'
import { calculateFullROI } from '@/lib/actions/roi-calculator'
import { generateTechnicalMemory } from '@/lib/actions/technical-memory'
import { ProductionChart } from './production-chart'
import { SubsidiesPanel } from './subsidies-panel'
import { TooltipInfo, CommonTooltips } from '@/components/ui/tooltip-info'

// ============================================
// SOLAR CALCULATOR PREMIUM - FULL FEATURED
// ============================================

export function SolarCalculatorPremium({ isPro = false }: { isPro?: boolean }) {
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

    const handleCalculate = async () => {
        setLoading(true)
        try {
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

            // Save calculation automatically
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
                payback: data.payback,
                monthlyProduction: data.monthlyProduction,
                availableArea: availableArea || undefined
            })

            // CHECK ERROR FIRST
            if (savedCalc?.error) {
                if (savedCalc.code === 'ORGANIZATION_REQUIRED') {
                    setShowOrgModal(true)
                    return // Stop execution, show modal
                }
                console.error('Server Action Error:', savedCalc.error)
                throw new Error(savedCalc.error)
            }

            if (savedCalc?.id) {
                setSavedCalculationId(savedCalc.id)

                // Calculate ROI with subsidies
                if (showSubsidies) {
                    setIsCalculatingROI(true)
                    const roiResult = await calculateFullROI(savedCalc.id)

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
        } catch (error: any) {
            console.error('Error:', error)
            toast.error(error.message || 'Error al calcular')
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
            const pdfBlob = await generateTechnicalMemory(savedCalculationId)
            const url = URL.createObjectURL(pdfBlob as Blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `memoria-tecnica-${savedCalculationId}.pdf`
            a.click()
            URL.revokeObjectURL(url)
            toast.success('PDF generado correctamente')
        } catch (error) {
            console.error('Error generating PDF:', error)
            toast.error('Error al generar PDF')
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
                            disabled={loading}
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
                            disabled={!savedCalculationId}
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            Generar Memoria Técnica PDF
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => toast.info('Próximamente: Guardar como proyecto')}
                        >
                            <Save className="mr-2 h-4 w-4" />
                            Guardar como Proyecto
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => toast.info('Próximamente: Crear presentación IA')}
                        >
                            <Sparkles className="mr-2 h-4 w-4" />
                            Crear Presentación IA
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
        </div>
    )
}
