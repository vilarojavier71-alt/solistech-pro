import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, FileText, TrendingUp, Plus, Calculator, CalendarDays, ArrowRight, DollarSign, Bell, Settings, Briefcase, Receipt, FolderKanban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardMetric } from '@/components/dashboard/dashboard-metric'
import { SolarCalculatorWidget } from '@/components/tools/solar-calculator-widget'
import { CreateOrganizationForm } from '@/components/onboarding/create-organization-form'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { ProjectsWidget } from '@/components/dashboard/projects-widget'
import { TodayAgenda } from '@/components/dashboard/today-agenda'
import { getDashboardStats, getRecentProjects, getTodayAppointments } from '@/lib/actions/dashboard-stats'

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
    const profile = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { organization_id: true, full_name: true, role: true }
    })

    if (!profile) {
        console.error('[DASHBOARD PAGE] Critical: Profile not found for User ID:', session.user.id)
        // If user is in session but not in DB, force signout or handle gracefully
        // For now, return null or a specific error component to avoid crash
        return (
            <div className="p-8 text-center text-red-500">
                <h1>Error Crítico de Cuenta</h1>
                <p>Tu usuario existe en sesión pero no se encuentra en la base de datos.</p>
                <p>Por favor, contacta a soporte.</p>
            </div>
        )
    }

    console.log('[DASHBOARD PAGE] Profile Result:', profile ? 'Found' : 'NULL')
    console.log('[DASHBOARD PAGE] Org ID in DB:', profile?.organization_id)

    // SI EL USUARIO NO TIENE ORGANIZACIÓN: MOSTRAR FORMULARIO DE ONBOARDING
    if (!profile?.organization_id) {
        return <CreateOrganizationForm />
    }

    // ----- CENTRALITA: Fetch all KPIs and widgets data in parallel -----
    const [stats, recentProjects, todayAppointments] = await Promise.all([
        getDashboardStats(),
        getRecentProjects(5),
        getTodayAppointments()
    ])

    const quickActions = [
        { title: 'Nuevo Lead', icon: Users, href: '/dashboard/leads', color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { title: 'Nueva Venta', icon: Plus, href: '/dashboard/sales', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { title: 'Calculadora', icon: Calculator, href: '/dashboard/calculator', color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { title: 'Agenda', icon: CalendarDays, href: '/dashboard/calendar', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    ]

    // Empty state check
    if (stats.customersCount === 0) {
        return (
            <div className="max-w-5xl mx-auto py-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="text-center space-y-4 mb-12">
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                        ¡Bienvenido a MotorGap!
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

            {/* 2. BENTO GRID - KPIs Maestros */}
            <section>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* KPI 1: Ingresos Totales */}
                    <DashboardMetric
                        icon={DollarSign}
                        label="Ingresos del Mes"
                        value={new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(stats.monthlyRevenue)}
                        secondary={`Total: ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(stats.totalRevenue)}`}
                        variant="highlight"
                    />

                    {/* KPI 2: Leads Nuevos */}
                    <DashboardMetric
                        icon={Users}
                        label="Leads Este Mes"
                        value={stats.leadsCount}
                        secondary="Oportunidades nuevas"
                        variant="default"
                    />

                    {/* KPI 3: Proyectos Activos */}
                    <DashboardMetric
                        icon={FolderKanban}
                        label="Proyectos Activos"
                        value={stats.activeProjectsCount}
                        secondary="En ejecución"
                        variant="default"
                    />

                    {/* KPI 4: Citas Hoy */}
                    <DashboardMetric
                        icon={CalendarDays}
                        label="Citas Hoy"
                        value={stats.todayAppointments}
                        secondary="Agendadas para hoy"
                        variant="default"
                    />
                </div>
            </section>

            {/* 3. BENTO GRID - Widgets Operativos */}
            <div className="grid gap-6 lg:grid-cols-3">

                {/* Column 1: Revenue & Quick Actions */}
                <div className="space-y-6">
                    <RevenueChart
                        totalRevenue={stats.totalRevenue}
                        monthlyRevenue={stats.monthlyRevenue}
                        pendingInvoices={stats.pendingInvoices}
                    />

                    {/* Quick Actions Grid */}
                    <Card className="border-border/50">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Acciones Rápidas
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-2">
                                {quickActions.map((action) => {
                                    const Icon = action.icon
                                    return (
                                        <Link key={action.title} href={action.href}>
                                            <div className={`flex items-center gap-2 p-3 rounded-lg hover:bg-muted/50 transition-colors ${action.bg}`}>
                                                <Icon className={`h-4 w-4 ${action.color}`} />
                                                <span className="text-sm font-medium">{action.title}</span>
                                            </div>
                                        </Link>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Column 2: Projects Widget */}
                <ProjectsWidget
                    projects={recentProjects.map(p => ({
                        ...p,
                        updated_at: p.updated_at || new Date()
                    }))}
                    activeCount={stats.activeProjectsCount}
                />

                {/* Column 3: Today Agenda & Solar Calculator */}
                <div className="space-y-6">
                    <TodayAgenda
                        appointments={todayAppointments.map(a => ({
                            ...a,
                            title: a.title || null
                        }))}
                        count={stats.todayAppointments}
                    />

                    {/* Solar Calculator Mini */}
                    <SolarCalculatorWidget />
                </div>
            </div>
        </div>
    )
}
