'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function CollapsibleSidebar({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isMounted, setIsMounted] = useState(false)

    // Cargar estado del localStorage
    useEffect(() => {
        setIsMounted(true)
        const saved = localStorage.getItem('sidebar-collapsed')
        if (saved !== null) {
            setIsCollapsed(JSON.parse(saved))
        }
    }, [])

    // Guardar estado en localStorage
    const toggle = () => {
        const newState = !isCollapsed
        setIsCollapsed(newState)
        localStorage.setItem('sidebar-collapsed', JSON.stringify(newState))
    }

    // Evitar flash durante hidratación
    if (!isMounted) {
        return (
            <aside className="w-64 border-r bg-card">
                {children}
            </aside>
        )
    }

    return (
        <aside
            className={cn(
                "border-r bg-card transition-all duration-300 ease-in-out relative",
                isCollapsed ? "w-16" : "w-64"
            )}
        >
            {/* Botón de colapso */}
            <Button
                variant="ghost"
                size="icon"
                onClick={toggle}
                className={cn(
                    "absolute -right-3 top-6 z-50 h-6 w-6 rounded-full border bg-background shadow-md hover:bg-accent",
                    "transition-transform duration-300"
                )}
                aria-label={isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
            >
                {isCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                ) : (
                    <ChevronLeft className="h-4 w-4" />
                )}
            </Button>

            {/* Contenido del sidebar */}
            <div className={cn(
                "transition-opacity duration-300",
                isCollapsed && "opacity-0 pointer-events-none"
            )}>
                {children}
            </div>

            {/* Versión colapsada: solo iconos */}
            {isCollapsed && (
                <div className="p-4 space-y-2">
                    {/* Aquí se pueden añadir iconos si es necesario */}
                    <div className="text-xs text-muted-foreground text-center">
                        Menu
                    </div>
                </div>
            )}
        </aside>
    )
}
