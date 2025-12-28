
'use client'

import { motion } from 'framer-motion'
import { MapPin, TrendingUp, Info, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MunicipalBenefit } from '@/hooks/use-municipal-benefits'
import { cn } from '@/lib/utils'

interface BenefitCardProps {
    benefit: MunicipalBenefit
    projectCost?: number
}

export function BenefitCard({ benefit, projectCost = 15000 }: BenefitCardProps) {
    const ibiSavings = (projectCost * 0.7 * 0.007) * (benefit.ibi_percentage / 100) * benefit.ibi_years
    const icioSavings = (projectCost * 0.03) * (benefit.icio_percentage / 100)
    const totalSavings = Math.round(ibiSavings + icioSavings)

    const getScopeBadge = (level: string) => {
        switch (level) {
            case 'municipality': return { label: 'Municipal', className: 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20' }
            case 'comarca': return { label: 'Comarcal', className: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20' }
            default: return { label: 'Regional', className: 'bg-zinc-500/10 text-zinc-500 hover:bg-zinc-500/20 border-zinc-500/20' }
        }
    }

    const badge = getScopeBadge(benefit.scope_level)

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.3 }}
        >
            <Card className="h-full border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
                <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <MapPin className="h-4 w-4 text-primary" />
                                {benefit.municipality || benefit.autonomous_community}
                            </CardTitle>
                            <CardDescription>
                                {benefit.province && `${benefit.province}, `}
                                {benefit.autonomous_community}
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className={cn("transition-colors", badge.className)}>
                            {badge.label}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700">
                            <p className="text-xs text-muted-foreground font-medium mb-1">IBI</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-primary">{benefit.ibi_percentage}%</span>
                                <span className="text-xs text-muted-foreground">x {benefit.ibi_years} años</span>
                            </div>
                        </div>
                        <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700">
                            <p className="text-xs text-muted-foreground font-medium mb-1">ICIO</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{benefit.icio_percentage}%</span>
                                <span className="text-xs text-muted-foreground">único</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-4 border border-amber-500/20">
                        <div className="flex items-center justify-between relative z-10">
                            <div>
                                <p className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                                    <TrendingUp className="h-3.5 w-3.5" />
                                    Ahorro Estimado
                                </p>
                                <p className="text-xs text-amber-600/80 dark:text-amber-500/80 mt-0.5">
                                    Proyecto de {projectCost.toLocaleString()}€
                                </p>
                            </div>
                            <span className="text-2xl font-bold text-amber-600 dark:text-amber-500">
                                {totalSavings.toLocaleString()}€
                            </span>
                        </div>
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-transparent blur-2xl rounded-full -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-500" />
                    </div>

                    {benefit.requirements.length > 0 && (
                        <div className="mt-4 space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                <Info className="h-3.5 w-3.5" /> Requisitos clave
                            </p>
                            <ul className="text-xs text-muted-foreground space-y-1 ml-1">
                                {benefit.requirements.slice(0, 2).map((req, i) => (
                                    <li key={i} className="flex items-start gap-1.5">
                                        <CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                                        <span className="line-clamp-1">{req}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    )
}
