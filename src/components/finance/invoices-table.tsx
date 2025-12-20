"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

interface Invoice {
    id: string;
    invoice_number: string;
    status: string;
    payment_status: string;
    customer_name: string;
    issue_date: string;
    due_date?: string;
    total: number;
    paid_amount: number;
}

interface InvoicesTableProps {
    invoices: Invoice[];
}

export function InvoicesTable({ invoices }: InvoicesTableProps) {
    const getStatusBadge = (status: string) => {
        const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
            draft: { label: 'Borrador', variant: 'secondary' },
            issued: { label: 'Emitida', variant: 'default' },
            sent: { label: 'Enviada', variant: 'outline' },
            paid: { label: 'Pagada', variant: 'default' },
            cancelled: { label: 'Cancelada', variant: 'destructive' },
            overdue: { label: 'Vencida', variant: 'destructive' }
        }
        return variants[status] || variants.draft
    }

    const getPaymentStatusBadge = (status: string) => {
        const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
            pending: { label: 'Pendiente', variant: 'secondary' },
            partial: { label: 'Parcial', variant: 'secondary' },
            paid: { label: 'Pagada', variant: 'default' }
        }
        return variants[status] || variants.pending
    }

    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>NÃºmero</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Fecha Emisión</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Cobro</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {invoices.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                                <EmptyState
                                    title="No hay facturas"
                                    description="No se han encontrado facturas emitidas en el sistema."
                                    className="border-none py-12"
                                />
                            </TableCell>
                        </TableRow>
                    ) : (
                        invoices.map((invoice) => {
                            const statusBadge = getStatusBadge(invoice.status)
                            const paymentBadge = getPaymentStatusBadge(invoice.payment_status)

                            return (
                                <TableRow key={invoice.id} className="hover:bg-muted/50 transition-colors">
                                    <TableCell className="font-medium font-mono">{invoice.invoice_number}</TableCell>
                                    <TableCell>{invoice.customer_name}</TableCell>
                                    <TableCell>{formatDate(invoice.issue_date)}</TableCell>
                                    <TableCell>
                                        <Badge variant={statusBadge.variant}>
                                            {statusBadge.label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={paymentBadge.variant} className="bg-opacity-80">
                                            {paymentBadge.label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-medium">
                                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(invoice.total)}
                                    </TableCell>
                                    <TableCell>
                                        <Link href={`/dashboard/invoices/${invoice.id}`}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-emerald-500">
                                                <ArrowRight className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            )
                        })
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
