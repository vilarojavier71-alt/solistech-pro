'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FolderKanban, ArrowRight, Clock } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface Project {
    id: string
    name: string
    status: string
    updated_at: Date
    client?: { name: string } | null
}

interface ProjectsWidgetProps {
    projects: Project[]
    activeCount: number
}

const statusColors: Record<string, string> = {
    quote: 'bg-slate-500',
    approved: 'bg-blue-500',
    installation: 'bg-amber-500',
    completed: 'bg-emerald-500'
}

const statusLabels: Record<string, string> = {
    quote: 'Presupuesto',
    approved: 'Aprobado',
    installation: 'Instalación',
    completed: 'Completado'
}

/**
 * Projects Widget - Dashboard Centralita
 * Shows top 5 most recently updated projects
 */
export function ProjectsWidget({ projects, activeCount }: ProjectsWidgetProps) {
    return (
        <Card className="border-border/50 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Proyectos Activos
                    </CardTitle>
                    <Badge variant="secondary" className="font-bold">
                        {activeCount}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {projects.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                        <FolderKanban className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Sin proyectos activos</p>
                        <Link
                            href="/dashboard/projects/new"
                            className="text-xs text-primary hover:underline mt-2 inline-block"
                        >
                            Crear primer proyecto →
                        </Link>
                    </div>
                ) : (
                    <>
                        {projects.slice(0, 5).map((project) => (
                            <Link
                                key={project.id}
                                href={`/dashboard/projects/${project.id}`}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                            >
                                <div className={`w-2 h-2 rounded-full ${statusColors[project.status] || 'bg-slate-400'}`} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                                        {project.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {project.client?.name || 'Sin cliente'} • {statusLabels[project.status] || project.status}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true, locale: es })}
                                </div>
                            </Link>
                        ))}

                        <Link
                            href="/dashboard/projects"
                            className="flex items-center justify-center gap-1 text-xs text-primary hover:underline pt-2 border-t"
                        >
                            Ver todos los proyectos <ArrowRight className="h-3 w-3" />
                        </Link>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
