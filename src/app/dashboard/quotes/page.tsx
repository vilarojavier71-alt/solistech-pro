
import { PageShell } from "@/components/ui/page-shell"
import { CreateQuoteDialog } from "@/components/quotes/create-quote-dialog"
import { getQuotes } from "@/lib/actions/quotes"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { FileText, Calendar, User, ArrowRight } from "lucide-react"

export default async function QuotesPage() {
    const quotes = await getQuotes()

    return (
        <PageShell
            title="Presupuestos"
            description="Gestiona y genera presupuestos para tus clientes."
            action={<CreateQuoteDialog />}
        >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {quotes.map((quote) => (
                    <Link key={quote.id} href={`/dashboard/quotes/${quote.id}`}>
                        <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-emerald-500">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-lg font-medium">{quote.title}</CardTitle>
                                    <Badge variant={quote.status === 'draft' ? 'outline' : 'default'}>
                                        {quote.status}
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground font-mono">{quote.quote_number}</p>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm text-zinc-500">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        <span>{quote.crm_account?.name || "Sin cliente asignado"}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        <span>{new Date(quote.issue_date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="pt-2 flex justify-between items-center text-emerald-600 font-semibold">
                                        <span className="text-lg">
                                            {quote.total?.toNumber().toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }) || '0,00 €'}
                                        </span>
                                        <ArrowRight className="h-4 w-4" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}

                {quotes.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                        <FileText className="mx-auto h-12 w-12 opacity-20 mb-4" />
                        <h3 className="text-lg font-medium">No hay presupuestos</h3>
                        <p>Crea el primero para empezar a vender.</p>
                    </div>
                )}
            </div>
        </PageShell>
    )
}
