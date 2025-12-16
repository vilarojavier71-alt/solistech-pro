'use client'

import { useState } from 'react'
import { enrichProjectWithCadastre } from '@/lib/actions/projects'
import { GlowCard } from '@/components/ui/glow-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2, Search, Loader2, Copy, CheckCircle, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { RoleGuard } from '@/components/auth/role-guard'

interface CadastreWidgetProps {
    projectId: string
    initialLat?: number
    initialLng?: number
}

export function CadastreWidget({ projectId, initialLat, initialLng }: CadastreWidgetProps) {
    const [lat, setLat] = useState(initialLat?.toString() || '')
    const [lng, setLng] = useState(initialLng?.toString() || '')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<{ reference: string; address: string } | null>(null)

    const handleSearch = async () => {
        if (!lat || !lng) {
            toast.error("Latitud y Longitud son requeridas")
            return
        }

        setLoading(true)
        try {
            const response = await enrichProjectWithCadastre(projectId, parseFloat(lat), parseFloat(lng))

            if (response.error) {
                toast.error(response.error)
            } else if (response.data) {
                setResult({
                    reference: response.data.reference,
                    address: response.data.address
                })
                toast.success("Datos catastrales encontrados y guardados.")
            }
        } catch (error) {
            toast.error("Error de conexión con Catastro")
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success("Copiado al portapapeles")
    }

    return (
        <RoleGuard allowedRoles={['admin', 'owner', 'engineer']}>
            <GlowCard className="border-amber-500/30 bg-amber-500/5">
                <div className="flex items-center gap-2 mb-4 text-amber-600 dark:text-amber-400">
                    <Building2 className="h-5 w-5" />
                    <h3 className="font-semibold">Conexión Sede Catastro</h3>
                </div>

                {!result ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label className="text-xs">Latitud</Label>
                                <Input
                                    value={lat}
                                    onChange={(e) => setLat(e.target.value)}
                                    placeholder="40.416..."
                                    className="h-8 text-xs font-mono"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Longitud</Label>
                                <Input
                                    value={lng}
                                    onChange={(e) => setLng(e.target.value)}
                                    placeholder="-3.703..."
                                    className="h-8 text-xs font-mono"
                                />
                            </div>
                        </div>

                        <Button
                            onClick={handleSearch}
                            disabled={loading}
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                            size="sm"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Conectando OVC...
                                </>
                            ) : (
                                <>
                                    <Search className="h-4 w-4 mr-2" />
                                    Rastrear Parcela
                                </>
                            )}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                        <div className="p-3 bg-background/50 rounded-md border border-amber-200/20 space-y-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Referencia Catastral</div>
                                    <div className="font-mono text-sm font-medium">{result.reference}</div>
                                </div>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(result.reference)}>
                                    <Copy className="h-3 w-3" />
                                </Button>
                            </div>

                            <div className="border-t border-dashed border-muted-foreground/20 my-2"></div>

                            <div>
                                <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Dirección Oficial</div>
                                <div className="text-sm leading-tight">{result.address}</div>
                            </div>
                        </div>

                        <div className="flex items-center justify-center gap-2 text-xs text-green-600 font-medium">
                            <CheckCircle className="h-3 w-3" />
                            Guardado en Proyecto
                        </div>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs h-7"
                            onClick={() => setResult(null)}
                        >
                            Nueva búsqueda
                        </Button>
                    </div>
                )}
            </GlowCard>
        </RoleGuard>
    )
}
