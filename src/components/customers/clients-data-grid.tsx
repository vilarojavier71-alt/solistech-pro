'use client'

import { useState } from 'react'
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    SortingState,
    ColumnFiltersState,
    useReactTable,
} from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { ClientEditSheet } from './client-edit-sheet'
import { deleteClient, addNewClient } from '@/lib/actions/customers'
import { toast } from 'sonner'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Customer {
    id: string
    full_name: string
    email?: string
    phone?: string
    city?: string
    created_at: string
    custom_attributes?: Record<string, any>
}

interface ClientsDataGridProps {
    initialData: Customer[]
}

export function ClientsDataGrid({ initialData }: ClientsDataGridProps) {
    const [data, setData] = useState<Customer[]>(initialData)
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [globalFilter, setGlobalFilter] = useState('')
    const [editingClient, setEditingClient] = useState<Customer | null>(null)
    const [deletingClient, setDeletingClient] = useState<Customer | null>(null)
    const [isCreating, setIsCreating] = useState(false)

    const handleDelete = async (client: Customer) => {
        const { error } = await deleteClient(client.id)

        if (error) {
            toast.error('Error al eliminar cliente', { description: error })
        } else {
            toast.success('Cliente eliminado correctamente')
            setData(prev => prev.filter(c => c.id !== client.id))
            setDeletingClient(null)
        }
    }

    const columns: ColumnDef<Customer>[] = [
        {
            accessorKey: 'full_name',
            header: 'Nombre',
            cell: ({ row }) => (
                <div className="font-medium text-slate-200">
                    {row.getValue('full_name')}
                </div>
            ),
        },
        {
            accessorKey: 'email',
            header: 'Email',
            cell: ({ row }) => (
                <div className="text-slate-400 text-sm">
                    {row.getValue('email') || '-'}
                </div>
            ),
        },
        {
            accessorKey: 'phone',
            header: 'TelÃ©fono',
            cell: ({ row }) => (
                <div className="text-slate-400 text-sm font-mono">
                    {row.getValue('phone') || '-'}
                </div>
            ),
        },
        {
            accessorKey: 'city',
            header: 'Ciudad',
            cell: ({ row }) => (
                <div className="text-slate-400 text-sm">
                    {row.getValue('city') || '-'}
                </div>
            ),
        },
        {
            accessorKey: 'created_at',
            header: 'Fecha Alta',
            cell: ({ row }) => {
                const date = new Date(row.getValue('created_at'))
                return (
                    <div className="text-slate-500 text-xs font-mono">
                        {date.toLocaleDateString('es-ES')}
                    </div>
                )
            },
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const client = row.original

                return (
                    <div className="row-actions">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Abrir menÃº</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700">
                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-slate-700" />
                                <DropdownMenuItem
                                    onClick={() => setEditingClient(client)}
                                    className="cursor-pointer"
                                >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setDeletingClient(client)}
                                    className="cursor-pointer text-red-400 focus:text-red-400"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )
            },
        },
    ]

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        state: {
            sorting,
            columnFilters,
            globalFilter,
        },
        initialState: {
            pagination: {
                pageSize: 25,
            },
        },
    })

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <Input
                    placeholder="Buscar clientes..."
                    value={globalFilter ?? ''}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="max-w-sm bg-slate-900 border-slate-700"
                />
                <Button
                    onClick={() => setIsCreating(true)}
                    className="bg-cyan-600 hover:bg-cyan-700"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Cliente
                </Button>
            </div>

            {/* Table */}
            <div className="rounded-lg border border-slate-800 bg-slate-950/50 overflow-hidden">
                <Table>
                    <TableHeader className="data-grid-header">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="border-slate-800 hover:bg-transparent">
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        className="text-slate-400 font-mono text-xs uppercase tracking-wider"
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && 'selected'}
                                    className="data-grid-row border-slate-800 hover:bg-slate-900/30 transition-colors"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center text-slate-500">
                                    No se encontraron clientes.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-slate-500 font-mono">
                    Mostrando {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} a{' '}
                    {Math.min(
                        (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                        table.getFilteredRowModel().rows.length
                    )}{' '}
                    de {table.getFilteredRowModel().rows.length} clientes
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="border-slate-700"
                    >
                        Anterior
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="border-slate-700"
                    >
                        Siguiente
                    </Button>
                </div>
            </div>

            {/* Edit Sheet */}
            {editingClient && (
                <ClientEditSheet
                    client={editingClient}
                    open={!!editingClient}
                    onOpenChange={(open) => !open && setEditingClient(null)}
                    onSuccess={(updated) => {
                        setData(prev => prev.map(c => c.id === updated.id ? updated : c))
                        setEditingClient(null)
                    }}
                />
            )}

            {/* Create Sheet */}
            {isCreating && (
                <ClientEditSheet
                    open={isCreating}
                    onOpenChange={(open) => !open && setIsCreating(false)}
                    onSuccess={(created) => {
                        setData(prev => [created, ...prev])
                        setIsCreating(false)
                    }}
                />
            )}

            {/* Delete Confirmation */}
            <AlertDialog open={!!deletingClient} onOpenChange={(open) => !open && setDeletingClient(null)}>
                <AlertDialogContent className="bg-slate-900 border-slate-700">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Â¿Eliminar cliente?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-400">
                            Esta acción marcará al cliente <span className="font-semibold text-slate-200">{deletingClient?.full_name}</span> como inactivo.
                            Los datos no se eliminarán permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-slate-700">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deletingClient && handleDelete(deletingClient)}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
