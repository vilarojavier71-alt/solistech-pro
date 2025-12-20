import { NewSaleForm } from '@/components/forms/new-sale-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewSalePage() {
    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/sales">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Nueva Venta</h1>
                    <p className="text-slate-500">Registra un nuevo expediente para comenzar el seguimiento.</p>
                </div>
            </div>

            <NewSaleForm />
        </div>
    )
}
