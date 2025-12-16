'use client'

import React from 'react'
import { ErrorBoundary as GlobalErrorBoundary } from '@/components/ui/error-boundary'
import { motion, AnimatePresence } from 'framer-motion'
import { Toaster } from 'sonner'

/**
 * LayoutWrapper
 * 
 * Envoltorio maestro para las páginas del dashboard.
 * - ErrorBoundary: Captura errores de renderizado.
 * - Animations: Transiciones suaves entre páginas.
 * - Toaster: Notificaciones globales (si no están ya en RootLayout, pero aquí seguro).
 */
export function LayoutWrapper({ children }: { children: React.ReactNode }) {
    return (
        <GlobalErrorBoundary>
            <AnimatePresence mode="wait">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="flex-1 w-full"
                >
                    {children}
                </motion.div>
            </AnimatePresence>
        </GlobalErrorBoundary>
    )
}
