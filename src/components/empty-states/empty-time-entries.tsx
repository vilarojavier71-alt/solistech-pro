/**
 * Empty State: No Time Entries
 * 
 * Pantalla vacÃ­a cuando el usuario no ha fichado.
 * Instrucciones claras sobre cómo usar el sistema de fichajes.
 * 
 * @author @FRONTEND_DISENOUI
 * @version 1.0.0
 */

"use client"

import { Clock, MapPin, Wifi } from 'lucide-react'
import { motion } from 'framer-motion'

export function EmptyTimeEntries() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center min-h-[500px] text-center px-4 py-12"
        >
            {/* Icono */}
            <div className="relative mb-8">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-teal-500 to-emerald-500 blur-3xl"
                />
                <Clock className="size-24 text-teal-500 relative" />
            </div>

            {/* TÃ­tulo */}
            <h3 className="text-3xl font-bold text-slate-100 mb-3">
                AÃºn no has fichado hoy
            </h3>

            {/* Descripción */}
            <p className="text-slate-400 max-w-md mb-8 text-lg">
                Desliza el botón naranja para fichar tu entrada.
                El sistema validará tu ubicación GPS automáticamente.
            </p>

            {/* CaracterÃ­sticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10 max-w-lg">
                <div className="flex items-start gap-3 text-left bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                    <MapPin className="size-6 text-teal-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-slate-300 mb-1">GPS Automático</p>
                        <p className="text-xs text-slate-500">Valida que estás en la obra (500m de radio)</p>
                    </div>
                </div>
                <div className="flex items-start gap-3 text-left bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                    <Wifi className="size-6 text-teal-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-slate-300 mb-1">Funciona Offline</p>
                        <p className="text-xs text-slate-500">Sin cobertura en tejados remotos</p>
                    </div>
                </div>
            </div>

            {/* Instrucción visual */}
            <div className="bg-gradient-to-r from-teal-900/30 to-emerald-900/30 border border-teal-700/50 rounded-lg p-6 max-w-md">
                <p className="text-sm text-slate-300 mb-2">
                    ?? <strong>Cómo fichar:</strong>
                </p>
                <ol className="text-sm text-slate-400 text-left space-y-2">
                    <li>1. Desliza el botón hasta el final (previene fichajes accidentales)</li>
                    <li>2. El móvil vibrará al confirmar</li>
                    <li>3. Verás el cronómetro en verde cuando estés fichado</li>
                </ol>
            </div>
        </motion.div>
    )
}
