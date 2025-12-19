
'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface EmailDetailSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    email: any | null
}

export function EmailDetailSheet({ open, onOpenChange, email }: EmailDetailSheetProps) {
    if (!email) return null

    // Helper to find headers safely
    const getHeader = (name: string) => {
        return email.payload?.headers?.find((h: any) => h.name === name)?.value || ''
    }

    const subject = getHeader('Subject') || '(Sin asunto)'
    const from = getHeader('From')
    const dateStr = getHeader('Date')

    let dateDisplay = ''
    try {
        if (dateStr) {
            dateDisplay = format(new Date(dateStr), "PPP 'a las' p", { locale: es })
        }
    } catch {
        dateDisplay = dateStr
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-xl p-0 overflow-hidden flex flex-col">
                <SheetHeader className="px-6 py-4 bg-muted/20 border-b">
                    <SheetTitle className="text-xl font-bold leading-tight">{subject}</SheetTitle>
                    <SheetDescription className="flex items-center gap-2 mt-2">
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-medium">Inbox</span>
                        <span>{dateDisplay}</span>
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="flex-1">
                    <div className="p-6 space-y-6">
                        {/* Header: Sender Info */}
                        <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10 border">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                    {from?.charAt(0).toUpperCase() || '?'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground">{from}</p>
                                <p className="text-xs text-muted-foreground mr-1">Para: mí</p>
                            </div>
                        </div>

                        <Separator />

                        {/* Body Content */}
                        <div
                            className="email-content prose prose-sm dark:prose-invert max-w-none break-words"
                            dangerouslySetInnerHTML={{ __html: email.bodyDecoded || '<p>No se pudo cargar el contenido.</p>' }}
                        />
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    )
}
