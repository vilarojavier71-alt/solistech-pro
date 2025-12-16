'use client'

import React from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export function ThemeSelector({ className }: { className?: string }) {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" className={cn('h-9 w-9', className)} disabled>
                <Sun className="h-4 w-4" />
            </Button>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        'h-9 w-9 transition-all duration-300',
                        'hover:bg-slate-100 dark:hover:bg-navy-800',
                        'hover:scale-110',
                        className
                    )}
                >
                    {theme === 'dark' ? (
                        <Moon className="h-4 w-4 text-teal-400" />
                    ) : theme === 'light' ? (
                        <Sun className="h-4 w-4 text-gold-500" />
                    ) : (
                        <Monitor className="h-4 w-4 text-slate-600" />
                    )}
                    <span className="sr-only">Cambiar tema</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => setTheme('light')} className="cursor-pointer">
                    <Sun className="mr-2 h-4 w-4 text-gold-500" />
                    <span>Claro</span>
                    {theme === 'light' && <span className="ml-auto">âœ“</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')} className="cursor-pointer">
                    <Moon className="mr-2 h-4 w-4 text-teal-400" />
                    <span>Oscuro</span>
                    {theme === 'dark' && <span className="ml-auto">âœ“</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')} className="cursor-pointer">
                    <Monitor className="mr-2 h-4 w-4 text-slate-600" />
                    <span>Sistema</span>
                    {theme === 'system' && <span className="ml-auto">âœ“</span>}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

// Sidebar variant with labels - MORE PROMINENT
export function ThemeSelectorSidebar() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className="space-y-2 px-4 py-4">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Tema
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-2 px-4 py-4 bg-slate-50 dark:bg-slate-800/50">
            <div className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-3">
                ðŸŽ¨ Apariencia
            </div>

            <button
                onClick={() => setTheme('light')}
                className={cn(
                    'flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all duration-200 font-medium',
                    theme === 'light'
                        ? 'bg-gold-500 text-white shadow-lg scale-105'
                        : 'bg-white dark:bg-slate-700 hover:bg-gold-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 shadow-sm hover:shadow-md'
                )}
            >
                <Sun className={cn('h-5 w-5', theme === 'light' ? 'text-white' : 'text-gold-500')} />
                <span className="text-sm">Claro</span>
                {theme === 'light' && <span className="ml-auto text-lg">âœ“</span>}
            </button>

            <button
                onClick={() => setTheme('dark')}
                className={cn(
                    'flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all duration-200 font-medium',
                    theme === 'dark'
                        ? 'bg-teal-500 text-white shadow-lg scale-105'
                        : 'bg-white dark:bg-slate-700 hover:bg-teal-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 shadow-sm hover:shadow-md'
                )}
            >
                <Moon className={cn('h-5 w-5', theme === 'dark' ? 'text-white' : 'text-teal-500')} />
                <span className="text-sm">Oscuro</span>
                {theme === 'dark' && <span className="ml-auto text-lg">âœ“</span>}
            </button>

            <button
                onClick={() => setTheme('system')}
                className={cn(
                    'flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all duration-200 font-medium',
                    theme === 'system'
                        ? 'bg-slate-600 text-white shadow-lg scale-105'
                        : 'bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 shadow-sm hover:shadow-md'
                )}
            >
                <Monitor className={cn('h-5 w-5', theme === 'system' ? 'text-white' : 'text-slate-600')} />
                <span className="text-sm">Sistema</span>
                {theme === 'system' && <span className="ml-auto text-lg">âœ“</span>}
            </button>
        </div>
    )
}
