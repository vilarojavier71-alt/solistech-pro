'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { calculateSystemSize } from '@/lib/actions/solar-calculator'
import { Loader2, Sun, Zap, Euro } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

const LOCATIONS = [
    { value: 'madrid', label: 'Madrid (Centro)' },
    { value: 'cataluna', label: 'Cataluña (Noreste)' },
    { value: 'andalucia', label: 'Andalucía (Sur)' },
    { value: 'valencia', label: 'Valencia (Este)' },
    { value: 'galicia', label: 'Galicia (Noroeste)' },
    { value: 'pais-vasco', label: 'País Vasco (Norte)' },
    { value: 'canarias', label: 'Canarias (Insular)' },
    { value: 'baleares', label: 'Baleares (Insular)' },
    { value: 'default', label: 'Otra / Promedio' }
]

export function SolarCalculatorWidget() {
    const [consumption, setConsumption] = useState([350])
    const [location, setLocation] = useState('madrid')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<{
        kwp: number
        panelCount: number
        estimatedGeneration: number
        estimatedSavings: number
    } | null>(null)

    const handleCalculate = async () => {
        setLoading(true)
        try {
            const data = await calculateSystemSize(location, consumption[0])
            setResult(data)
        } catch (error) {
            toast.error("Error al realizar el cálculo")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="w-full h-full border-primary/20 bg-gradient-to-br from-card to-primary/5">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sun className="h-5 w-5 text-yellow-500" />
                    Pre-Dimensionamiento
                </CardTitle>
                <CardDescription>
                    Calcula el tamaño ideal del sistema en segundos.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label>Ubicación del Proyecto</Label>
                    <Select value={location} onValueChange={setLocation}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona una zona" />
                        </SelectTrigger>
                        <SelectContent>
                            {LOCATIONS.map(loc => (
                                <SelectItem key={loc.value} value={loc.value}>
                                    {loc.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between">
                        <Label>Consumo Mensual</Label>
                        <span className="text-sm font-bold text-primary">{consumption[0]} kWh/mes</span>
                    </div>
                    <Slider
                        value={consumption}
                        onValueChange={setConsumption}
                        max={2000}
                        step={10}
                        className="py-4"
                    />
                </div>

                {result && (
                    <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-bottom-2 fade-in duration-500">
                        <div className="space-y-1 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border text-center">
                            <p className="text-xs text-muted-foreground uppercase">Potencia</p>
                            <p className="text-xl font-bold flex items-center justify-center gap-1">
                                <Zap className="h-4 w-4 text-yellow-500" />
                                {result.kwp} kWp
                            </p>
                            <p className="text-xs text-muted-foreground">{result.panelCount} Paneles</p>
                        </div>
                        <div className="space-y-1 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border text-center">
                            <p className="text-xs text-muted-foreground uppercase">Ahorro Est.</p>
                            <p className="text-xl font-bold flex items-center justify-center gap-1">
                                <Euro className="h-4 w-4 text-green-500" />
                                {result.estimatedSavings} €
                            </p>
                            <p className="text-xs text-muted-foreground">/mes aprox.</p>
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter>
                <Button
                    className="w-full"
                    onClick={handleCalculate}
                    disabled={loading}
                >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {result ? 'Recalcular' : 'Calcular Instalación'}
                </Button>
            </CardFooter>
        </Card>
    )
}
