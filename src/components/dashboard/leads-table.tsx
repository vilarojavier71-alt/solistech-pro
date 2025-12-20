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
import { MoreHorizontal, Mail, Phone } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { deleteLead } from '@/lib/actions/leads'
import { useTransition } from 'react'

const statusColors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    contacted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    qualified: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    proposal: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    won: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    lost: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
}

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
    const [isPending, startTransition] = useTransition()

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

    const handleConvertToCustomer = (lead: any) => {
        router.push(`/dashboard/customers/new?from_lead=${lead.id}`)
    }

    if (!leads || leads.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                <h3 className="text-lg font-semibold">No hay leads</h3>
                <p className="text-sm text-muted-foreground mt-2">
                    Comienza creando tu primer lead
                </p>
                <Button className="mt-4" onClick={() => router.push('/dashboard/leads/new')}>
                    Crear Lead
                </Button>
            </div>
        )
    }

    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Contacto</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Valor Estimado</TableHead>
                        <TableHead>Origen</TableHead>
                        <TableHead className="w-[70px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {leads.map((lead) => (
                        <TableRow key={lead.id}>
                            <TableCell className="font-medium">{lead.name}</TableCell>
                            <TableCell>{lead.company || '-'}</TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-1">
                                    {lead.email && (
                                        <div className="flex items-center gap-1 text-sm">
                                            <Mail className="h-3 w-3" />
                                            {lead.email}
                                        </div>
                                    )}
                                    {lead.phone && (
                                        <div className="flex items-center gap-1 text-sm">
                                            <Phone className="h-3 w-3" />
                                            {lead.phone}
                                        </div>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge className={statusColors[lead.status] || 'bg-gray-100'}>
                                    {statusLabels[lead.status] || lead.status}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {lead.estimated_value
                                    ? `${Number(lead.estimated_value).toLocaleString()}€`
                                    : '-'}
                            </TableCell>
                            <TableCell className="capitalize">{lead.source || '-'}</TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <MoreHorizontal className="h-4 w-4" />
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
                                            className="text-red-600 focus:text-red-600"
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
