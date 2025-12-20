"use client"

import { usePermission } from "@/hooks/use-permission"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/components/providers/sidebar-provider"
import { SyncMonitor } from "@/components/sync/sync-monitor"
import { logoutAction } from "@/lib/actions/auth"
import {
    LayoutDashboard,
    Users,
    Car,
    Settings,
    HelpCircle,
    CreditCard,
    CalendarDays,
    Package,
    Calculator,
    Shield,
    Clock,
    ChevronLeft,
    ChevronRight,
    Upload,
    Search,
    BrainCircuit,
    LogOut,
    Mail,
    FileText,
    Target,
    Presentation,
    HandCoins,
    Receipt,
    TrendingUp,
    UsersRound,
    Sparkles,
    BarChart3,
    Briefcase
} from "lucide-react"

import { Lock } from "lucide-react"

interface SidebarProps {
    userRole?: string
    plan?: string
}

const getSidebarItems = (permissions: string[] = [], plan: string = 'basic') => {
    const isPro = plan === 'pro' || plan === 'enterprise'

    return [
        {
            section: "Principal",
            items: [
                { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard:view" as const },
                { href: "/dashboard/advanced", label: "Vista Avanzada", icon: Sparkles, highlight: true, permission: "dashboard:view" as const },
                { href: "/dashboard/calendar", label: "Agenda", icon: CalendarDays, permission: "calendar:view" as const },
            ]
        },
        {
            section: "Comercial",
            items: [
                { href: "/dashboard/leads", label: "Leads", icon: Target, permission: "crm:view" as const },
                { href: "/dashboard/crm", label: "Clientes", icon: Users, permission: "crm:view" as const },
                { href: "/dashboard/quotes", label: "Cotizaciones", icon: Receipt, permission: "projects:view" as const },
                { href: "/dashboard/projects", label: "Proyectos", icon: Briefcase, permission: "projects:view" as const },
                { href: "/dashboard/sales", label: "Ventas", icon: TrendingUp, permission: "projects:view" as const },
            ]
        },
        {
            section: "Facturación",
            items: [
                { href: "/dashboard/invoices", label: "Facturas", icon: FileText, permission: "finance:view" as const },
                { href: "/dashboard/finance", label: "Finanzas", icon: CreditCard, permission: "finance:view" as const },
                { href: "/dashboard/subsidies", label: "Subvenciones", icon: HandCoins, permission: "finance:view" as const },
            ]
        },
        {
            section: "Herramientas",
            items: [
                { href: "/dashboard/calculator", label: "Calculadora Solar", icon: Calculator, permission: "calculator:use" as const },
                { href: "/dashboard/solar-brain", label: "SolarBrain AI", icon: BrainCircuit, highlight: true, locked: !isPro, permission: "solar-brain:use" as const },
                { href: "/dashboard/presentations", label: "Presentaciones", icon: Presentation, permission: "projects:view" as const },
                { href: "/dashboard/mail", label: "Correo", icon: Mail, permission: "dashboard:view" as const },
                { href: "/dashboard/import", label: "Importador", icon: Upload, permission: "import:use" as const },
            ]
        },
        {
            section: "Operaciones",
            items: [
                { href: "/dashboard/inventory", label: "Inventario", icon: Package, permission: "inventory:view" as const },
                { href: "/dashboard/time-tracking", label: "Control Horario", icon: Clock, permission: "time-tracking:view" as const },
                { href: "/dashboard/team", label: "Equipo", icon: UsersRound, locked: !isPro, permission: "users:view" as const },
            ]
        },
        {
            section: "Administración",
            items: [
                { href: "/dashboard/settings", label: "Configuración", icon: Settings, permission: "settings:view" as const },
                { href: "/dashboard/admin/users", label: "Gestión Usuarios", icon: Shield, permission: "users:view" as const },
            ]
        }
    ]
}

export function Sidebar({ userRole, plan = 'basic' }: SidebarProps) {
    const pathname = usePathname()
    const { user } = usePermission()


    // Safe destructuring in case component is used outside provider (e.g. mobile menu)
    const sidebarContext = tryUseSidebar()
    const isCollapsed = sidebarContext?.isCollapsed || false
    const toggleSidebar = sidebarContext?.toggleSidebar

    const permissions = (user as any)?.permissions || []
    const sidebarItems = getSidebarItems(permissions, plan)

    return (
        <div className="flex flex-col h-full border-r border-white/10 bg-zinc-950 text-white relative">

            {/* Header Logo */}
            <div className={cn(
                "flex h-16 items-center border-b border-white/10 shrink-0 transition-all duration-300",
                isCollapsed ? "justify-center px-2" : "px-6"
            )}>
                <div className="flex items-center gap-2 font-bold text-xl tracking-tight overflow-hidden whitespace-nowrap">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] shrink-0">
                        <Car className="h-5 w-5 fill-current" />
                    </div>
                    <span className={cn(
                        "transition-opacity duration-300",
                        isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100"
                    )}>
                        Motor<span className="text-blue-500">Gap</span>
                    </span>
                </div>
            </div>

            {/* Toggle Button (Desktop Only) */}
            {toggleSidebar && (
                <button
                    onClick={toggleSidebar}
                    className="absolute -right-3 top-20 bg-emerald-500 text-zinc-950 rounded-full p-1 shadow-lg hover:bg-emerald-400 transition-colors z-50 hidden md:flex border-2 border-zinc-950"
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
            )}

            {/* Nav Items Scrollable */}
            <nav className="flex-1 overflow-y-auto py-6 space-y-6 scrollbar-hide">
                {sidebarItems.map((group, index) => (
                    <div key={index} className="px-3">
                        {!isCollapsed && (
                            <h3 className="mb-2 px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider transition-opacity duration-300">
                                {group.section}
                            </h3>
                        )}
                        {isCollapsed && (
                            <div className="h-px bg-white/10 w-full mx-auto mb-2" />
                        )}

                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href))
                                const Icon = item.icon
                                const isHighlight = (item as any).highlight

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center rounded-lg transition-all duration-200 group relative",
                                            isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2",
                                            isActive
                                                ? "bg-emerald-500/10 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.1)] border border-emerald-500/20"
                                                : "text-zinc-400 hover:bg-white/5 hover:text-white",
                                            isHighlight && !isActive && "text-amber-400 hover:text-amber-300"
                                        )}
                                        title={isCollapsed ? item.label : undefined}
                                    >
                                        <Icon className={cn(
                                            "transition-colors shrink-0",
                                            isCollapsed ? "h-6 w-6" : "h-4 w-4",
                                            isActive ? "text-emerald-500" : (isHighlight ? "text-amber-400" : "text-zinc-500 group-hover:text-zinc-300")
                                        )} />

                                        {!isCollapsed && (
                                            <span className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis flex-1">
                                                {item.label}
                                            </span>
                                        )}

                                        {!isCollapsed && (item as any).locked && (
                                            <Lock className="h-3 w-3 text-zinc-600 ml-auto" />
                                        )}

                                        {/* Tooltip-ish for collapsed */}
                                        {isCollapsed && (
                                            <div className="absolute left-full ml-4 px-2 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                                                {item.label}
                                            </div>
                                        )}
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer Fijo */}
            <div className="p-4 border-t border-white/10 mt-auto bg-zinc-950 space-y-2">

                {/* Sync Monitor */}
                <div className={cn("w-full transition-all", isCollapsed ? "flex justify-center" : "")}>
                    <SyncMonitor />
                </div>

                <Link
                    href="/dashboard/help"
                    className={cn(
                        "flex items-center rounded-lg transition-all border border-transparent hover:border-emerald-500/20",
                        isCollapsed ? "justify-center p-2" : "gap-3 px-3 py-3",
                        "text-zinc-400 hover:bg-emerald-500/10 hover:text-emerald-500"
                    )}
                    title="Centro de Ayuda"
                >
                    <HelpCircle className={cn(isCollapsed ? "h-6 w-6" : "h-4 w-4")} />
                    {!isCollapsed && <span className="text-sm font-medium">Ayuda</span>}
                </Link>

                <button
                    onClick={() => logoutAction()}
                    className={cn(
                        "flex items-center w-full rounded-lg transition-all border border-transparent hover:border-red-500/20",
                        isCollapsed ? "justify-center p-2" : "gap-3 px-3 py-3",
                        "text-zinc-400 hover:bg-red-500/10 hover:text-red-500"
                    )}
                    title="Cerrar Sesión"
                >
                    <LogOut className={cn(isCollapsed ? "h-6 w-6" : "h-4 w-4")} />
                    {!isCollapsed && <span className="text-sm font-medium">Cerrar Sesión</span>}
                </button>
            </div>
        </div>
    )
}

// Helper to gracefully fail if context is missing (like in MobileMenu which copies this component)
function tryUseSidebar() {
    try {
        return useSidebar()
    } catch {
        return null
    }
}
