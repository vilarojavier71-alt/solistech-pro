'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, Upload, Wand2 } from 'lucide-react'
import { toast } from 'sonner'
import { analyzeRoof } from '@/lib/actions/solar-brain'

interface InputFormProps {
    onAnalysisComplete: (data: any, address: string) => void
}

export function SolarBrainInputForm({ onAnalysisComplete }: InputFormProps) {
    const [address, setAddress] = useState('')
    const [analyzing, setAnalyzing] = useState(false)

    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!address) return

        setAnalyzing(true)
        try {
            // Mock geocoding (just pass dummy coords for now)
            const result = await analyzeRoof(address, 40.4168, -3.7038)

            if (result.success && result.data) {
                toast.success("Análisis de tejado completado")
                onAnalysisComplete(result.data, address)
            } else {
                toast.error("No se pudo analizar el tejado")
            }
        } catch (error) {
            toast.error("Error de conexión con el motor de IA")
        } finally {
            setAnalyzing(false)
        }
    }

    return (
        <Card className="max-w-xl mx-auto border-2 border-primary/20 shadow-2xl relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl z-0 pointer-events-none" />

            <CardHeader className="text-center relative z-10">
                <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                    <Wand2 className="h-8 w-8 text-primary animate-pulse" />
                </div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    SolarBrain AI
                </CardTitle>
                <CardDescription className="text-lg">
                    Diseño fotovoltaico generativo en segundos.
                    <br />
                    Sube una factura o introduce una dirección.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10">
                <form onSubmit={handleAnalyze} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Dirección del Inmueble</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Ej: Calle Gran Vía 1, Madrid"
                                className="pl-10 h-12 text-lg"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="relative border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer group">
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2 group-hover:text-primary transition-colors" />
                        <p className="text-sm font-medium">Opcional: Arrastra una factura de luz (PDF)</p>
                        <p className="text-xs text-muted-foreground">La IA extraerá el consumo automáticamente</p>
                    </div>

                    <Button
                        type="submit"
                        size="lg"
                        className="w-full text-lg h-12 font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
                        disabled={analyzing || !address}
                    >
                        {analyzing ? (
                            <div className="flex items-center gap-2">
                                <span className="animate-spin text-xl">✨</span>
                                Calculando sombras y geometría...
                            </div>
                        ) : (
                            'Generar Diseño Automático'
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
