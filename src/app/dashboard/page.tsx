import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, FileText, TrendingUp, Plus, Calculator, CalendarDays, ArrowRight, DollarSign, Bell, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardMetric } from '@/components/dashboard/dashboard-metric'
import { SolarCalculatorWidget } from '@/components/tools/solar-calculator-widget'
import { CreateOrganizationForm } from '@/components/onboarding/create-organization-form'

// Fallback skeleton
function DashboardSkeleton() {
    return (
        <div className="space-y-8 p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center border-b pb-6">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
            </div>
        </div>
    )
}

export default async function DashboardPage() {
    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <DashboardContent />
        </Suspense>
    )
}

async function DashboardContent() {
    const session = await auth()

    if (!session?.user) return null

    // Get user's profile
    console.log('[DASHBOARD PAGE] Fetching profile for User ID:', session.user.id)
    const profile = await prisma.users.findUnique({
        where: { id: session.user.id },
        select: { organization_id: true, full_name: true, role: true }
    })

    console.log('[DASHBOARD PAGE] Profile Result:', profile ? 'Found' : 'NULL')
    console.log('[DASHBOARD PAGE] Org ID in DB:', profile?.organization_id)

    // SI EL USUARIO NO TIENE ORGANIZACIÓN: MOSTRAR FORMULARIO DE ONBOARDING
    if (!profile?.organization_id) {
        return <CreateOrganizationForm />
    }

    // Parallel Data Fetching with Prisma (using available models)
    // Note: leads, sales, calculations, presentations not in current Prisma schema
    const [customersCount, projectsCount, invoicesCount] = await Promise.all([
        prisma.customers.count({ where: { organization_id: profile.organization_id } }),
        prisma.projects.count({ where: { organization_id: profile.organization_id } }),
        prisma.invoices.count({ where: { organization_id: profile.organization_id } }),
    ])

    // Mock data for tables not yet in Prisma schema
    // TODO: Add these tables to Prisma schema and implement properly
    const leadsCount = 0
    const quotesCount = 0
    const presentationsCount = 0
    const avgROI = 0
    const totalSubsidies = 0

    const quickActions = [
        { title: 'Nuevo Lead', icon: Users, href: '/dashboard/leads', color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { title: 'Nueva Venta', icon: Plus, href: '/dashboard/sales', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { title: 'Calculadora', icon: Calculator, href: '/dashboard/calculator', color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { title: 'Agenda', icon: CalendarDays, href: '/dashboard/calendar', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    ]

    // --------------------------------------------------------------------------------
    // DAY 1 ONBOARDING: ACTION CARDS (Empty State)
    // --------------------------------------------------------------------------------
    if (customersCount === 0) {
        return (
            <div className="max-w-5xl mx-auto py-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="text-center space-y-4 mb-12">
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                        ¡Bienvenido a SolisTech PRO!
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Tu espacio de trabajo está listo. Sigue estos 3 pasos para poner en marcha tu negocio solar.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Step 1 */}
                    <Link href="/dashboard/settings" className="group relative">
                        <div className="h-full p-8 rounded-2xl bg-card border border-border/50 hover:border-blue-500/50 hover:shadow-lg transition-all duration-300">
                            <div className="absolute top-0 right-0 p-4 opacity-10 text-9xl font-bold text-blue-500 group-hover:opacity-20 transition-opacity select-none">1</div>
                            <div className="relative space-y-4">
                                <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                    <Settings className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-semibold">Configura tu Taller</h3>
                                <p className="text-muted-foreground">Personaliza tu perfil, logo de empresa y datos fiscales para tus facturas.</p>
                                <Button variant="link" className="p-0 text-blue-600 group-hover:translate-x-1 transition-transform">
                                    Ir a Configuración <ArrowRight className="ml-1 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </Link>

                    {/* Step 2 */}
                    <Link href="/dashboard/customers/new" className="group relative">
                        <div className="h-full p-8 rounded-2xl bg-card border border-border/50 hover:border-emerald-500/50 hover:shadow-lg transition-all duration-300">
                            <div className="absolute top-0 right-0 p-4 opacity-10 text-9xl font-bold text-emerald-500 group-hover:opacity-20 transition-opacity select-none">2</div>
                            <div className="relative space-y-4">
                                <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                    <Users className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-semibold">Crea tu primer Cliente</h3>
                                <p className="text-muted-foreground">Da de alta a tu primer cliente para poder asociarle proyectos y presupuestos.</p>
                                <Button variant="link" className="p-0 text-emerald-600 group-hover:translate-x-1 transition-transform">
                                    Crear Cliente <ArrowRight className="ml-1 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </Link>

                    {/* Step 3 */}
                    <Link href="/dashboard/projects/new" className="group relative">
                        <div className="h-full p-8 rounded-2xl bg-card border border-border/50 hover:border-amber-500/50 hover:shadow-lg transition-all duration-300">
                            <div className="absolute top-0 right-0 p-4 opacity-10 text-9xl font-bold text-amber-500 group-hover:opacity-20 transition-opacity select-none">3</div>
                            <div className="relative space-y-4">
                                <div className="h-12 w-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                                    <Calculator className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-semibold">Lanza un Proyecto</h3>
                                <p className="text-muted-foreground">Crea un estudio solar, genera una oferta y cierra tu primera venta.</p>
                                <Button variant="link" className="p-0 text-amber-600 group-hover:translate-x-1 transition-transform">
                                    Nuevo Proyecto <ArrowRight className="ml-1 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">

            {/* 1. Header with reduced density */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-border/30">
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight text-foreground">
                        Hola, <span className="text-primary">{profile.full_name?.split(' ')[0]}</span>
                    </h1>
                    <p className="text-lg text-muted-foreground font-light">
                        Aquí tienes el resumen de tu actividad hoy.
                    </p>
                </div>
                <div className="flex flex-col items-end">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">
                        {new Date().toLocaleDateString('es-ES', { weekday: 'long' })}
                    </p>
                    <p className="text-3xl font-light tabular-nums">
                        {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                    </p>
                </div>
            </div>

            {/* 2. Key Metrics Grid - Refactored Design */}
            <section>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <DashboardMetric
                        icon={TrendingUp}
                        label="ROI Promedio"
                        value={`${avgROI}%`}
                        secondary={`Base: ${projectsCount} proyectos`}
                        trend={{ value: "+2.3%", positive: true }}
                        variant="highlight"
                    />
                    <DashboardMetric
                        icon={DollarSign}
                        label="Ayudas Gestionadas"
                        value={totalSubsidies > 0 ? `${(totalSubsidies / 1000).toFixed(0)}k€` : '0€'}
                        secondary="Subvenciones totales tramitadas"
                        trend={{ value: "+12%", positive: true }}
                        variant="default"
                    />
                    <DashboardMetric
                        icon={FileText}
                        label="Presentaciones"
                        value={presentationsCount}
                        secondary="Informes generados (IA)"
                        variant="default"
                    />
                    <DashboardMetric
                        icon={Users}
                        label="Cartera Clientes"
                        value={customersCount}
                        secondary="Clientes activos totales"
                        trend={{ value: "+5", positive: true }}
                        variant="default"
                    />
                </div>
            </section>

            {/* 3. Main Operational Area */}
            <div className="grid gap-8 lg:grid-cols-3">

                {/* Left: Quick Actions & Graph */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Section Header */}
                    <div className="flex items-center gap-3">
                        <div className="h-1 w-6 bg-primary rounded-full" />
                        <h2 className="text-xl font-semibold tracking-tight">Acciones Rápidas</h2>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {quickActions.map((action) => {
                            const Icon = action.icon
                            return (
                                <Link key={action.title} href={action.href} className="group">
                                    <div className="flex flex-col items-center justify-center p-6 h-32 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 gap-3">
                                        <div className={`p-3 rounded-xl transition-transform group-hover:scale-110 ${action.bg} ${action.color}`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <span className="font-medium text-sm text-center">{action.title}</span>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>

                    {/* Placeholder Graph Area */}
                    {/* Solar Calculator Widget */}
                    <SolarCalculatorWidget />
                </div>

                {/* Right: Pending / Calendar */}
                <div className="space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="h-1 w-6 bg-amber-500 rounded-full" />
                        <h2 className="text-xl font-semibold tracking-tight">Atención Requerida</h2>
                    </div>

                    <Card className="h-full border-border/50 shadow-sm bg-card/60 backdrop-blur-md">
                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-base font-medium flex items-center gap-2">
                                    <Bell className="w-4 h-4 text-primary" />
                                    Notificaciones
                                </CardTitle>
                                <Badge variant="secondary" className="rounded-full px-2 text-xs">2 Nuevas</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* Item 1 */}
                                <div className="group flex gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
                                    <div className="mt-1 h-2 w-2 rounded-full bg-amber-500 shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none group-hover:text-primary transition-colors">Seguimiento Lead #405</p>
                                        <p className="text-xs text-muted-foreground">Sin contacto desde hace 3 días.</p>
                                    </div>
                                </div>
                                {/* Item 2 */}
                                <div className="group flex gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
                                    <div className="mt-1 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none group-hover:text-primary transition-colors">Documentación Pte.</p>
                                        <p className="text-xs text-muted-foreground">Cliente "Instalación Norte" subió archivos.</p>
                                    </div>
                                </div>
                            </div>

                            <Button variant="ghost" className="w-full mt-6 text-xs text-muted-foreground hover:text-foreground">
                                Ver todo el historial <ArrowRight className="ml-2 w-3 h-3" />
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
