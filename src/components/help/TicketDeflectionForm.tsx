'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Send, CheckCircle, AlertCircle, FileText } from 'lucide-react'
import { searchHelpArticles, createTicket } from '@/lib/actions/help'
// import { useToast } from "@/components/ui/use-toast" // Assume UI components exist

interface DeflectionFormProps {
    categories: { slug: string, name: string }[]
    onClose?: () => void
}

export function TicketDeflectionForm({ categories, onClose }: DeflectionFormProps) {
    const [step, setStep] = useState(1)
    const [category, setCategory] = useState('')
    const [subject, setSubject] = useState('')
    const [description, setDescription] = useState('')
    const [suggestedArticles, setSuggestedArticles] = useState<any[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [ticketState, setTicketState] = useState<{ loading: boolean, success?: boolean, error?: string }>({ loading: false })

    // Step 1: Diagnose -> Search
    const handleSubjectBlur = async () => {
        if (subject.length > 5) {
            setIsSearching(true)
            const results = await searchHelpArticles(subject)
            setSuggestedArticles(results)
            setIsSearching(false)
            if (results.length > 0) setStep(2) // Inteception!
        }
    }

    const handleSubmitTicket = async (e: React.FormEvent) => {
        e.preventDefault()
        setTicketState({ loading: true })

        const formData = new FormData()
        formData.append('category', category)
        formData.append('subject', subject)
        formData.append('description', description)

        const result: any = await createTicket(null, formData)

        if (result?.error) {
            setTicketState({ loading: false, error: result.error })
        } else {
            setTicketState({ loading: false, success: true })
            setTimeout(() => onClose?.(), 2000)
        }
    }

    return (
        <div className="w-full max-w-2xl mx-auto bg-white dark:bg-zinc-900 rounded-xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
            {/* Header */}
            <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 border-b border-zinc-200 dark:border-zinc-800">
                <h2 className="text-xl font-bold">¿Cómo podemos ayudarte?</h2>
                <p className="text-zinc-500 text-sm">Nuestro asistente intentará resolver tu duda al instante.</p>
            </div>

            <div className="p-6">
                <AnimatePresence mode="wait">
                    {/* STEP 1: INITIAL INPUT */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <div>
                                <label className="block text-sm font-medium mb-1">Categoría</label>
                                <select
                                    className="w-full p-2 rounded-md border bg-transparent"
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                >
                                    <option value="" disabled>Selecciona un tema...</option>
                                    {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Asunto</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        className="w-full p-2 pl-10 rounded-md border bg-transparent"
                                        placeholder="Ej: No puedo ver mi factura..."
                                        value={subject}
                                        onChange={e => setSubject(e.target.value)}
                                        onBlur={handleSubjectBlur}
                                    />
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                                </div>
                                <p className="text-xs text-zinc-500 mt-1">Escribe tu problema para buscar soluciones.</p>
                            </div>

                            {/* Show Next button only if no interception happened yet or empty search */}
                            {suggestedArticles.length === 0 && !isSearching && subject.length > 5 && (
                                <button
                                    onClick={() => setStep(3)} // Skip directly if no articles found
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md mt-4"
                                >
                                    Continuar
                                </button>
                            )}
                        </motion.div>
                    )}

                    {/* STEP 2: DEFLECTION (Articles Found) */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-4"
                        >
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                                <h3 className="flex items-center gap-2 font-semibold text-blue-800 dark:text-blue-300">
                                    <FileText className="h-5 w-5" />
                                    Hemos encontrado esto para ti
                                </h3>
                                <div className="mt-3 space-y-2">
                                    {suggestedArticles.map(article => (
                                        <div key={article.id} className="bg-white dark:bg-zinc-800 p-3 rounded shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-zinc-100 dark:border-zinc-700">
                                            <a href={`/help/${article.slug}`} target="_blank" className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                                                {article.title}
                                            </a>
                                            <p className="text-sm text-zinc-500 truncate">{article.subtitle}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => onClose?.()} // Success! Deflected.
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white p-2 rounded-md flex items-center justify-center gap-2"
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    ¡Me sirvió!
                                </button>
                                <button
                                    onClick={() => setStep(3)} // Failed deflection
                                    className="flex-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 p-2 rounded-md"
                                >
                                    No me sirve, contactar soporte
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: FINAL CONTACT FORM */}
                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-4"
                        >
                            <div>
                                <label className="block text-sm font-medium mb-1">Detalles del problema</label>
                                <textarea
                                    className="w-full p-2 rounded-md border bg-transparent min-h-[120px]"
                                    placeholder="Describe lo que sucede..."
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                />
                            </div>

                            {ticketState.error && (
                                <div className="text-red-500 text-sm flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    {ticketState.error}
                                </div>
                            )}

                            {ticketState.success ? (
                                <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 p-4 rounded-md text-center">
                                    <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                                    Ticket enviado correctamente. Te responderemos pronto.
                                </div>
                            ) : (
                                <button
                                    onClick={handleSubmitTicket}
                                    disabled={ticketState.loading}
                                    className="w-full bg-black dark:bg-white text-white dark:text-black p-2 rounded-md flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
                                >
                                    {ticketState.loading ? 'Enviando...' : (
                                        <>
                                            <Send className="h-4 w-4" /> Enviar Ticket
                                        </>
                                    )}
                                </button>
                            )}

                            {!ticketState.success && (
                                <button onClick={() => setStep(step - 1)} className="w-full text-zinc-500 text-sm hover:underline mt-2">
                                    Atrás
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
