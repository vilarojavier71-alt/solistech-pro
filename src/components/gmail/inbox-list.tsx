'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { getGmailThreads, getThreadDetails } from '@/lib/actions/gmail'
import { EmailDetailSheet } from './email-detail-sheet'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Loader2, Mail } from 'lucide-react'
import { toast } from 'sonner'

export function InboxList() {
    const [threads, setThreads] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedEmail, setSelectedEmail] = useState<any | null>(null)
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [loadingThreadId, setLoadingThreadId] = useState<string | null>(null)

    useEffect(() => {
        getGmailThreads().then(res => {
            if (res.threads) setThreads(res.threads)
            setLoading(false)
        })
    }, [])

    const handleSelectThread = async (threadId: string) => {
        setLoadingThreadId(threadId)
        try {
            const detail = await getThreadDetails(threadId)

            if ('error' in detail) {
                toast.error('Error al cargar el correo')
                return
            }
            // Use the last message (most recent) for display
            // detail is now inferred as success type
            const messages = (detail as any).messages || []
            const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null

            if (lastMsg) {
                setSelectedEmail(lastMsg)
                setIsSheetOpen(true)
            }
        } catch (error) {
            console.error(error)
            toast.error('No se pudo abrir el correo')
        } finally {
            setLoadingThreadId(null)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p>Cargando buzón...</p>
            </div>
        )
    }

    if (threads.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground gap-2 border rounded-lg bg-muted/10">
                <Mail className="h-8 w-8" />
                <p>Buzón vacío</p>
            </div>
        )
    }

    return (
        <>
            <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-2">
                    {threads.map((thread) => {
                        // Extract basic info from snippet if possible, or just style nicely
                        const isUnread = thread.snippet?.startsWith('Unread') // Naive check, better to check labelIds if available in list
                        return (
                            <Card
                                key={thread.id}
                                className={`cursor-pointer transition-all hover:bg-muted/50 border-l-4 ${loadingThreadId === thread.id ? 'opacity-70' : ''} ${isUnread ? 'border-l-primary' : 'border-l-transparent'}`}
                                onClick={() => handleSelectThread(thread.id)}
                            >
                                <CardContent className="p-4 flex items-start gap-4">
                                    <Avatar className="h-9 w-9 mt-1 border">
                                        <AvatarFallback className="text-xs bg-primary/5 text-primary">
                                            G
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0 grid gap-1">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-semibold text-sm truncate pr-2 text-foreground">
                                                {/* In generic list we don't have Sender Name easily without batch get. Styling snippet as prompt. */}
                                                Mensaje de Gmail
                                            </h4>
                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap bg-muted px-1.5 py-0.5 rounded">
                                                Hace poco
                                            </span>
                                        </div>
                                        <p className="text-xs font-medium text-foreground truncate">
                                            {thread.snippet?.substring(0, 50)}...
                                        </p>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {thread.snippet}
                                        </p>
                                    </div>
                                    {loadingThreadId === thread.id && (
                                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </ScrollArea>

            <EmailDetailSheet
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                email={selectedEmail}
            />
        </>
    )
}
