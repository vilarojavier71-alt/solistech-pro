"use client";

import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, ArrowUpDown, Search, Filter, ArrowUp, ArrowDown } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

type SortConfig = {
    key: keyof Invoice | '';
    direction: 'asc' | 'desc';
};

export function InvoicesTable({ invoices }: InvoicesTableProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'issue_date', direction: 'desc' });

    const handleSort = (key: keyof Invoice) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
            draft: { label: 'Borrador', variant: 'secondary' },
            issued: { label: 'Emitida', variant: 'default' },
            sent: { label: 'Enviada', variant: 'outline' },
            paid: { label: 'Pagada', variant: 'default' },
            cancelled: { label: 'Cancelada', variant: 'destructive' },
            overdue: { label: 'Vencida', variant: 'destructive' }
        };
        return variants[status] || variants.draft;
    };

    const getPaymentStatusBadge = (status: string) => {
        const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
            pending: { label: 'Pendiente', variant: 'secondary' },
            partial: { label: 'Parcial', variant: 'secondary' },
            paid: { label: 'Pagada', variant: 'default' }
        };
        return variants[status] || variants.pending;
    };

    const filteredAndSortedInvoices = useMemo(() => {
        let filtered = [...invoices];

        // 1. Search
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(inv =>
                inv.invoice_number.toLowerCase().includes(lowerTerm) ||
                inv.customer_name.toLowerCase().includes(lowerTerm)
            );
        }

        // 2. Filter Status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(inv => inv.status === statusFilter || inv.payment_status === statusFilter);
        }

        // 3. Sort
        if (sortConfig.key) {
            filtered.sort((a, b) => {
                const aValue = a[sortConfig.key as keyof Invoice];
                const bValue = b[sortConfig.key as keyof Invoice];

                if (aValue === bValue) return 0;

                const comparison = aValue! > bValue! ? 1 : -1;
                return sortConfig.direction === 'asc' ? comparison : -comparison;
            });
        }

        return filtered;
    }, [invoices, searchTerm, statusFilter, sortConfig]);

    const SortIcon = ({ columnKey }: { columnKey: keyof Invoice }) => {
        if (sortConfig.key !== columnKey) return <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground/50" />;
        return sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 ml-1 text-primary" /> : <ArrowDown className="h-3 w-3 ml-1 text-primary" />;
    };

    return (
        <div className="space-y-4">
            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por cliente o número..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex w-full sm:w-auto items-center gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="paid">Pagadas</SelectItem>
                            <SelectItem value="pending">Pendientes</SelectItem>
                            <SelectItem value="overdue">Vencidas</SelectItem>
                            <SelectItem value="draft">Borradores</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border bg-card overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow>
                            <TableHead className="w-[150px] cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('invoice_number')}>
                                <div className="flex items-center text-xs font-semibold uppercase tracking-wider">
                                    Número <SortIcon columnKey="invoice_number" />
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('customer_name')}>
                                <div className="flex items-center text-xs font-semibold uppercase tracking-wider">
                                    Cliente <SortIcon columnKey="customer_name" />
                                </div>
                            </TableHead>
                            <TableHead className="w-[150px] cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('issue_date')}>
                                <div className="flex items-center text-xs font-semibold uppercase tracking-wider">
                                    Fecha <SortIcon columnKey="issue_date" />
                                </div>
                            </TableHead>
                            <TableHead className="w-[120px]">
                                <div className="text-xs font-semibold uppercase tracking-wider">Estado</div>
                            </TableHead>
                            <TableHead className="w-[120px]">
                                <div className="text-xs font-semibold uppercase tracking-wider">Cobro</div>
                            </TableHead>
                            <TableHead className="text-right w-[120px] cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('total')}>
                                <div className="flex items-center justify-end text-xs font-semibold uppercase tracking-wider">
                                    Total <SortIcon columnKey="total" />
                                </div>
                            </TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAndSortedInvoices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    <EmptyState
                                        title={searchTerm || statusFilter !== 'all' ? "Sin resultados" : "No hay facturas"}
                                        description="No se encontraron facturas que coincidan con los filtros."
                                        className="border-none py-12"
                                        icon={Search}
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAndSortedInvoices.map((invoice) => {
                                const statusBadge = getStatusBadge(invoice.status);
                                const paymentBadge = getPaymentStatusBadge(invoice.payment_status);

                                return (
                                    <TableRow key={invoice.id} className="hover:bg-muted/50 transition-colors group">
                                        <TableCell className="font-mono font-medium text-sm">
                                            {invoice.invoice_number}
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-medium text-sm">{invoice.customer_name}</span>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {formatDate(invoice.issue_date)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={statusBadge.variant} className="text-[10px] px-2 py-0.5">
                                                {statusBadge.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={paymentBadge.variant} className="text-[10px] px-2 py-0.5 bg-opacity-80">
                                                {paymentBadge.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-bold text-sm">
                                            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(invoice.total)}
                                        </TableCell>
                                        <TableCell>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Link href={`/dashboard/invoices/${invoice.id}`}>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:text-emerald-500 hover:bg-emerald-500/10">
                                                                <ArrowRight className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Ver Detalle</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="text-xs text-muted-foreground text-right">
                Mostrando {filteredAndSortedInvoices.length} facturas
            </div>
        </div>
    );
}
