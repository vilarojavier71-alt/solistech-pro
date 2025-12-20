'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { QuoteBuilder } from '@/components/quotes/quote-builder'

export default function NewQuotePage() {
    const router = useRouter()

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Nuevo Presupuesto</h1>
                    <p className="text-muted-foreground">
                        Crea un presupuesto personalizado para Leads o Clientes
                    </p>
                </div>
            </div>

            <QuoteBuilder />
        </div>
    )
}
