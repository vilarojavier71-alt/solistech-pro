'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    MessageCircle,
    X,
    Send,
    Bot,
    User,
    Briefcase,
    Wrench,
    FileText,
    Loader2,
    Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

type AssistantType = 'sales' | 'technical' | 'admin' | 'support'

const ASSISTANT_CONFIG = {
    sales: {
        name: 'SolarBot Ventas',
        icon: Briefcase,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        description: 'Asistente comercial'
    },
    technical: {
        name: 'SolarBot Técnico',
        icon: Wrench,
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/10',
        description: 'Asistente de ingeniería'
    },
    admin: {
        name: 'SolarBot Admin',
        icon: FileText,
        color: 'text-purple-500',
        bgColor: 'bg-purple-500/10',
        description: 'Asistente administrativo'
    },
    support: {
        name: 'SolarBot',
        icon: Bot,
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-500/10',
        description: 'Asistente de soporte'
    }
}

interface ChatWidgetProps {
    defaultAssistant?: AssistantType
    contextId?: string // Lead ID, Project ID, o Customer ID según el asistente
}

export function ChatWidget({ defaultAssistant = 'support', contextId }: ChatWidgetProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [assistant, setAssistant] = useState<AssistantType>(defaultAssistant)
    const scrollRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const config = ASSISTANT_CONFIG[assistant]
    const AssistantIcon = config.icon

    // Auto-scroll al último mensaje
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    // Focus en input al abrir
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isOpen])

    // Mensaje de bienvenida
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{
                id: 'welcome',
                role: 'assistant',
                content: `¡Hola! 👋 Soy ${config.name}, tu ${config.description}. ¿En qué puedo ayudarte?`,
                timestamp: new Date()
            }])
        }
    }, [isOpen, config.name, config.description])

    const handleSend = async () => {
        if (!input.trim() || isLoading) return

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsLoading(true)

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(m => ({
                        role: m.role,
                        content: m.content
                    })),
                    assistant,
                    contextId
                })
            })

            if (!response.ok) {
                throw new Error('Error en la respuesta')
            }

            const data = await response.json()

            setMessages(prev => [...prev, {
                id: Date.now().toString() + '-ai',
                role: 'assistant',
                content: data.content || 'Lo siento, no pude procesar tu mensaje.',
                timestamp: new Date()
            }])
        } catch (error) {
            setMessages(prev => [...prev, {
                id: Date.now().toString() + '-error',
                role: 'assistant',
                content: '❌ Error de conexión. Por favor, inténtalo de nuevo.',
                timestamp: new Date()
            }])
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <>
            {/* Botón flotante */}
            <Button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg",
                    "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600",
                    "transition-all duration-300 hover:scale-110"
                )}
            >
                {isOpen ? (
                    <X className="h-6 w-6 text-white" />
                ) : (
                    <MessageCircle className="h-6 w-6 text-white" />
                )}
            </Button>

            {/* Panel de chat */}
            {isOpen && (
                <Card className={cn(
                    "fixed bottom-24 right-6 z-50 w-[380px] shadow-2xl",
                    "border-border/50 bg-background/95 backdrop-blur-lg",
                    "animate-in slide-in-from-bottom-5 duration-300"
                )}>
                    {/* Header */}
                    <CardHeader className={cn("pb-2 border-b", config.bgColor)}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={cn("p-2 rounded-lg", config.bgColor)}>
                                    <AssistantIcon className={cn("h-5 w-5", config.color)} />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-semibold">
                                        {config.name}
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground">
                                        {config.description}
                                    </p>
                                </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                                <Sparkles className="h-3 w-3 mr-1" />
                                IA
                            </Badge>
                        </div>
                    </CardHeader>

                    {/* Messages */}
                    <CardContent className="p-0">
                        <ScrollArea className="h-[320px] p-4" ref={scrollRef}>
                            <div className="space-y-4">
                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={cn(
                                            "flex gap-2",
                                            message.role === 'user' ? 'justify-end' : 'justify-start'
                                        )}
                                    >
                                        {message.role === 'assistant' && (
                                            <div className={cn("p-1.5 rounded-lg shrink-0 h-fit", config.bgColor)}>
                                                <AssistantIcon className={cn("h-4 w-4", config.color)} />
                                            </div>
                                        )}
                                        <div
                                            className={cn(
                                                "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                                                message.role === 'user'
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-muted"
                                            )}
                                        >
                                            <p className="whitespace-pre-wrap">{message.content}</p>
                                        </div>
                                        {message.role === 'user' && (
                                            <div className="p-1.5 rounded-lg bg-primary/10 shrink-0 h-fit">
                                                <User className="h-4 w-4 text-primary" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex gap-2">
                                        <div className={cn("p-1.5 rounded-lg", config.bgColor)}>
                                            <Loader2 className={cn("h-4 w-4 animate-spin", config.color)} />
                                        </div>
                                        <div className="bg-muted rounded-lg px-3 py-2">
                                            <span className="text-sm text-muted-foreground">
                                                Pensando...
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>

                        {/* Input */}
                        <div className="p-4 border-t">
                            <div className="flex gap-2">
                                <Input
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Escribe tu mensaje..."
                                    disabled={isLoading}
                                    className="flex-1"
                                />
                                <Button
                                    onClick={handleSend}
                                    disabled={!input.trim() || isLoading}
                                    size="icon"
                                    className="shrink-0"
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </>
    )
}
