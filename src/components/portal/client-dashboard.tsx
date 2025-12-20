'use client'

import { getPortalDashboardData } from '@/lib/actions/portal'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Sale, TimelineStep, ClientNotification } from '@/types/portal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    CheckCircle2,
    Clock,
    XCircle,
    Loader2,
    LogOut,
    Bell,
    Upload,
    ArrowRight
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function ClientDashboard() {
    const [sale, setSale] = useState<Sale | null>(null)
    const [timeline, setTimeline] = useState<TimelineStep[]>([])
    const [notifications, setNotifications] = useState<ClientNotification[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()


    useEffect(() => {
        loadDashboard()
    }, [])

    const loadDashboard = async () => {
        try {
            const saleId = sessionStorage.getItem('client_sale_id')
            const dni = sessionStorage.getItem('client_dni')

            if (!saleId || !dni) {
                router.push('/portal')
                return
            }

            const result = await getPortalDashboardData(saleId, dni)

            if (!result.success || !result.data) {
                toast.error(result.error || 'Error al cargar tus datos')
                router.push('/portal')
                return
            }

            setSale(result.data.sale)
            setTimeline(generateTimeline(result.data.sale))
            setNotifications(result.data.notifications)
        } catch (error) {
            console.error('Error loading dashboard:', error)
            toast.error('Error al cargar el dashboard')
        } finally {
            setTimeout(() => setLoading(false), 800) // Small delay for smooth transition
        }
    }

    const generateTimeline = (sale: Sale): TimelineStep[] => {
        return [
            {
                id: 1,
                title: 'Venta Registrada',
                description: `Tu proyecto comenzÛ el ${new Date(sale.sale_date).toLocaleDateString('es-ES')}`,
                status: 'completed',
                date: sale.sale_date,
                icon: 'check',
            },
            {
                id: 2,
                title: 'Pago Inicial',
                description: sale.payment_status === 'confirmed'
                    ? `Pago de Ä${sale.amount.toLocaleString('es-ES')} recibido correctamente`
                    : 'Esperando confirmaciÛn de pago',
                status: sale.payment_status === 'confirmed' ? 'completed' :
                    sale.payment_status === 'rejected' ? 'rejected' : 'in_progress',
                date: sale.payment_date,
                icon: 'check',
            },
            {
                id: 3,
                title: 'DocumentaciÛn',
                description: getDocumentationDescription(sale.documentation_status),
                status: sale.documentation_status === 'approved' ? 'completed' :
                    sale.documentation_status === 'rejected' ? 'rejected' :
                        sale.documentation_status === 'uploaded' ? 'in_progress' : 'pending',
                date: sale.documents_uploaded_at,
                icon: 'file',
                actionLabel: sale.documentation_status === 'pending' ? 'Subir Documentos' : undefined,
                actionUrl: sale.documentation_status === 'pending' ? '/portal/documents' : undefined,
            },
            {
                id: 4,
                title: 'IngenierÌa',
                description: getEngineeringDescription(sale.engineering_status),
                status: sale.engineering_status === 'approved' ? 'completed' :
                    sale.engineering_status === 'rejected' ? 'rejected' :
                        sale.engineering_status === 'in_review' ? 'in_progress' : 'pending',
                date: sale.reviewed_at,
                icon: 'wrench',
            },
            {
                id: 5,
                title: 'Permisos',
                description: getProcessDescription(sale.process_status),
                status: sale.process_status === 'completed' ? 'completed' :
                    sale.process_status === 'in_progress' || sale.process_status === 'presented' ? 'in_progress' : 'pending',
                date: null,
                icon: 'file',
            },
            {
                id: 6,
                title: 'InstalaciÛn',
                description: getInstallationDescription(sale.installation_status, sale.installation_date),
                status: sale.installation_status === 'completed' ? 'completed' :
                    sale.installation_status === 'in_progress' || sale.installation_status === 'scheduled' ? 'in_progress' : 'pending',
                date: sale.installation_date,
                icon: 'home',
            },
        ]
    }

    const handleLogout = () => {
        sessionStorage.removeItem('client_sale_id')
        sessionStorage.removeItem('client_dni')
        router.push('/portal')
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-sky-50 to-blue-100">
                <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-sky-100 border-t-sky-600 animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl">‚òÄÔ∏è</span>
                    </div>
                </div>
                <p className="mt-4 text-sky-800 font-medium animate-pulse">Cargando tu proyecto...</p>
            </div>
        )
    }

    if (!sale) return null

    return (
        <div className="min-h-screen pb-12 animate-in fade-in duration-700">
            {/* Navbar simplificado */}
            <nav className="bg-white/80 backdrop-blur-md border-b border-sky-100 sticky top-0 z-50">
                <div className="container max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <span className="font-bold text-xl text-sky-900 tracking-tight">SolisTech<span className="text-sky-500">PRO</span></span>
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="text-sky-700 hover:text-sky-900 hover:bg-sky-50">
                        <LogOut className="mr-2 h-4 w-4" />
                        Salir
                    </Button>
                </div>
            </nav>

            <div className="container max-w-4xl mx-auto p-4 py-8 space-y-8">

                {/* Welcome Section */}
                <div className="space-y-2 text-center md:text-left">
                    <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 mb-2 px-3 py-1">
                        Expediente: {sale.sale_number}
                    </Badge>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                        Hola, {sale.customer_name.split(' ')[0]} ??
                    </h1>
                    <p className="text-slate-600 text-lg">
                        AquÌ tienes el estado actual de tu instalaciÛn solar.
                    </p>
                </div>

                {/* Notifications Area */}
                {notifications.length > 0 && (
                    <div className="grid gap-4">
                        {notifications.map((notif, i) => (
                            <div
                                key={notif.id}
                                className={cn(
                                    "group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:shadow-md border",
                                    notif.read ? "bg-white border-slate-100" : "bg-gradient-to-r from-blue-50 to-white border-blue-100 ring-1 ring-blue-100"
                                )}
                                style={{ animationDelay: `${i * 100}ms` }}
                            >
                                <div className="flex gap-4">
                                    <div className={cn(
                                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                                        notif.read ? "bg-slate-100 text-slate-500" : "bg-blue-100 text-blue-600"
                                    )}>
                                        <Bell className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold text-slate-900">{notif.title}</p>
                                            {!notif.read && <span className="flex h-2 w-2 rounded-full bg-blue-600"></span>}
                                        </div>
                                        <p className="text-slate-600 leading-relaxed">{notif.message}</p>
                                        {notif.action_label && notif.action_url && (
                                            <Button size="sm" className="mt-3 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200" onClick={() => router.push(notif.action_url!)}>
                                                {notif.action_label} <ArrowRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Main Dashboard Grid */}
                <div className="grid md:grid-cols-3 gap-6">

                    {/* Timeline Column */}
                    <div className="md:col-span-2 space-y-6">
                        <Card className="border-0 shadow-xl shadow-slate-200/50 bg-white/70 backdrop-blur-sm rounded-3xl overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                <CardTitle className="text-xl text-slate-800 flex items-center gap-2">
                                    <Clock className="text-sky-500 h-5 w-5" />
                                    LÌnea de Tiempo
                                </CardTitle>
                                <CardDescription>Tu camino hacia la energÌa solar</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-8">
                                <div className="relative pl-4">
                                    {/* Vertical Line */}
                                    <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-slate-100"></div>

                                    <div className="space-y-8">
                                        {timeline.map((step, index) => (
                                            <TimelineItem
                                                key={step.id}
                                                step={step}
                                                isLast={index === timeline.length - 1}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar Details Column */}
                    <div className="space-y-6">
                        {/* Project Summary Card */}
                        <Card className="border-0 shadow-lg shadow-slate-200/40 rounded-3xl bg-gradient-to-b from-sky-600 to-sky-700 text-white overflow-hidden relative">
                            {/* Decorative circles */}
                            <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                            <div className="absolute bottom-12 -left-12 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>

                            <CardHeader className="relative">
                                <CardTitle className="text-lg font-medium text-sky-100">Resumen del Proyecto</CardTitle>
                                <div className="text-3xl font-bold mt-2">
                                    Ä{sale.amount.toLocaleString('es-ES')}
                                </div>
                                <p className="text-sky-200 text-sm">InversiÛn Total</p>
                            </CardHeader>
                            <CardContent className="relative space-y-4 pt-0">
                                <div className="bg-white/10 rounded-xl p-3 backdrop-blur-md">
                                    <p className="text-xs text-sky-200 uppercase tracking-wide font-semibold mb-1">Material</p>
                                    <p className="font-medium">{sale.material || 'ConfiguraciÛn est·ndar'}</p>
                                </div>
                                <div className="bg-white/10 rounded-xl p-3 backdrop-blur-md">
                                    <p className="text-xs text-sky-200 uppercase tracking-wide font-semibold mb-1">Email Registrado</p>
                                    <p className="text-sm truncate">{sale.customer_email}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Support / Contact Card (Visual Only for now) */}
                        <Card className="border-0 shadow-lg shadow-slate-200/40 rounded-3xl bg-white">
                            <CardContent className="p-6 text-center space-y-4">
                                <div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                                    <span className="text-2xl">??</span>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900">øTienes dudas?</h3>
                                    <p className="text-sm text-slate-500 mt-1">Nuestro equipo est· aquÌ para ayudarte en cada paso.</p>
                                </div>
                                <Button variant="outline" className="w-full rounded-xl border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50">
                                    Contactar Soporte
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}

function TimelineItem({ step, isLast }: { step: TimelineStep; isLast: boolean }) {
    const isCompleted = step.status === 'completed';
    const isActive = step.status === 'in_progress';
    const isRejected = step.status === 'rejected';

    return (
        <div className={`relative flex gap-6 group ${!isCompleted && !isActive ? 'opacity-60' : 'opacity-100'}`}>

            {/* Icon Bubble */}
            <div className={cn(
                "relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-4 transition-all duration-300",
                isCompleted ? "bg-white border-green-500 text-green-600 shadow-lg shadow-green-100" :
                    isActive ? "bg-white border-sky-500 text-sky-600 shadow-lg shadow-sky-100 scale-110" :
                        isRejected ? "bg-white border-red-500 text-red-600" :
                            "bg-white border-slate-200 text-slate-300"
            )}>
                {isCompleted ? <CheckCircle2 className="h-6 w-6" /> :
                    isActive ? <Loader2 className="h-6 w-6 animate-spin" /> :
                        isRejected ? <XCircle className="h-6 w-6" /> :
                            <Clock className="h-6 w-6" />}
            </div>

            {/* Content */}
            <div className="flex-1 pt-1 pb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
                    <h3 className={cn(
                        "font-bold text-lg",
                        isCompleted ? "text-slate-900" :
                            isActive ? "text-sky-700" : "text-slate-500"
                    )}>
                        {step.title}
                    </h3>
                    {step.date && (
                        <Badge variant="secondary" className="w-fit bg-slate-100 text-slate-600 font-normal">
                            {new Date(step.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                        </Badge>
                    )}
                </div>

                <p className="text-slate-600 leading-relaxed max-w-lg">
                    {step.description}
                </p>

                {step.actionLabel && step.actionUrl && !isCompleted && (
                    <div className="mt-4">
                        <Button
                            onClick={() => window.location.href = step.actionUrl!}
                            className="rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-lg shadow-sky-200 transition-transform active:scale-95"
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            {step.actionLabel}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}

function getDocumentationDescription(status: string): string {
    switch (status) {
        case 'approved': return 'DocumentaciÛn verificada y correcta. °Buen trabajo!'
        case 'rejected': return 'Hay un problema con algunos documentos. Por favor, revÌsalos.'
        case 'uploaded': return 'Hemos recibido tus archivos. Nuestro equipo los revisar· pronto.'
        default: return 'Necesitamos tu confirmaciÛn de identidad y facturas para avanzar.'
    }
}

function getEngineeringDescription(status: string): string {
    switch (status) {
        case 'approved': return 'IngenierÌa ha dado el visto bueno a tu proyecto tÈcnico.'
        case 'rejected': return 'Hay detalles tÈcnicos que ajustar antes de proceder.'
        case 'in_review': return 'Nuestro ingeniero est· analizando la viabilidad y diseÒo.'
        default: return 'El equipo tÈcnico preparar· tu dossier personalizado.'
    }
}

function getProcessDescription(status: string): string {
    switch (status) {
        case 'completed': return 'Todos los permisos han sido concedidos.'
        case 'in_progress': return 'Estamos gestionando los permisos con el ayuntamiento.'
        case 'presented': return 'Solicitudes presentadas a la administraciÛn p˙blica.'
        default: return 'Gestionaremos todas las licencias necesarias por ti.'
    }
}

function getInstallationDescription(status: string, date: string | null): string {
    switch (status) {
        case 'completed': return '°InstalaciÛn finalizada y funcionando! ??'
        case 'in_progress': return 'Nuestros tÈcnicos est·n instalando tus paneles ahora.'
        case 'scheduled': return date ? `°Fecha confirmada! Instalaremos el ${new Date(date).toLocaleDateString('es-ES')}` : 'Pronto te llamaremos para agendar la instalaciÛn.'
        default: return 'El ˙ltimo paso para disfrutar de tu propia energÌa.'
    }
}
