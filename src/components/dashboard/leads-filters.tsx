'use client'

import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Search } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTransition, useEffect, useState } from "react"
// Removed use-debounce import

export function LeadsFilters() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    const initialQuery = searchParams.get('query') || ''
    const initialStatus = searchParams.get('status') || 'all'

    const [text, setText] = useState(initialQuery)
    const [query, setQuery] = useState(initialQuery)

    // Manual debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setQuery(text)
        }, 500)

        return () => {
            clearTimeout(timer)
        }
    }, [text])

    // Sync URL on query change
    useEffect(() => {
        // Skip first render if query matches initial (handled by server mostly, but good for back/fwd)

        const params = new URLSearchParams(searchParams)
        if (query) {
            params.set('query', query)
        } else {
            params.delete('query')
        }

        // Reset page if needed (if we had pagination)

        startTransition(() => {
            router.replace(`?${params.toString()}`)
        })
    }, [query, router]) // searchParams excluded to avoid loop, we read it once for init

    const handleStatusChange = (value: string) => {
        const params = new URLSearchParams(searchParams)
        if (value && value !== 'all') {
            params.set('status', value)
        } else {
            params.delete('status')
        }

        startTransition(() => {
            router.replace(`?${params.toString()}`)
        })
    }

    return (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar leads por nombre, empresa o email..."
                    className="pl-8"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
            </div>

            <Select
                defaultValue={initialStatus}
                onValueChange={handleStatusChange}
            >
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="new">Nuevo</SelectItem>
                    <SelectItem value="contacted">Contactado</SelectItem>
                    <SelectItem value="qualified">Cualificado</SelectItem>
                    <SelectItem value="proposal">Propuesta</SelectItem>
                    <SelectItem value="won">Ganado</SelectItem>
                    <SelectItem value="lost">Perdido</SelectItem>
                </SelectContent>
            </Select>
        </div>
    )
}
