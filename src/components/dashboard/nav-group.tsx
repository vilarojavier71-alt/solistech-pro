'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, LayoutDashboard, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
    name: string
    href: string
    icon: LucideIcon
}

interface NavGroupProps {
    label: string
    icon?: LucideIcon
    items: NavItem[]
    collapsed?: boolean
}

export function NavGroup({ label, icon: Icon, items, collapsed = false }: NavGroupProps) {
    const pathname = usePathname()
    // Open by default if any child is active
    const isActiveGroup = items.some(item => pathname === item.href)
    const [isOpen, setIsOpen] = useState(isActiveGroup || !collapsed)

    return (
        <div className="space-y-1">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                )}
            >
                <div className="flex items-center gap-3">
                    {Icon && <Icon className="h-5 w-5" />}
                    <span>{label}</span>
                </div>
                {isOpen ? (
                    <ChevronDown className="h-4 w-4 opacity-50" />
                ) : (
                    <ChevronRight className="h-4 w-4 opacity-50" />
                )}
            </button>

            {isOpen && (
                <div className="space-y-1 pl-4 border-l border-zinc-200 dark:border-zinc-800 ml-4">
                    {items.map((item) => {
                        const ItemIcon = item.icon
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                                    isActive
                                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100'
                                )}
                            >
                                <ItemIcon
                                    className={cn(
                                        'mr-3 h-4 w-4 flex-shrink-0', // slightly smaller icon for sub-items
                                        isActive
                                            ? 'text-zinc-900 dark:text-zinc-100'
                                            : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-500 dark:group-hover:text-zinc-400'
                                    )}
                                />
                                {item.name}
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
