'use client'

import { useState, useTransition } from 'react'
import { DataTablePremium, DataTableColumn } from '@/components/premium'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    MoreHorizontal,
    Mail,
    Phone,
    MapPin,
    Building2,
    User,
    Pencil,
    Trash2,
    Eye
} from 'lucide-react'
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
import { deleteClient } from '@/lib/actions/customers'
import { ClientEditSheet } from '@/components/customers/client-edit-sheet'

interface ClientData {
    id: string
    name: string
    email: string | null
    phone: string | null
    company: string | null
    tax_id: string | null
    address: any
    status?: 'lead' | 'customer'
}

export function ClientsTable({ clients }: { clients: ClientData[] }) {
    const router = useRouter()
    const [editingClient, setEditingClient] = useState<ClientData | null>(null)
    const [isPending, startTransition] = useTransition()
    const [isDeleting, setIsDeleting] = useState<string | null>(null)

    const handleDelete = async (id: string) => {
        // Optimistic UI for delete is tricky with server components list, 
        // but we can show a loading state on the row or toast.
        setIsDeleting(id)

        toast.promise(
            new Promise(async (resolve, reject) => {
                const result = await deleteClient(id)
                if (result.error) reject(result.error)
                else resolve(result)
            }),
            {
                loading: 'Eliminando cliente...',
                success: () => {
                    startTransition(() => {
                        router.refresh()
                    })
                    return 'Cliente eliminado correctamente'
                },
                error: (err) => `Error al eliminar: ${err}`
            }
        )

        setIsDeleting(null)
    }

    // Adapt ClientData to Customer interface for the Sheet
    const customerForSheet = editingClient ? {
        ...editingClient,
        full_name: editingClient.name,
        // Ensure address fields are mapped correctly if they come differently
        address: typeof editingClient.address === 'string' ? editingClient.address : editingClient.address?.street,
        city: editingClient.address?.city,
        province: editingClient.address?.province,
        postal_code: editingClient.address?.postal_code,
        country: editingClient.address?.country
    } : undefined

    // Definir columnas para DataTablePremium
    const columns: DataTableColumn<ClientData>[] = [
        {
            id: 'name',
            label: 'Cliente',
            accessor: 'name',
            sortable: true,
            width: 300,
            render: (value, client) => (
                <div className="flex flex-col">
                    <span className="font-medium text-foreground flex items-center gap-2">
                        {client.company ? (
                            <Building2 className="h-3 w-3 text-blue-400" />
                        ) : (
                            <User className="h-3 w-3 text-emerald-400" />
                        )}
                        {value}
                    </span>
                    {client.company && (
                        <span className="text-xs text-muted-foreground ml-5">
                            {client.company}
                        </span>
                    )}
                </div>
            )
        },
        {
            id: 'email',
            label: 'Email',
            accessor: 'email',
            sortable: true,
            width: 250,
            render: (value) => value ? (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    {value}
                </div>
            ) : (
                <span className="text-muted-foreground/50">-</span>
            )
        },
        {
            id: 'phone',
            label: 'Teléfono',
            accessor: 'phone',
            width: 180,
            render: (value) => value ? (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {value}
                </div>
            ) : (
                <span className="text-muted-foreground/50">-</span>
            )
        },
        {
            id: 'status',
            label: 'Estado',
            accessor: 'status',
            sortable: true,
            width: 120,
            render: (value) => {
                if (!value) {
                    return (
                        <Badge variant="secondary">
                            Cliente
                        </Badge>
                    )
                }
                return (
                    <Badge variant={value === 'customer' ? 'default' : 'outline'}>
                        {value === 'customer' ? 'Cliente' : 'Lead'}
                    </Badge>
                )
            }
        },
        {
            id: 'location',
            label: 'Ubicación',
            accessor: (client) => {
                if (!client.address?.city && !client.address?.province) return null
                return [client.address.city, client.address.province].filter(Boolean).join(', ')
            },
            width: 200,
            render: (value) => {
                if (!value) return <span className="text-muted-foreground/50">-</span>
                return (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {value}
                    </div>
                )
            }
        },
        {
            id: 'actions',
            label: '',
            accessor: 'id',
            width: 70,
            render: (_, client) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                            onClick={(e) => e.stopPropagation()}
                            disabled={isDeleting === client.id}
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/dashboard/crm/clients/${client.id}`)
                            }}
                            className="cursor-pointer"
                        >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver CRM
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={(e) => {
                                e.stopPropagation()
                                setEditingClient(client)
                            }}
                            className="cursor-pointer"
                        >
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(client.id)
                            }}
                            className="text-destructive cursor-pointer"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    ]

    if (clients.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed rounded-lg">
                <User className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay clientes</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Comienza añadiendo tu primer cliente al CRM
                </p>
            </div>
        )
    }

    return (
        <>
            <DataTablePremium
                columns={columns}
                data={clients}
                features={{
                    virtualScroll: false, // Desactivar para usar paginación normal
                    stickyHeader: true,
                    compactView: true,
                    export: true,
                    search: true,
                    sort: true
                }}
                onRowClick={(client) => router.push(`/dashboard/crm/clients/${client.id}`)}
                maxHeight="calc(100vh - 300px)"
                rowHeight={80}
            />

            <ClientEditSheet
                open={!!editingClient}
                onOpenChange={(open) => !open && setEditingClient(null)}
                client={customerForSheet as any} // Cast as any because of interface mismatch complexity
                onSuccess={() => {
                    setEditingClient(null)
                    router.refresh()
                }}
            />
        </>
    )
}
