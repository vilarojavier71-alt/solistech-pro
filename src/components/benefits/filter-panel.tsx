
'use client'

import { SlidersHorizontal, Map } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'

interface FilterPanelProps {
    region: string
    onRegionChange: (value: string) => void
    minIbi: number
    onMinIbiChange: (value: number) => void
}

const REGIONS = [
    "Andalucía", "Aragón", "Asturias", "Canarias", "Cantabria", "Castilla y León",
    "Castilla-La Mancha", "Cataluña", "Comunidad Valenciana", "Extremadura",
    "Galicia", "Islas Baleares", "La Rioja", "Comunidad de Madrid", "Región de Murcia",
    "Navarra", "País Vasco"
]

export function FilterPanel({ region, onRegionChange, minIbi, onMinIbiChange }: FilterPanelProps) {
    return (
        <Card className="border-0 shadow-none bg-transparent">
            <CardContent className="p-0 space-y-6">
                <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                        <Map className="h-4 w-4" /> Comunidad Autónoma
                    </Label>
                    <Select value={region} onValueChange={(val) => onRegionChange(val === 'all' ? '' : val)}>
                        <SelectTrigger className="w-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                            <SelectValue placeholder="Todas las comunidades" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas las comunidades</SelectItem>
                            {REGIONS.map(r => (
                                <SelectItem key={r} value={r}>{r}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <Label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                            <SlidersHorizontal className="h-4 w-4" /> Mínimo IBI
                        </Label>
                        <span className="text-sm font-bold text-primary">{minIbi}%</span>
                    </div>
                    <Slider
                        defaultValue={[0]}
                        value={[minIbi]}
                        max={100}
                        step={10}
                        onValueChange={(val) => onMinIbiChange(val[0])}
                        className="py-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground px-1">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
