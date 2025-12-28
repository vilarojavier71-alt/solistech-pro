'use client'

import React, { useState, useRef, useEffect } from 'react'
import { readStreamableValue } from 'ai/rsc'
import { streamGeminiResponse } from '@/lib/ai/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bot, User, Send, X, MessageSquare, Terminal, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AssistantRole } from '@/lib/ai/prompts'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'

/**
 * COMMAND CENTER AI
 * The universal interface for interacting with the SolisTech Pro Bots.
 */
export function CommandCenter() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [selectedRole, setSelectedRole] = useState<AssistantRole>('sales')
    const scrollRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, isOpen])

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!input.trim() || isLoading) return

        const userMsg = input.trim()
        setInput('')
        setMessages(prev => [...prev, { role: 'user', content: userMsg }])
        setIsLoading(true)

        try {
            // 1. Call Server Action to start stream
            const stream = await streamGeminiResponse(userMsg, 'gpt-4o', undefined, selectedRole)

            // 2. Add empty assistant message to fill
            setMessages(prev => [...prev, { role: 'assistant', content: '' }])

            // 3. Read stream
            let fullContent = ''
            for await (const delta of readStreamableValue(stream)) {
                fullContent += delta
                setMessages(prev => {
                    const newMsgs = [...prev]
                    newMsgs[newMsgs.length - 1].content = fullContent
                    return newMsgs
                })
            }
        } catch (error) {
            console.error(error)
            toast.error("Error connecting to Neural Core")
        } finally {
            setIsLoading(false)
        }
    }

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl z-50 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 transition-all duration-300 animate-in zoom-in slide-in-from-bottom-4"
            >
                <Bot className="h-6 w-6 text-white" />
            </Button>
        )
    }

    return (
        <Card className="fixed bottom-6 right-6 w-[450px] h-[600px] shadow-2xl z-50 flex flex-col border-slate-200 dark:border-slate-800 animate-in zoom-in slide-in-from-bottom-4 backdrop-blur-md bg-white/95 dark:bg-slate-950/95">
            {/* HEADER */}
            <CardHeader className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-t-xl flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                    <div className={cn("p-2 rounded-lg", getRoleColor(selectedRole))}>
                        <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            GOD MODE AI
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">ONLINE</span>
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">Neural Orchestration System</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>

            {/* ROLE SELECTOR */}
            <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AssistantRole)}>
                    <SelectTrigger className="h-8 text-xs bg-transparent border-0 ring-0 focus:ring-0 px-0 hover:bg-transparent shadow-none w-full">
                        <SelectValue placeholder="Select Neural Agent" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="sales">🤖 Sales Agent (Commercial)</SelectItem>
                        <SelectItem value="technical">🔧 Tech Engineer (PvGis)</SelectItem>
                        <SelectItem value="admin">💼 Finance Bot (Admin)</SelectItem>
                        <SelectItem value="support">🛡️ Support Bot (Help)</SelectItem>
                        <SelectItem value="god_mode">👑 GOD MODE (Super Admin)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* CHAT AREA */}
            <CardContent className="flex-1 p-0 overflow-hidden relative">
                <ScrollArea className="h-full p-4" ref={scrollRef}>
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50 mt-10">
                            <Terminal className="h-12 w-12 text-muted-foreground" />
                            <div className="space-y-1">
                                <p className="text-sm font-medium">System Ready</p>
                                <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">
                                    Select an agent and start describing your mission.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4 pb-4">
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "flex w-max max-w-[85%] flex-col gap-2 rounded-2xl px-4 py-3 text-sm shadow-sm",
                                    msg.role === 'user'
                                        ? "ml-auto bg-primary text-primary-foreground rounded-tr-none"
                                        : "bg-slate-100 dark:bg-slate-800 text-foreground rounded-tl-none"
                                )}
                            >
                                <div className="prose dark:prose-invert prose-sm max-w-none break-words">
                                    <ReactMarkdown
                                        components={{
                                            p: ({ children }) => <p className="m-0 leading-relaxed">{children}</p>,
                                            ul: ({ children }) => <ul className="m-0 pl-4 list-disc">{children}</ul>,
                                            li: ({ children }) => <li className="m-0">{children}</li>
                                        }}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-none px-4 py-3 w-16 flex items-center justify-center">
                                <div className="flex gap-1">
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>

            {/* INPUT AREA */}
            <CardFooter className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-b-xl">
                <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
                    <Input
                        placeholder={`Message ${selectedRole}...`}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="flex-1 bg-slate-50 dark:bg-slate-900 border-0 focus-visible:ring-1 focus-visible:ring-primary/20"
                        autoFocus
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={isLoading || !input.trim()}
                        className="h-10 w-10 shrink-0 rounded-full"
                    >
                        <Send className="h-4 w-4" />
                        <span className="sr-only">Send</span>
                    </Button>
                </form>
            </CardFooter>
        </Card>
    )
}

function getRoleColor(role: AssistantRole) {
    switch (role) {
        case 'sales': return 'bg-blue-500'
        case 'technical': return 'bg-orange-500'
        case 'admin': return 'bg-emerald-500'
        case 'support': return 'bg-pink-500'
        case 'god_mode': return 'bg-gradient-to-r from-yellow-400 to-amber-600'
        default: return 'bg-slate-500'
    }
}
