'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, Zap } from 'lucide-react'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import { InvoiceData, extractInvoiceData } from '@/lib/services/invoice-ocr'

// Dynamic import with NO SSR to avoid build/rendering issues with ReactPDF
const ContractDownloader = dynamic(
    () => import('@/components/switching/contract-downloader'),
    {
        ssr: false,
        loading: () => <Button disabled className="w-full">Cargando Generador...</Button>
    }
)

export default function SwitchingPage() {
    const [step, setStep] = useState(1)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [extractedData, setExtractedData] = useState<InvoiceData | null>(null)

    // Mock extraction simulation
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsAnalyzing(true)
        toast.info('Analizando factura con IA...')

        setIsAnalyzing(true)
        toast.info('Analizando factura con IA...')

        // SIMULACIÓN: En producción usaríamos un lector PDF real
        setTimeout(() => {
            // Texto hardcodeado simula el contenido de un PDF
            const mockPdfText = "Factura Luz. CUPS: ES0021000000000000AA. Potencia P1: 5,5 kW"
            const data = extractInvoiceData(mockPdfText)

            setExtractedData(data)
            setIsAnalyzing(false)
            setStep(2)
            toast.success('Datos extraídos correctamente')
        }, 2000)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Energy Switching Assistant</h1>
                <p className="text-muted-foreground">Sube tu factura y encuentra una tarifa mejor en segundos.</p>
            </div>

            {/* Stepper Visual */}
            <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
                <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : ''}`}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-current">1</div>
                    Carga
                </div>
                <div className="h-px w-8 bg-border" />
                <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : ''}`}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-current">2</div>
                    Análisis
                </div>
                <div className="h-px w-8 bg-border" />
                <div className={`flex items-center gap-2 ${step >= 3 ? 'text-primary' : ''}`}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-current">3</div>
                    Cambio
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Panel Izquierdo: Carga / Datos */}
                <Card>
                    <CardHeader>
                        <CardTitle>Tu Factura Actual</CardTitle>
                        <CardDescription>
                            Sube el PDF para que extraigamos los datos automáticamente
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {step === 1 ? (
                            <div className="border-2 border-dashed rounded-lg p-12 text-center hover:bg-muted/50 transition-colors">
                                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                <Label htmlFor="invoice-upload" className="cursor-pointer">
                                    <span className="text-primary font-semibold hover:underline">Haz clic para subir</span> o arrastra aquí
                                    <Input
                                        id="invoice-upload"
                                        type="file"
                                        accept=".pdf"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                    />
                                </Label>
                                <p className="text-xs text-muted-foreground mt-2">PDF hasta 5MB</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <Label>CUPS Detectado</Label>
                                    <Input value={extractedData?.cups || ''} readOnly className="bg-muted font-mono" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Potencia P1</Label>
                                        <Input value={extractedData?.powers.p1 + ' kW' || ''} readOnly className="bg-muted" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>DNI Titular</Label>
                                        <Input value={extractedData?.holderDni || 'No detectado'} readOnly className="bg-muted" />
                                    </div>
                                </div>
                                <Button variant="outline" onClick={() => setStep(1)} className="w-full">
                                    Subir otra factura
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Panel Derecho: Resultados / Comparativa */}
                {step >= 2 && (
                    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Zap className="h-5 w-5 text-yellow-400" />
                                Ahorro Estimado
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="h-48 flex items-end justify-center gap-8 pb-4">
                                {/* Gráfico Simplificado CSS */}
                                <div className="flex flex-col items-center gap-2">
                                    <span className="text-sm font-medium">Actual</span>
                                    <div className="w-16 bg-red-500/80 rounded-t-lg h-32 relative group">
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 font-bold">120€</div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <span className="text-sm font-medium text-green-400">Recomendada</span>
                                    <div className="w-16 bg-green-500 rounded-t-lg h-24 relative group animate-pulse-slow">
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 font-bold text-green-400">85€</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm opacity-80">Ahorro anual estimado</span>
                                    <span className="text-2xl font-bold text-green-400">420€</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="opacity-60">Compañía recomendada</span>
                                    <span className="font-semibold">Energía Verde SL</span>
                                </div>
                            </div>

                            <ContractDownloader
                                data={{
                                    holderName: 'Usuario Demo',
                                    holderDni: extractedData?.holderDni || '',
                                    cups: extractedData?.cups || '',
                                    p1: extractedData?.powers.p1 || 0,
                                    p2: extractedData?.powers.p2 || 0
                                }}
                                tariff={{
                                    company: 'Energía Verde SL',
                                    planName: 'Tarifa Ahorro Total',
                                    priceEnergy: 0.12,
                                    priceP1: 30.20
                                }}
                                cups={extractedData?.cups || ''}
                            />
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
