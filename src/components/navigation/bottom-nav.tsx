'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, FolderKanban, Clock, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
    href: string
    icon: React.ComponentType<{ className?: string }>
    label: string
}

const navItems: NavItem[] = [
    {
        href: '/dashboard',
        icon: Home,
        label: 'Inicio'
    },
    {
        href: '/dashboard/customers',
        icon: Users,
        label: 'Clientes'
    },
    {
        href: '/dashboard/projects',
        icon: FolderKanban,
        label: 'Proyectos'
    },
    {
        href: '/dashboard/time-tracking',
        icon: Clock,
        label: 'Fichajes'
    },
    {
        href: '/dashboard/settings',
        icon: Settings,
        label: 'Ajustes'
    }
]

export function BottomNav() {
    const pathname = usePathname()

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 h-16 safe-area-inset-bottom">
            <div className="flex items-center justify-around h-full px-2">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[64px]',
                                'active:scale-95',
                                isActive
                                    ? 'text-primary'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                            )}
                        >
                            <Icon className={cn(
                                'h-5 w-5 transition-transform',
                                isActive && 'scale-110'
                            )} />
                            <span className={cn(
                                'text-[10px] font-medium',
                                isActive && 'font-semibold'
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
