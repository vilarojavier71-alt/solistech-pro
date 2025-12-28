import { deleteProject } from '@/lib/actions/projects'

import { Project } from '@/types'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Zap } from 'lucide-react'
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

const statusColors: Record<string, string> = {
    quote: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    installation: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    completed: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
}

const statusLabels: Record<string, string> = {
    quote: 'Presupuesto',
    approved: 'Aprobado',
    installation: 'Instalación',
    completed: 'Completado',
    cancelled: 'Cancelado',
}

const typeLabels: Record<string, string> = {
    residential: 'Residencial',
    commercial: 'Comercial',
    industrial: 'Industrial',
}

export function ProjectsTable({ projects }: { projects: any[] }) {
    const router = useRouter()
    // const supabase = createClient()

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este proyecto?')) return

        const result = await deleteProject(id)

        if (!result.success) {
            toast.error(result.error || 'Error al eliminar el proyecto')
            return
        }

        toast.success('Proyecto eliminado')
        // router.refresh()
    }

    if (projects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                <Zap className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No hay proyectos</h3>
                <p className="text-sm text-muted-foreground mt-2">
                    Comienza creando tu primer proyecto solar
                </p>
                <Button className="mt-4" onClick={() => router.push('/dashboard/projects/new')}>
                    Crear Proyecto
                </Button>
            </div>
        )
    }

    return (
        <div className="rounded-md border bg-card text-card-foreground shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Proyecto</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Potencia</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Producción Est.</TableHead>
                        <TableHead className="w-[70px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {projects.map((project) => (
                        <TableRow key={project.id}>
                            <TableCell className="font-medium">{project.name}</TableCell>
                            <TableCell>{project.customer?.name || '-'}</TableCell>
                            <TableCell className="capitalize">
                                {project.installation_type ? typeLabels[project.installation_type] : '-'}
                            </TableCell>
                            <TableCell>
                                {project.system_size_kwp ? `${project.system_size_kwp} kWp` : '-'}
                            </TableCell>
                            <TableCell>
                                <Badge className={statusColors[project.status]}>
                                    {statusLabels[project.status]}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {project.estimated_production_kwh
                                    ? `${project.estimated_production_kwh.toLocaleString()} kWh/año`
                                    : '-'}
                            </TableCell>
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
                                            onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                                        >
                                            Ver detalles
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => router.push(`/dashboard/projects/${project.id}/edit`)}
                                        >
                                            Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => router.push(`/dashboard/quotes/new?project=${project.id}`)}
                                        >
                                            Crear presupuesto
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => handleDelete(project.id)}
                                            className="text-red-600"
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
