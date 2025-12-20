/**
 * Empty State: No Projects
 * 
 * Pantalla vacÃ­a cuando el usuario no tiene proyectos.
 * GuÃ­a visual para crear el primer estudio solar.
 * 
 * @author @FRONTEND_DISENOUI
 * @version 1.0.0
 */

"use client"

import { Button } from '@/components/ui/button'
import { PlusCircle, Sparkles, Upload } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export function EmptyProjects() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center min-h-[500px] text-center px-4 py-12"
        >
            {/* Icono animado */}
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
                    className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-teal-500 blur-3xl"
                />
                <Sparkles className="size-24 text-cyan-500 relative" />
            </div>

            {/* TÃ­tulo */}
            <h3 className="text-3xl font-bold text-slate-100 mb-3">
                Inicia tu Primer Estudio Solar
            </h3>

            {/* Descripción */}
            <p className="text-slate-400 max-w-md mb-10 text-lg">
                Crea un proyecto en segundos. Solo necesitas la dirección del cliente
                y la IA calculará automáticamente la producción solar, el ahorro y el ROI.
            </p>

            {/* CTA Principal */}
            <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-lg px-8 py-6 h-auto"
            >
                <Link href="/dashboard/projects/new">
                    <PlusCircle className="mr-2 size-6" />
                    Crear Primer Proyecto
                </Link>
            </Button>

            {/* Ayuda secundaria */}
            <div className="mt-8 flex items-center gap-6 text-sm">
                <p className="text-slate-500">
                    Â¿Tienes clientes en Excel?
                </p>
                <Button asChild variant="ghost" size="sm">
                    <Link href="/dashboard/import" className="text-cyan-500 hover:text-cyan-400">
                        <Upload className="mr-2 size-4" />
                        Impórtalos aquí
                    </Link>
                </Button>
            </div>

            {/* CaracterÃ­sticas rÃ¡pidas */}
            <div className="mt-12 grid grid-cols-3 gap-6 max-w-2xl">
                <div className="text-center">
                    <div className="text-3xl mb-2">âš¡</div>
                    <p className="text-sm font-medium text-slate-300">Cálculo Automático</p>
                    <p className="text-xs text-slate-500">Producción y ROI en segundos</p>
                </div>
                <div className="text-center">
                    <div className="text-3xl mb-2">ðŸ¤–</div>
                    <p className="text-sm font-medium text-slate-300">IA Integrada</p>
                    <p className="text-xs text-slate-500">Presentaciones profesionales</p>
                </div>
                <div className="text-center">
                    <div className="text-3xl mb-2">ðŸ“Š</div>
                    <p className="text-sm font-medium text-slate-300">Subvenciones</p>
                    <p className="text-xs text-slate-500">Cálculo automático por CCAA</p>
                </div>
            </div>
        </motion.div>
    )
}
