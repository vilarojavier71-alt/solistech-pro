'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    BrainCircuit,
    Calculator,
    UserPlus,
    FileSpreadsheet,
    Cloud,
    Sparkles,
    ArrowRight,
    Zap
} from 'lucide-react'

interface ToolCardProps {
    title: string
    description: string
    icon: React.ReactNode
    href: string
    badge?: string
    badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline'
    category: 'engineering' | 'sales' | 'system'
    disabled?: boolean
}

function ToolCard({ title, description, icon, href, badge, badgeVariant = 'secondary', category, disabled }: ToolCardProps) {
    const categoryColors = {
        engineering: 'from-blue-500/10 to-purple-500/10 border-blue-500/20 hover:border-blue-500/50',
        sales: 'from-green-500/10 to-emerald-500/10 border-green-500/20 hover:border-green-500/50',
        system: 'from-slate-500/10 to-zinc-500/10 border-slate-500/20 hover:border-slate-500/50'
    }

    const content = (
        <Card className={`group relative overflow-hidden bg-gradient-to-br ${categoryColors[category]} transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
            {badge && (
                <Badge variant={badgeVariant} className="absolute top-3 right-3 text-xs">
                    {badge}
                </Badge>
            )}
            <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-background/80 shadow-sm group-hover:shadow-md transition-shadow">
                        {icon}
                    </div>
                    <div>
                        <CardTitle className="text-lg">{title}</CardTitle>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <CardDescription className="text-sm mb-4">{description}</CardDescription>
                <div className="flex items-center text-sm font-medium text-primary group-hover:underline">
                    Abrir <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
            </CardContent>
        </Card>
    )

    if (disabled) return content

    return <Link href={href}>{content}</Link>
}

export default function ToolsPage() {
    const tools: ToolCardProps[] = [
        // Engineering Tools
        {
            title: 'SolarBrain AI',
            description: 'Diseño fotovoltaico generativo en segundos. Análisis de tejado, sombras y producción con IA.',
            icon: <BrainCircuit className="h-6 w-6 text-purple-500" />,
            href: '/dashboard/solar-brain',
            badge: 'Nuevo',
            badgeVariant: 'default',
            category: 'engineering'
        },
        {
            title: 'Calculadora Manual',
            description: 'Pre-dimensionamiento rápido basado en consumo. Herramienta clásica de ingeniería.',
            icon: <Calculator className="h-6 w-6 text-blue-500" />,
            href: '/dashboard/calculator',
            category: 'engineering'
        },
        // Sales Tools
        {
            title: 'Captura Rápida',
            description: 'Registra un lead en 10 segundos: Nombre, Foto de Factura, Ubicación GPS. Perfecto para puerta fría.',
            icon: <UserPlus className="h-6 w-6 text-green-500" />,
            href: '/dashboard/tools/quick-lead',
            badge: 'Offline Ready',
            badgeVariant: 'outline',
            category: 'sales'
        },
        {
            title: 'Importador Universal',
            description: 'Migra clientes y proyectos desde CSV, Excel, Holded o Pipedrive. Onboarding masivo.',
            icon: <FileSpreadsheet className="h-6 w-6 text-emerald-500" />,
            href: '/dashboard/import',
            category: 'sales'
        },
        // System Tools (Disabled/Coming Soon)
        {
            title: 'Estado de Sincronización',
            description: 'Monitor de la base de datos local (RxDB). Ve cambios pendientes y estado de red.',
            icon: <Cloud className="h-6 w-6 text-slate-500" />,
            href: '#',
            badge: 'Próximamente',
            badgeVariant: 'secondary',
            category: 'system',
            disabled: true
        }
    ]

    return (
        <div className="container mx-auto py-8 max-w-6xl animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Zap className="h-7 w-7 text-yellow-500" />
                        Centro de Herramientas
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Acceso rápido a las utilidades más poderosas del sistema.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                        <Sparkles className="mr-1 h-3 w-3" /> 2 con IA
                    </Badge>
                </div>
            </div>

            {/* Category: Engineering */}
            <section className="mb-8">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <div className="h-2 w-2 rounded-full bg-blue-500" /> Ingeniería
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                    {tools.filter(t => t.category === 'engineering').map(tool => (
                        <ToolCard key={tool.title} {...tool} />
                    ))}
                </div>
            </section>

            {/* Category: Sales */}
            <section className="mb-8">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-600 dark:text-green-400">
                    <div className="h-2 w-2 rounded-full bg-green-500" /> Ventas & Productividad
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                    {tools.filter(t => t.category === 'sales').map(tool => (
                        <ToolCard key={tool.title} {...tool} />
                    ))}
                </div>
            </section>

            {/* Category: System */}
            <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <div className="h-2 w-2 rounded-full bg-slate-500" /> Sistema
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                    {tools.filter(t => t.category === 'system').map(tool => (
                        <ToolCard key={tool.title} {...tool} />
                    ))}
                </div>
            </section>
        </div>
    )
}
