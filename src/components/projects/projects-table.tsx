'use client'

import { useState } from 'react'
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    createColumnHelper,
} from '@tanstack/react-table'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getProjectsList, deleteProject, type ProjectListItem } from '@/lib/actions/projects'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    ChevronLeft,
    ChevronRight,
    Search,
    Plus,
    Pencil,
    Trash2,
    Loader2
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

const columnHelper = createColumnHelper<ProjectListItem>()

const statusColors: Record<string, string> = {
    quote: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    installation: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-purple-100 text-purple-800',
}

const statusLabels: Record<string, string> = {
    quote: 'Presupuesto',
    approved: 'Aprobado',
    installation: 'Instalación',
    completed: 'Completado',
}

const typeLabels: Record<string, string> = {
    residential: 'Residencial',
    commercial: 'Comercial',
    industrial: 'Industrial',
}

export function ProjectsTable() {
    const [page, setPage] = useState(1)
    const [pageSize] = useState(10)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const queryClient = useQueryClient()

    const { data, isLoading, isFetching } = useQuery({
        queryKey: ['projects', page, pageSize, search, statusFilter],
        queryFn: () => getProjectsList({
            page,
            pageSize,
            search,
            status: statusFilter,
        }),
        placeholderData: (previousData) => previousData,
    })

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este proyecto?')) return

        const result = await deleteProject(id)
        if (result.success) {
            toast.success('Proyecto eliminado')
            queryClient.invalidateQueries({ queryKey: ['projects'] })
        } else {
            toast.error(result.error || 'Error al eliminar')
        }
    }

    const columns = [
        columnHelper.accessor('name', {
            header: 'Proyecto',
            cell: (info) => (
                <Link
                    href={`/dashboard/projects/${info.row.original.id}`}
                    className="font-medium hover:text-primary hover:underline"
                >
                    {info.getValue()}
                </Link>
            ),
        }),
        columnHelper.accessor('customer_name', {
            header: 'Cliente',
            cell: (info) => info.getValue() || '-',
        }),
        columnHelper.accessor('status', {
            header: 'Estado',
            cell: (info) => (
                <Badge className={statusColors[info.getValue()] || 'bg-gray-100'}>
                    {statusLabels[info.getValue()] || info.getValue()}
                </Badge>
            ),
        }),
        columnHelper.accessor('installation_type', {
            header: 'Tipo',
            cell: (info) => typeLabels[info.getValue() || ''] || info.getValue() || '-',
        }),
        columnHelper.accessor('system_size_kwp', {
            header: 'Potencia (kWp)',
            cell: (info) => info.getValue() ? `${info.getValue()} kWp` : '-',
        }),
        columnHelper.accessor('created_at', {
            header: 'Creado',
            cell: (info) => new Date(info.getValue()).toLocaleDateString('es-ES'),
        }),
        columnHelper.display({
            id: 'actions',
            header: 'Acciones',
            cell: (info) => (
                <div className="flex gap-2">
                    <Link href={`/dashboard/projects/${info.row.original.id}/edit`}>
                        <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(info.row.original.id)}
                    >
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                </div>
            ),
        }),
    ]

    const table = useReactTable({
        data: data?.data || [],
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="flex gap-2 flex-1 w-full sm:w-auto">
                    <div className="relative flex-1 sm:max-w-xs">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar proyectos..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value)
                                setPage(1)
                            }}
                            className="pl-10"
                        />
                    </div>
                    <Select
                        value={statusFilter}
                        onValueChange={(v) => {
                            setStatusFilter(v)
                            setPage(1)
                        }}
                    >
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="quote">Presupuesto</SelectItem>
                            <SelectItem value="approved">Aprobado</SelectItem>
                            <SelectItem value="installation">Instalación</SelectItem>
                            <SelectItem value="completed">Completado</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Link href="/dashboard/projects/new">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo Proyecto
                    </Button>
                </Link>
            </div>

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="text-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : table.getRowModel().rows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                                    No se encontraron proyectos
                                </TableCell>
                            </TableRow>
                        ) : (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    {data ? (
                        <>
                            Mostrando {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, data.total)} de {data.total}
                            {isFetching && <Loader2 className="h-4 w-4 animate-spin inline ml-2" />}
                        </>
                    ) : '-'}
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1 || isLoading}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="flex items-center px-2 text-sm">
                        {page} / {data?.totalPages || 1}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={page >= (data?.totalPages || 1) || isLoading}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
