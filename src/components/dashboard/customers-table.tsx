import { deleteClient } from '@/lib/actions/customers' // Import action

import { Customer } from '@/types'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Mail, Phone, MapPin } from 'lucide-react'
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

export function CustomersTable({ customers }: { customers: Customer[] }) {
    const router = useRouter()
    // const supabase = createClient()

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este cliente?')) return

        const result = await deleteClient(id)

        if (result.error) {
            toast.error(result.error)
            return
        }

        toast.success('Cliente eliminado')
        // router.refresh() // action usually revalidates, but client refresh ensures
    }

    if (customers.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                <h3 className="text-lg font-semibold">No hay clientes</h3>
                <p className="text-sm text-muted-foreground mt-2">
                    Comienza añadiendo tu primer cliente
                </p>
                <Button className="mt-4" onClick={() => router.push('/dashboard/customers/new')}>
                    Crear Cliente
                </Button>
            </div>
        )
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Contacto</TableHead>
                        <TableHead>Ubicación</TableHead>
                        <TableHead>CIF/NIF</TableHead>
                        <TableHead className="w-[70px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {customers.map((customer) => {
                        const address = customer.address as any
                        return (
                            <TableRow key={customer.id}>
                                <TableCell className="font-medium">{customer.name}</TableCell>
                                <TableCell>{customer.company || '-'}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        {customer.email && (
                                            <div className="flex items-center gap-1 text-sm">
                                                <Mail className="h-3 w-3" />
                                                {customer.email}
                                            </div>
                                        )}
                                        {customer.phone && (
                                            <div className="flex items-center gap-1 text-sm">
                                                <Phone className="h-3 w-3" />
                                                {customer.phone}
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {address?.city ? (
                                        <div className="flex items-center gap-1 text-sm">
                                            <MapPin className="h-3 w-3" />
                                            {address.city}
                                        </div>
                                    ) : (
                                        '-'
                                    )}
                                </TableCell>
                                <TableCell>{customer.tax_id || '-'}</TableCell>
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
                                                onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
                                            >
                                                Ver detalles
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => router.push(`/dashboard/customers/${customer.id}/edit`)}
                                            >
                                                Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() => router.push(`/dashboard/projects/new?customer=${customer.id}`)}
                                            >
                                                Crear proyecto
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() => handleDelete(customer.id)}
                                                className="text-red-600"
                                            >
                                                Eliminar
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}
