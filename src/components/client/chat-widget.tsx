'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    MessageCircle,
    X,
    Send,
    Sun,
    Loader2,
    Bot,
    User
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

interface ChatWidgetProps {
    userName?: string
    initialMessage?: string
}

export function ChatWidget({ userName = 'Cliente', initialMessage }: ChatWidgetProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Mensaje inicial al abrir
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{
                role: 'assistant',
                content: initialMessage || `¡Hola ${userName}! ☀️ Soy tu asistente solar. 
¿En qué puedo ayudarte hoy?

Puedes preguntarme:
• "¿Cómo va mi proyecto?"
• "¿Qué documentos necesito?"
• "¿Cuándo es la instalación?"`
            }])
        }
    }, [isOpen, userName, initialMessage, messages.length])

    // Auto-scroll al nuevo mensaje
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    // Focus input al abrir
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [isOpen])

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return

        const userMessage = input.trim()
        setInput('')
        setMessages(prev => [...prev, { role: 'user', content: userMessage }])
        setIsLoading(true)

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, { role: 'user', content: userMessage }]
                })
            })

            if (!response.ok) throw new Error('Error en respuesta')

            const data = await response.json()
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.content || data.error || 'Lo siento, no pude procesar tu mensaje.'
            }])
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Lo siento, hubo un error. Por favor, intenta de nuevo. 🔄'
            }])
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    return (
        <>
            {/* Botón flotante */}
            <Button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "fixed bottom-6 right-6 z-50 rounded-full w-14 h-14 shadow-lg",
                    "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600",
                    "transition-all duration-300",
                    isOpen && "scale-0 opacity-0"
                )}
                size="icon"
            >
                <MessageCircle className="w-6 h-6 text-white" />
            </Button>

            {/* Panel de chat */}
            <div className={cn(
                "fixed bottom-6 right-6 z-50 transition-all duration-300",
                isOpen
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-95 pointer-events-none"
            )}>
                <Card className="w-[360px] shadow-2xl border-2">
                    {/* Header */}
                    <CardHeader className="pb-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-t-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sun className="w-6 h-6" />
                                <div>
                                    <CardTitle className="text-base">Asistente Solar</CardTitle>
                                    <p className="text-xs text-white/80">Tu guía de energía limpia</p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsOpen(false)}
                                className="text-white hover:bg-white/20"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {/* Mensajes */}
                        <ScrollArea className="h-[320px] p-4" ref={scrollRef}>
                            <div className="space-y-4">
                                {messages.map((msg, idx) => (
                                    <MessageBubble key={idx} message={msg} />
                                ))}
                                {isLoading && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Bot className="w-4 h-4" />
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span className="text-sm">Escribiendo...</span>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>

                        {/* Input */}
                        <div className="p-3 border-t bg-muted/30">
                            <div className="flex gap-2">
                                <Input
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Escribe tu pregunta..."
                                    disabled={isLoading}
                                    className="flex-1"
                                />
                                <Button
                                    onClick={sendMessage}
                                    disabled={!input.trim() || isLoading}
                                    size="icon"
                                    className="bg-amber-500 hover:bg-amber-600"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    )
}

function MessageBubble({ message }: { message: Message }) {
    const isAssistant = message.role === 'assistant'

    return (
        <div className={cn(
            "flex gap-2",
            isAssistant ? "justify-start" : "justify-end"
        )}>
            {isAssistant && (
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                    <Sun className="w-4 h-4 text-amber-600" />
                </div>
            )}
            <div className={cn(
                "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                isAssistant
                    ? "bg-muted text-foreground"
                    : "bg-primary text-primary-foreground"
            )}>
                <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
            {!isAssistant && (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-primary" />
                </div>
            )}
        </div>
    )
}
