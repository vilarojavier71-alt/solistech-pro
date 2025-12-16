'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Download, FileText, Sun, Zap, CheckCircle2, Share2, PanelTop } from 'lucide-react'
import type { SolarPotential } from '@/lib/actions/solar-brain'

interface DesignViewerProps {
    data: SolarPotential
    address: string
    onReset: () => void
}

export function SolarBrainDesignViewer({ data, address, onReset }: DesignViewerProps) {
    const estimatedAnnualGeneration = data.maxArrayPanelsCount * 0.55 * 1600 // Rough calc: Panels * kWp/panel * hours
    const monthlySavings = (estimatedAnnualGeneration / 12) * 0.15 // 0.15 €/kWh

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Propuesta Generada</h2>
                    <p className="text-muted-foreground flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Análisis completado para: <span className="font-semibold text-foreground">{address}</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={onReset}>Nuevo Análisis</Button>
                    <Button variant="secondary">
                        <Share2 className="mr-2 h-4 w-4" />
                        Compartir
                    </Button>
                    <Button>
                        <FileText className="mr-2 h-4 w-4" />
                        Descargar Presupuesto
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Stats */}
                <Card className="lg:col-span-1 border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-yellow-500" />
                            Potencial Solar
                        </CardTitle>
                        <CardDescription>Capacidad máxima detectada</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="text-center p-6 bg-background rounded-xl border shadow-sm">
                            <p className="text-sm text-muted-foreground uppercase tracking-widest">Potencia Pico</p>
                            <div className="text-5xl font-black text-primary mt-2">
                                {(data.maxArrayPanelsCount * 0.45).toFixed(1)} <span className="text-xl text-muted-foreground font-medium">kWp</span>
                            </div>
                            <Badge variant="outline" className="mt-3 bg-green-500/10 text-green-600 border-green-200">
                                {data.maxArrayPanelsCount} Paneles (450W)
                            </Badge>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Eficiencia de Superficie</span>
                                    <span className="font-bold">92%</span>
                                </div>
                                <Progress value={92} className="h-2" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Irradiancia Anual</span>
                                    <span className="font-bold">Alta</span>
                                </div>
                                <Progress value={85} className="h-2 bg-yellow-100 dark:bg-yellow-900"
                                    // @ts-ignore
                                    indicatorClassName="bg-yellow-500"
                                />
                                {/* Note: indicatorClassName might need custom CSS or standard Shadcn adjustment */}
                            </div>
                        </div>

                        <div className="pt-4 border-t">
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <p className="text-xs text-muted-foreground">Generación Est.</p>
                                    <p className="font-bold text-lg">{Math.round(estimatedAnnualGeneration).toLocaleString()} <span className="text-xs font-normal">kWh/año</span></p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Ahorro Est.</p>
                                    <p className="font-bold text-lg text-green-600">{Math.round(monthlySavings)}€ <span className="text-xs font-normal text-muted-foreground">/mes</span></p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Satellite View Simulation */}
                <Card className="lg:col-span-2 overflow-hidden bg-zinc-950 border-zinc-800 relative group">
                    <div className="absolute top-4 right-4 z-10 flex gap-2">
                        <Badge variant="secondary" className="bg-black/50 backdrop-blur text-white border-white/10">
                            IA Confidence: 98%
                        </Badge>
                    </div>

                    {/* Simulated Map Container */}
                    <div className="w-full h-[500px] relative flex items-center justify-center bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=Madrid&zoom=19&size=800x600&maptype=satellite&sensor=false')] bg-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-1000">
                        {/* Overlay Grid to simulate AI scanning */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] pointer-events-none" />

                        {/* Simulated Roof Polygon (simple rect for prototype) */}
                        <div className="relative w-64 h-48 border-2 border-green-500 bg-green-500/10 backdrop-blur-sm rounded transform rotate-3 shadow-[0_0_30px_rgba(16,185,129,0.3)] duration-700 animate-pulse">
                            {/* Panels Grid */}
                            <div className="grid grid-cols-4 gap-1 p-2 h-full">
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <div key={i} className="bg-blue-600/80 border border-blue-400/50 rounded-sm hover:bg-blue-500 transition-colors shadow-sm" title={`Panel #${i + 1}`} />
                                ))}
                            </div>

                            {/* AI Labels */}
                            <div className="absolute -top-6 left-0 bg-green-600 text-white text-[10px] px-2 py-0.5 rounded shadow">
                                Tejado A (Sur)
                            </div>
                            <div className="absolute -bottom-6 right-0 bg-yellow-600 text-white text-[10px] px-2 py-0.5 rounded shadow flex items-center gap-1">
                                <Sun className="h-3 w-3" /> 1850h Sol
                            </div>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10 text-white flex justify-between items-center">
                        <div className="flex gap-4 text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-600 rounded-sm border border-blue-400" />
                                <span>Paneles Propuestos</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 border-2 border-green-500 bg-green-500/20" />
                                <span>Área Útil</span>
                            </div>
                        </div>
                        <div className="text-xs opacity-70">
                            Lat: 40.4168 | Lng: -3.7038
                        </div>
                    </div>
                </Card>

                {/* Shadow Analysis Card (New) */}
                {data.shadowAnalysis && (
                    <Card className="lg:col-span-3 border-primary/20 bg-gradient-to-r from-background to-primary/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <PanelTop className="h-5 w-5 text-purple-500" />
                                Análisis de Sombras (AI)
                            </CardTitle>
                            <CardDescription>Impacto estimado por obstáculos cercanos y horizonte.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-3 gap-6">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Pérdidas por Sombreado</p>
                                <p className="text-2xl font-bold">{data.shadowAnalysis.avgShadingLoss}% <span className="text-sm font-normal text-muted-foreground">anual</span></p>
                                <Progress value={data.shadowAnalysis.avgShadingLoss} max={100} className="h-2 bg-slate-100 dark:bg-slate-800" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Horas Solar Óptimas</p>
                                <p className="text-2xl font-bold">{data.shadowAnalysis.optimalHours}</p>
                                <p className="text-xs text-muted-foreground">Sin obstrucciones significativas</p>
                            </div>
                            <div className="flex items-center justify-center p-4 bg-background/50 rounded-lg border border-dashed">
                                <p className="text-sm text-center text-muted-foreground italic">
                                    "La orientación Sur minimiza naturalmente el impacto de sombras matutinas."
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
