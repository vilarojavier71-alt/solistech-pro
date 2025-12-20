"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Sun, FileText, Settings } from "lucide-react"

export function MobileNav() {
    const pathname = usePathname()

    const navItems = [
        { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
        { href: "/dashboard/projects", label: "Obras", icon: Sun },
        { href: "/dashboard/invoices", label: "Facturas", icon: FileText },
        { href: "/dashboard/settings", label: "Ajustes", icon: Settings },
    ]

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-white/10 bg-zinc-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-zinc-950/60">
            <div className="grid h-full grid-cols-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href))
                    const Icon = item.icon

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 h-full w-full",
                                isActive ? "text-emerald-500" : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            <div className={cn("relative p-1 rounded-xl transition-all", isActive && "bg-emerald-500/10")}>
                                <Icon className={cn("h-5 w-5", isActive && "fill-emerald-500/20")} />
                            </div>
                            <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
