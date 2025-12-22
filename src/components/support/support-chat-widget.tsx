'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import {
    MessageCircle,
    Send,
    X,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Clock,
    User,
    Headphones
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { sendMessage, getMessages, markMessagesAsRead } from '@/lib/actions/support-tickets'

interface Message {
    id: string
    sender_id: string
    sender_role: 'client' | 'technician' | 'admin' | 'system'
    content: string
    is_internal: boolean
    created_at: string
    read_at?: string
}

interface SupportChatWidgetProps {
    ticketId: string
    ticketSubject: string
    ticketStatus: string
    currentUserId: string
}

export function SupportChatWidget({
    ticketId,
    ticketSubject,
    ticketStatus,
    currentUserId
}: SupportChatWidgetProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isSending, setIsSending] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    // Load messages
    const loadMessages = useCallback(async () => {
        setIsLoading(true)
        try {
            const result = await getMessages(ticketId)
            if (result.success) {
                setMessages(result.data as Message[])
                // Mark as read
                await markMessagesAsRead(ticketId)
            }
        } catch (error) {
            console.error('Error loading messages:', error)
        } finally {
            setIsLoading(false)
        }
    }, [ticketId])

    // Load messages when opened
    useEffect(() => {
        if (isOpen) {
            loadMessages()
        }
    }, [isOpen, loadMessages])

    // Scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    // Send message
    const handleSend = async () => {
        if (!newMessage.trim() || isSending) return

        setIsSending(true)

        // Optimistic update
        const optimisticMessage: Message = {
            id: `temp-${Date.now()}`,
            sender_id: currentUserId,
            sender_role: 'client',
            content: newMessage,
            is_internal: false,
            created_at: new Date().toISOString(),
        }
        setMessages(prev => [...prev, optimisticMessage])
        setNewMessage('')

        try {
            const result = await sendMessage({
                ticketId,
                content: newMessage,
                isInternal: false
            })

            if (result.success) {
                // Replace optimistic message with real one
                setMessages(prev =>
                    prev.map(m => m.id === optimisticMessage.id ? result.data as Message : m)
                )
                toast.success('Mensaje enviado')
            } else {
                // Rollback optimistic update
                setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id))
                toast.error(result.error || 'Error al enviar')
            }
        } catch (error) {
            setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id))
            toast.error('Error al enviar el mensaje')
        } finally {
            setIsSending(false)
        }
    }

    // Get status badge
    const getStatusBadge = () => {
        switch (ticketStatus) {
            case 'open':
                return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Abierto</Badge>
            case 'in_analysis':
                return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">En Análisis</Badge>
            case 'intervention':
                return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Intervención</Badge>
            case 'resolved':
                return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Resuelto</Badge>
            case 'closed':
                return <Badge variant="secondary">Cerrado</Badge>
            default:
                return <Badge variant="outline">{ticketStatus}</Badge>
        }
    }

    // Format time
    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    }

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button
                    size="icon"
                    className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
                >
                    <MessageCircle className="h-6 w-6" />
                </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
                {/* Header */}
                <SheetHeader className="p-4 border-b bg-primary/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Headphones className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <SheetTitle className="text-left text-sm">
                                    {ticketSubject.length > 30
                                        ? ticketSubject.substring(0, 30) + '...'
                                        : ticketSubject}
                                </SheetTitle>
                                <div className="flex items-center gap-2 mt-1">
                                    {getStatusBadge()}
                                </div>
                            </div>
                        </div>
                    </div>
                </SheetHeader>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                    {isLoading ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                            <MessageCircle className="h-10 w-10 mb-2 opacity-50" />
                            <p className="text-sm">No hay mensajes aún</p>
                            <p className="text-xs">Escribe para iniciar la conversación</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages.map((message, index) => {
                                const isOwn = message.sender_id === currentUserId
                                const isSystem = message.sender_role === 'system'

                                // Show date separator if needed
                                const showDate = index === 0 ||
                                    new Date(message.created_at).toDateString() !==
                                    new Date(messages[index - 1].created_at).toDateString()

                                return (
                                    <div key={message.id}>
                                        {showDate && (
                                            <div className="flex items-center gap-2 my-3">
                                                <Separator className="flex-1" />
                                                <span className="text-xs text-muted-foreground px-2">
                                                    {new Date(message.created_at).toLocaleDateString('es-ES', {
                                                        day: 'numeric',
                                                        month: 'short'
                                                    })}
                                                </span>
                                                <Separator className="flex-1" />
                                            </div>
                                        )}

                                        {isSystem ? (
                                            <div className="flex justify-center">
                                                <div className="bg-muted/50 rounded-full px-3 py-1 text-xs text-muted-foreground flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {message.content}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={cn(
                                                "flex",
                                                isOwn ? "justify-end" : "justify-start"
                                            )}>
                                                <div className={cn(
                                                    "max-w-[85%] rounded-2xl px-4 py-2",
                                                    isOwn
                                                        ? "bg-primary text-primary-foreground rounded-br-md"
                                                        : "bg-muted rounded-bl-md"
                                                )}>
                                                    {!isOwn && (
                                                        <div className="flex items-center gap-1 mb-1">
                                                            <span className="text-xs font-medium">
                                                                {message.sender_role === 'technician' ? '🔧 Técnico' :
                                                                    message.sender_role === 'admin' ? '👤 Admin' : 'Soporte'}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                                    <div className={cn(
                                                        "flex items-center gap-1 mt-1",
                                                        isOwn ? "justify-end" : "justify-start"
                                                    )}>
                                                        <span className={cn(
                                                            "text-[10px]",
                                                            isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                                                        )}>
                                                            {formatTime(message.created_at)}
                                                        </span>
                                                        {isOwn && message.read_at && (
                                                            <CheckCircle2 className="h-3 w-3 text-primary-foreground/70" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </ScrollArea>

                {/* Input */}
                {ticketStatus !== 'closed' && (
                    <div className="p-4 border-t bg-background">
                        <form
                            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                            className="flex items-center gap-2"
                        >
                            <Input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Escribe tu mensaje..."
                                className="flex-1"
                                disabled={isSending}
                            />
                            <Button
                                type="submit"
                                size="icon"
                                disabled={!newMessage.trim() || isSending}
                            >
                                {isSending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </Button>
                        </form>
                    </div>
                )}

                {ticketStatus === 'closed' && (
                    <div className="p-4 border-t bg-muted/50 text-center">
                        <p className="text-sm text-muted-foreground">
                            Este ticket está cerrado. No puedes enviar más mensajes.
                        </p>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MINI CHAT FAB (Floating Action Button sin ticket específico)
// ═══════════════════════════════════════════════════════════════════════════════

interface SupportFabProps {
    unreadCount?: number
    onClick?: () => void
}

export function SupportFab({ unreadCount = 0, onClick }: SupportFabProps) {
    return (
        <Button
            size="icon"
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 group"
            onClick={onClick}
        >
            <MessageCircle className="h-6 w-6 transition-transform group-hover:scale-110" />
            {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
        </Button>
    )
}
