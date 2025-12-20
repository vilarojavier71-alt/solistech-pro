'use client'

import React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function DarkModeToggle({ className }: { className?: string }) {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    // Avoid hydration mismatch
    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <Button
                variant="ghost"
                size="icon"
                className={cn('h-9 w-9', className)}
                disabled
            >
                <Sun className="h-4 w-4" />
            </Button>
        )
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={cn(
                'h-9 w-9 transition-all duration-300',
                'hover:bg-slate-100 dark:hover:bg-navy-800',
                'hover:scale-110',
                className
            )}
            title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
            {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-gold-400 rotate-0 scale-100 transition-all dark:rotate-90 dark:scale-100" />
            ) : (
                <Moon className="h-4 w-4 text-navy-600 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            )}
            <span className="sr-only">Toggle theme</span>
        </Button>
    )
}

// Variant for sidebar with label
export function DarkModeToggleSidebar() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
                <Sun className="h-4 w-4" />
                <span className="text-sm">Tema</span>
            </div>
        )
    }

    return (
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={cn(
                'flex items-center gap-3 w-full px-3 py-2 rounded-lg',
                'transition-all duration-200',
                'hover:bg-slate-100 dark:hover:bg-navy-800',
                'text-slate-700 dark:text-slate-300',
                'hover:text-navy-900 dark:hover:text-white'
            )}
        >
            {theme === 'dark' ? (
                <>
                    <Sun className="h-4 w-4 text-gold-400" />
                    <span className="text-sm font-medium">Modo Claro</span>
                </>
            ) : (
                <>
                    <Moon className="h-4 w-4 text-navy-600 dark:text-navy-400" />
                    <span className="text-sm font-medium">Modo Oscuro</span>
                </>
            )}
        </button>
    )
}
