/**
 * Empty State: No Customers
 * 
 * Pantalla vacÃ­a cuando no hay clientes.
 * Opciones claras: importar o crear manualmente.
 * 
 * @author @FRONTEND_DISENOUI
 * @version 1.0.0
 */

"use client"

import { Button } from '@/components/ui/button'
import { Upload, UserPlus, FileSpreadsheet } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export function EmptyCustomers() {
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
                    className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 blur-3xl"
                />
                <UserPlus className="size-24 text-amber-500 relative" />
            </div>

            {/* TÃ­tulo */}
            <h3 className="text-3xl font-bold text-slate-100 mb-3">
                Añade tus Primeros Clientes
            </h3>

            {/* Descripción */}
            <p className="text-slate-400 max-w-md mb-10 text-lg">
                Importa tu base de datos desde Excel o crea clientes manualmente.
                Podrás vincularlos a proyectos y hacer seguimiento del pipeline de ventas.
            </p>

            {/* Opciones */}
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Button
                    asChild
                    size="lg"
                    className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                >
                    <Link href="/dashboard/import">
                        <Upload className="mr-2 size-5" />
                        Importar desde Excel
                    </Link>
                </Button>

                <Button asChild size="lg" variant="outline">
                    <Link href="/dashboard/customers/new">
                        <UserPlus className="mr-2 size-5" />
                        Crear Cliente Manual
                    </Link>
                </Button>
            </div>

            {/* Características de importación */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6 max-w-lg">
                <div className="flex items-center gap-2 mb-4">
                    <FileSpreadsheet className="size-5 text-amber-500" />
                    <p className="text-sm font-medium text-slate-300">Importación Inteligente</p>
                </div>
                <ul className="text-xs text-slate-400 text-left space-y-2">
                    <li>âœ… Formatos soportados: .xlsx, .xls, .csv</li>
                    <li>✅ Detección automática de columnas</li>
                    <li>✅ Máximo 10.000 filas por archivo</li>
                    <li>âš ï¸ AsegÃºrate de que la primera fila tiene los nombres de columnas</li>
                </ul>
            </div>

            {/* Ayuda */}
            <p className="text-xs text-slate-500 mt-6">
                ¿Necesitas ayuda con la importación?{' '}
                <Link href="/dashboard/help" className="text-cyan-500 hover:underline">
                    Ver guÃ­a paso a paso
                </Link>
            </p>
        </motion.div>
    )
}
