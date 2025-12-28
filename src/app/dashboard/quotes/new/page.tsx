
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { QuoteBuilder } from '@/components/quotes/quote-builder'
import { getQuoteTargets } from '@/lib/actions/quotes'
import Link from 'next/link'

export default async function NewQuotePage() {
    // 1. Fetch dynamic data from Server Action
    const { leads, customers } = await getQuoteTargets()

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/quotes">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Nuevo Presupuesto</h1>
                    <p className="text-muted-foreground">
                        Crea un presupuesto personalizado para Leads o Clientes
                    </p>
                </div>
            </div>

            {/* 2. Pass data to Client Component */}
            <QuoteBuilder
                initialLeads={leads}
                initialCustomers={customers}
            />
        </div>
    )
}

