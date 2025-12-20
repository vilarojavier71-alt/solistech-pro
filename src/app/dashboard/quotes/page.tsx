'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, FileText, Search, Download } from 'lucide-react'
import Link from 'next/link'

export default function QuotesPage() {
    const router = useRouter()
    // STUB: quotes table doesn't exist in Prisma schema
    const [quotes, setQuotes] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Presupuestos</h1>
                    <p className="text-muted-foreground">
                        Gestiona tus propuestas comerciales
                    </p>
                </div>
                <Link href="/dashboard/quotes/new">
                    <Button className="bg-sky-600 hover:bg-sky-700">
                        <Plus className="mr-2 h-4 w-4" /> Nuevo Presupuesto
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Historial de Presupuestos</CardTitle>
                </CardHeader>
                <CardContent>
                    {!loading && quotes.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg">
                            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-900">No hay presupuestos</h3>
                            <p className="text-slate-500 mb-6">Crea tu primera propuesta comercial ahora.</p>
                            <Link href="/dashboard/quotes/new">
                                <Button variant="outline">Crear Presupuesto</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="relative overflow-x-auto">
                            <table className="w-full text-sm text-left rtl:text-right text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Número</th>
                                        <th scope="col" className="px-6 py-3">Cliente / Lead</th>
                                        <th scope="col" className="px-6 py-3">Fecha</th>
                                        <th scope="col" className="px-6 py-3">Importe</th>
                                        <th scope="col" className="px-6 py-3">Estado</th>
                                        <th scope="col" className="px-6 py-3">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {quotes.map((quote) => (
                                        <tr key={quote.id} className="bg-white border-b hover:bg-slate-50">
                                            <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                                {quote.quote_number}
                                            </th>
                                            <td className="px-6 py-4">
                                                {quote.customers?.full_name || quote.leads?.name || 'Desconocido'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {new Date(quote.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-900">
                                                {quote.total?.toLocaleString()} €
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                                    ${quote.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                                        quote.status === 'sent' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                                    {quote.status === 'draft' ? 'Borrador' :
                                                        quote.status === 'sent' ? 'Enviado' :
                                                            quote.status === 'accepted' ? 'Aceptado' : quote.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Button variant="ghost" size="sm">Ver</Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
