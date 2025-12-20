'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Send, AlertCircle, FileText, CheckCircle, ChevronDown, ChevronUp, ChevronRight, ChevronLeft } from 'lucide-react'
import { searchHelpArticles, createTicket } from '@/lib/actions/help'

/**
 * SUPPORT WIZARD (THE SHIELD)
 * 1. Intention -> 2. Shield (Search) -> 3. Deflection (Reading) -> 4. Submission
 */
export function SupportWizard({ onClose }: { onClose?: () => void }) {
    const [step, setStep] = useState(1)

    // Form State
    const [query, setQuery] = useState('')
    const [description, setDescription] = useState('')

    // Shield State
    const [articles, setArticles] = useState<any[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [selectedArticle, setSelectedArticle] = useState<any | null>(null)

    // Submission State
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    // DEBOUNCE SEARCH (The Shield Logic)
    useEffect(() => {
        if (query.length < 5) {
            setArticles([])
            return
        }

        const timer = setTimeout(async () => {
            setIsSearching(true)
            const results = await searchHelpArticles(query)
            setArticles(results || [])
            setIsSearching(false)
        }, 600)

        return () => clearTimeout(timer)
    }, [query])


    const handleSubmit = async () => {
        setIsSubmitting(true)
        setError('')

        const formData = new FormData()
        formData.append('subject', query)
        formData.append('description', description || query) // Fallback to query if desc empty
        formData.append('category', 'general')

        const res: any = await createTicket(null, formData)

        if (res?.error) {
            setError(res.error)
            setIsSubmitting(false)
        } else {
            setSuccess(true)
            setIsSubmitting(false)
            setTimeout(() => onClose?.(), 2500)
        }
    }

    return (
        <div className="w-full max-w-2xl mx-auto min-h-[400px] flex flex-col">

            {/* --- HEADER --- */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                    Centro de Ayuda
                </h2>
                <p className="text-zinc-500 text-sm mt-1">
                    {step === 1 && "¿En qué podemos ayudarte hoy?"}
                    {step === 2 && "Hemos encontrado estas soluciones:"}
                    {step === 3 && "¿Te sirvió este artículo?"}
                    {step === 4 && "Describe tu problema para el equipo técnico."}
                </p>
            </div>

            <div className="flex-1 relative">
                <AnimatePresence mode="wait">

                    {/* STEP 1: INTENTION */}
                    {step === 1 && (
                        <motion.div
                            key="s1"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <label className="text-sm font-medium text-zinc-300">Resume tu problema</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-4 pl-12 text-zinc-100 placeholder:text-zinc-600 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                                    placeholder="Ej: No puedo descargar la factura..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    autoFocus
                                />
                                <Search className="absolute left-4 top-4 text-zinc-500" size={20} />
                                {isSearching && (
                                    <div className="absolute right-4 top-4">
                                        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>

                            {/* PREDICTIVE RESULTS (Inline) */}
                            {articles.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/50 mt-4"
                                >
                                    <div className="p-3 bg-zinc-900 border-b border-zinc-800 text-xs font-semibold text-emerald-400 flex items-center gap-2">
                                        <SparklesIcon /> SUGERENCIAS INTELIGENTES
                                    </div>
                                    <div className="divide-y divide-zinc-800">
                                        {articles.slice(0, 3).map(article => (
                                            <div
                                                key={article.id}
                                                onClick={() => { setSelectedArticle(article); setStep(2); }}
                                                className="p-4 hover:bg-zinc-800 cursor-pointer transition-colors group"
                                            >
                                                <h4 className="text-zinc-200 font-medium group-hover:text-emerald-400 transition-colors flex justify-between items-center">
                                                    {article.title}
                                                    <ChevronRight size={16} className="text-zinc-600 group-hover:text-emerald-500" />
                                                </h4>
                                                <p className="text-sm text-zinc-500 mt-1 line-clamp-1">{article.subtitle || 'Guía rápida de solución'}</p>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* Bypass Button: Only show if query is long enough but user ignores Shield */}
                            {query.length > 10 && articles.length === 0 && !isSearching && (
                                <div className="mt-8 flex justify-end">
                                    <button
                                        onClick={() => setStep(4)}
                                        className="text-zinc-400 hover:text-white text-sm flex items-center gap-2 transition-colors"
                                    >
                                        No encuentro lo que busco, contactar <ChevronRight size={14} />
                                    </button>
                                </div>
                            )}

                            {query.length > 10 && articles.length > 0 && (
                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={() => setStep(4)}
                                        className="text-xs text-zinc-500 hover:text-zinc-300"
                                    >
                                        Ninguno me sirve, continuar
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* STEP 2: READING (Modal within Wizard) */}
                    {step === 2 && selectedArticle && (
                        <motion.div
                            key="s2"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-h-[500px] overflow-y-auto"
                        >
                            <button onClick={() => setStep(1)} className="text-xs text-zinc-500 hover:text-white mb-4 flex items-center gap-1">
                                <ChevronLeft size={12} /> Volver a búsqueda
                            </button>

                            <h3 className="text-xl font-bold text-white mb-4">{selectedArticle.title}</h3>
                            <div className="prose prose-invert prose-emerald text-sm max-w-none text-zinc-300">
                                {/* Simple renderer since we might not have 'react-markdown' installed in this task scope */}
                                {selectedArticle.content?.split('\n').map((line: string, i: number) => (
                                    <p key={i} className="mb-2">{line}</p>
                                ))}
                            </div>

                            <div className="mt-8 pt-6 border-t border-zinc-800 flex flex-col gap-3">
                                <p className="text-center text-sm text-zinc-400 mb-2">¿Se ha resuelto tu duda?</p>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => onClose?.()}
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle size={16} /> Sí, gracias
                                    </button>
                                    <button
                                        onClick={() => setStep(4)}
                                        className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2 rounded-lg font-medium text-sm"
                                    >
                                        No, necesito soporte
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 4: SUBMISSION (Final Resort) */}
                    {step === 4 && (
                        <motion.div
                            key="s4"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-4"
                        >
                            <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded text-amber-500 text-xs flex items-center gap-2 mb-4">
                                <AlertCircle size={16} />
                                Estás contactando con Ingeniería. Tiempo de respuesta estimado: 24h.
                            </div>

                            <div>
                                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Asunto</label>
                                <div className="text-white bg-zinc-900 p-3 rounded border border-zinc-800 mt-1">{query}</div>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Detalles adicionales</label>
                                <textarea
                                    className="w-full h-32 bg-zinc-900 border border-zinc-700 rounded-lg p-4 text-zinc-100 placeholder:text-zinc-600 focus:ring-2 focus:ring-emerald-500/50 outline-none mt-1 resize-none"
                                    placeholder="Describe los pasos para reproducir el problema..."
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            {error && <p className="text-red-400 text-sm">{error}</p>}

                            {success ? (
                                <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-lg text-center">
                                    <CheckCircle className="mx-auto text-emerald-500 mb-2" size={32} />
                                    <h4 className="text-emerald-500 font-bold">Ticket Enviado</h4>
                                    <p className="text-emerald-400/80 text-sm">Te notificaremos por email.</p>
                                </div>
                            ) : (
                                <div className="flex gap-3 pt-4">
                                    <button onClick={() => setStep(1)} className="px-4 py-2 text-zinc-400 hover:text-white text-sm">Atrás</button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        className="flex-1 bg-white hover:bg-zinc-200 text-black font-bold py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Enviando...' : (<><Send size={16} /> Enviar Ticket</>)}
                                    </button>
                                </div>
                            )}

                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    )
}

function SparklesIcon() {
    return (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 3.214L13 21l-2.286-6.857L5 12l5.714-3.214z" />
        </svg>
    )
}
