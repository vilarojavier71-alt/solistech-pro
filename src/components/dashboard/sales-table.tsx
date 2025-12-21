'use client'

import { useState } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Search, MoreHorizontal, FileText, DollarSign } from 'lucide-react'
import { useRouter } from 'next/navigation'

// Use flexible type to accept raw Prisma data
interface SalesTableProps {
    data: any[]
}

export function SalesTable({ data: initialData }: SalesTableProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const router = useRouter()

    const filteredData = initialData.filter((sale) =>
        sale.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.dni?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.sale_number?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
        }).format(amount)
    }

    const getPaymentBadge = (sale: any) => {
        // Lógica simplificada visualizar estado global
        if (sale.payment_final_status === 'received') return <Badge className="bg-green-600">Pagado 100%</Badge>
        if (sale.payment_60_status === 'received') return <Badge className="bg-lime-600">Pagado 60%</Badge>
        if (sale.payment_20_status === 'received') return <Badge className="bg-sky-600">Pagado 20%</Badge>
        if (sale.payment_status === 'confirmed') return <Badge className="bg-green-600">Confirmado</Badge>
        return <Badge variant="outline" className="text-slate-500">Pendiente</Badge>
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="relative w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por cliente, DNI o Nº..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <div className="flex gap-2">
                    {/* Filtros futuros aquí */}
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Expediente</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Importe</TableHead>
                            <TableHead>Estado Pago</TableHead>
                            <TableHead>Instalación</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24">
                                    No se encontraron ventas
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData.map((sale) => (
                                <TableRow key={sale.id}>
                                    <TableCell className="font-medium">
                                        {sale.sale_number}
                                        <div className="text-xs text-muted-foreground mt-0.5">
                                            {sale.material?.substring(0, 20)}...
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{sale.customer_name}</div>
                                        <div className="text-xs text-muted-foreground">{sale.dni}</div>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(sale.sale_date).toLocaleDateString('es-ES')}
                                    </TableCell>
                                    <TableCell>
                                        {formatCurrency(sale.amount)}
                                    </TableCell>
                                    <TableCell>
                                        {getPaymentBadge(sale)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            sale.installation_status === 'completed' ? 'default' :
                                                sale.installation_status === 'in_progress' ? 'secondary' : 'outline'
                                        }>
                                            {sale.installation_status === 'completed' ? 'Finalizada' :
                                                sale.installation_status === 'in_progress' ? 'En Curso' : 'Pendiente'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Abrir menú</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => router.push(`/dashboard/sales/${sale.id}`)}>
                                                    <FileText className="mr-2 h-4 w-4" />
                                                    Ver ficha completa
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <DollarSign className="mr-2 h-4 w-4" />
                                                    Gestionar Cobros
                                                </DropdownMenuItem>

                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-red-600">
                                                    Cancelar Venta
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
