'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Bot, BookOpen, Video, ChevronRight, MessageSquare } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { HELP_TOPICS } from './help-data'

export function DynamicHelpCenter() {
    const [search, setSearch] = useState('')
    const [activeTab, setActiveTab] = useState<'guides' | 'ai'>('guides')
    const [selectedTopic, setSelectedTopic] = useState<any>(null)

    // Filter topics
    const filteredTopics = HELP_TOPICS.filter(t =>
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
            {/* LEFT: Navigation & Search */}
            <Card className="lg:col-span-1 p-4 flex flex-col gap-4 bg-muted/20 border-border/50">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar ayuda..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex gap-2">
                    <Button
                        variant={activeTab === 'guides' ? 'default' : 'outline'}
                        className="flex-1"
                        onClick={() => setActiveTab('guides')}
                    >
                        <BookOpen className="mr-2 h-4 w-4" /> Guías
                    </Button>
                    <Button
                        variant={activeTab === 'ai' ? 'default' : 'outline'}
                        className="flex-1"
                        onClick={() => setActiveTab('ai')}
                    >
                        <Bot className="mr-2 h-4 w-4" /> Asistente IA
                    </Button>
                </div>

                <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-2">
                        {filteredTopics.map((topic, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    setSelectedTopic(topic)
                                    setActiveTab('guides')
                                }}
                                className={`w-full text-left p-3 rounded-lg border transition-all ${selectedTopic?.id === topic.id
                                        ? 'bg-primary/10 border-primary/50'
                                        : 'bg-card border-border hover:border-primary/30'
                                    }`}
                            >
                                <div className="font-medium text-sm">{topic.title}</div>
                                <div className="text-xs text-muted-foreground line-clamp-1 mt-1">{topic.description}</div>
                            </button>
                        ))}
                    </div>
                </ScrollArea>
            </Card>

            {/* RIGHT: Content Area */}
            <Card className="lg:col-span-2 p-6 bg-card border-border relative overflow-hidden flex flex-col">
                <AnimatePresence mode="wait">
                    {activeTab === 'guides' ? (
                        <motion.div
                            key="guides"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="h-full flex flex-col"
                        >
                            {selectedTopic ? (
                                <div className="space-y-6 overflow-y-auto pr-2">
                                    <div>
                                        <Badge variant="outline" className="mb-2">{selectedTopic.category}</Badge>
                                        <h2 className="text-2xl font-bold">{selectedTopic.title}</h2>
                                        <p className="text-muted-foreground mt-2">{selectedTopic.description}</p>
                                    </div>

                                    {/* Video Placeholder */}
                                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border border-dashed border-border">
                                        <div className="text-center text-muted-foreground">
                                            <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                            <p>Video Tutorial no disponible en demo</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-lg">Pasos a seguir</h3>
                                        <div className="space-y-4">
                                            {selectedTopic.steps.map((step: string, idx: number) => (
                                                <div key={idx} className="flex gap-4 p-3 rounded-lg bg-muted/30">
                                                    <div className="flex-none w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                                                        {idx + 1}
                                                    </div>
                                                    <p className="text-sm pt-0.5">{step}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-border">
                                        <Button className="w-full sm:w-auto" asChild>
                                            <a href={selectedTopic.cta.link}>
                                                {selectedTopic.cta.text} <ChevronRight className="ml-2 h-4 w-4" />
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground opacity-50">
                                    <BookOpen className="h-16 w-16 mb-4" />
                                    <p className="text-lg">Selecciona un tema para ver la guía</p>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="ai-assistant"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="h-full flex flex-col"
                        >
                            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                                <Bot className="h-16 w-16 text-primary mb-2" />
                                <h2 className="text-2xl font-bold">Asistente de Soporte IA</h2>
                                <p className="text-muted-foreground max-w-md">
                                    Estoy conectado a la base de conocimiento y puedo guiarte paso a paso.
                                    ¿En qué necesitas ayuda hoy?
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md mt-4">
                                    <Button variant="outline" className="justify-start h-auto py-3">
                                        <MessageSquare className="mr-2 h-4 w-4" />
                                        ¿Cómo creo una factura?
                                    </Button>
                                    <Button variant="outline" className="justify-start h-auto py-3">
                                        <MessageSquare className="mr-2 h-4 w-4" />
                                        Error al importar CSV
                                    </Button>
                                    <Button variant="outline" className="justify-start h-auto py-3">
                                        <MessageSquare className="mr-2 h-4 w-4" />
                                        Configurar API Keys
                                    </Button>
                                    <Button variant="outline" className="justify-start h-auto py-3">
                                        <MessageSquare className="mr-2 h-4 w-4" />
                                        Exportar PDF
                                    </Button>
                                </div>
                                {/* NOTE: To make this fully functional, we would embed the Vercel AI SDK Chat UI here. 
                                    For now, we use the global CommandCenter for actual interaction. */}
                                <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/20 text-sm">
                                    💡 <strong>Tip:</strong> Usa el botón flotante "IA Command Center" (abajo a la derecha) para chatear conmigo en cualquier momento.
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>
        </div>
    )
}
