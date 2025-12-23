'use client'

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Mail, Phone, ArrowUpDown } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { updateLeadStatus, deleteLead } from '@/lib/actions/leads'
import { useTransition } from 'react'
import { getStatusColor } from '@/styles/theme'

// ✅ WCAG 2.1 AA/AAA Compliant - Using centralized theme
const getLeadStatusColor = (status: string) => getStatusColor('lead', status)

const statusLabels: Record<string, string> = {
    new: 'Nuevo',
    contacted: 'Contactado',
    qualified: 'Cualificado',
    proposal: 'Propuesta',
    won: 'Ganado',
    lost: 'Perdido',
}

export function LeadsTable({ leads }: { leads: any[] }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    const currentSort = searchParams.get('sort') || ''

    const handleSort = (field: string) => {
        const params = new URLSearchParams(searchParams)
        // Toggle direction
        const [currentField, currentDir] = currentSort.split('-')

        let newSort = `${field}-desc`
        if (currentField === field && currentDir === 'desc') {
            newSort = `${field}-asc`
        }

        params.set('sort', newSort)
        startTransition(() => {
            router.replace(`?${params.toString()}`)
        })
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este lead?')) return

        startTransition(async () => {
            const result = await deleteLead(id)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Lead eliminado')
            }
        })
    }

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        startTransition(async () => {
            const result = await updateLeadStatus(id, newStatus)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Estado actualizado')
                router.refresh()
            }
        })
    }

    const handleConvertToCustomer = (lead: any) => {
        router.push(`/dashboard/customers/new?from_lead=${lead.id}`)
    }

    if (!leads || leads.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center bg-muted/20">
                <h3 className="text-lg font-semibold">No se encontraron leads</h3>
                <p className="text-sm text-muted-foreground mt-2">
                    Intenta ajustar los filtros o crea un nuevo lead
                </p>
                <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard/leads/new')}>
                    Crear Lead
                </Button>
            </div>
        )
    }

    return (
        <div className="rounded-md border bg-card shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead 
                            className="cursor-pointer hover:text-primary transition-colors" 
                            onClick={() => handleSort('name')}
                            role="columnheader"
                            aria-sort={sortField === 'name' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                        >
                            <div className="flex items-center gap-1">
                                Nombre <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                            </div>
                        </TableHead>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Contacto</TableHead>
                        <TableHead 
                            className="cursor-pointer hover:text-primary transition-colors" 
                            onClick={() => handleSort('status')}
                            role="columnheader"
                            aria-sort={sortField === 'status' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                        >
                            <div className="flex items-center gap-1">
                                Estado <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                            </div>
                        </TableHead>
                        <TableHead 
                            className="cursor-pointer hover:text-primary transition-colors" 
                            onClick={() => handleSort('estimated_value')}
                            role="columnheader"
                            aria-sort={sortField === 'estimated_value' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                        >
                            <div className="flex items-center gap-1">
                                Valor <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                            </div>
                        </TableHead>
                        <TableHead>Origen</TableHead>
                        <TableHead className="w-[70px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {leads.map((lead) => (
                        <TableRow key={lead.id}>
                            <TableCell className="font-medium">
                                <div className="flex flex-col">
                                    <span>{lead.name}</span>
                                    {/* <span className="text-xs text-muted-foreground">{lead.assigned_user?.full_name}</span> */}
                                </div>
                            </TableCell>
                            <TableCell>{lead.company || '-'}</TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-1.5">
                                    {lead.email && (
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                                            <Mail className="h-3 w-3" aria-hidden="true" />
                                            <span>{lead.email}</span>
                                        </div>
                                    )}
                                    {lead.phone && (
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                                            <Phone className="h-3 w-3" aria-hidden="true" />
                                            <span>{lead.phone}</span>
                                        </div>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Badge
                                            className={`${getLeadStatusColor(lead.status)} cursor-pointer hover:opacity-80 transition-opacity border`}
                                            variant="outline"
                                        >
                                            {statusLabels[lead.status] || lead.status}
                                        </Badge>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        <DropdownMenuLabel>Cambiar Estado</DropdownMenuLabel>
                                        {Object.entries(statusLabels).map(([key, label]) => (
                                            <DropdownMenuItem
                                                key={key}
                                                onClick={() => handleStatusUpdate(lead.id, key)}
                                                disabled={lead.status === key}
                                            >
                                                <Badge className={`${getLeadStatusColor(key)} mr-2 w-2 h-2 rounded-full p-0 border-0`} />
                                                {label}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                            <TableCell>
                                {lead.estimated_value
                                    ? <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                        {Number(lead.estimated_value).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                    </span>
                                    : <span className="text-muted-foreground text-xs">-</span>}
                            </TableCell>
                            <TableCell>
                                <Badge variant="secondary" className="capitalize text-xs font-normal">
                                    {lead.source || 'web'}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button 
                                            variant="ghost" 
                                            className="h-8 w-8 p-0 hover:bg-muted"
                                            aria-label={`Acciones para lead ${lead.name}`}
                                        >
                                            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                        <DropdownMenuItem
                                            onClick={() => router.push(`/dashboard/leads/${lead.id}`)}
                                        >
                                            Ver detalles
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => router.push(`/dashboard/leads/${lead.id}/edit`)}
                                        >
                                            Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleConvertToCustomer(lead)}>
                                            Convertir a cliente
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => handleDelete(lead.id)}
                                            className="text-red-600 focus:text-red-600 bg-red-50 dark:bg-red-950/20"
                                            disabled={isPending}
                                        >
                                            Eliminar
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
