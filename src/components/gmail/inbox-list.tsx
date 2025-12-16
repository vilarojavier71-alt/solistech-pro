'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getGmailThreads } from '@/lib/actions/gmail'

export function InboxList() {
    const [threads, setThreads] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getGmailThreads().then(res => {
            if (res.threads) setThreads(res.threads)
            setLoading(false)
        })
    }, [])

    if (loading) return <div>Cargando buzón...</div>
    if (threads.length === 0) return <div>Buzón vacío</div>

    return (
        <ScrollArea className="h-[600px]">
            <div className="space-y-2">
                {threads.map((thread) => (
                    <Card key={thread.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardContent className="p-4 flex items-start gap-3">
                            <Avatar>
                                <AvatarFallback>G</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-semibold text-sm truncate">{thread.snippet}</h4>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {/* Date parsing is complex from snippet, ideally we get internalDate */}
                                        Recent
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                    {thread.snippet}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </ScrollArea>
    )
}
