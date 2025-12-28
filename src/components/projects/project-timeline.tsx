
'use client'

import { ProjectListItem } from "@/lib/actions/projects"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import Link from "next/link"

const PHASES = ['quote', 'approved', 'installation', 'completed']
const PHASE_LABELS: Record<string, string> = {
    quote: 'Presupuesto',
    approved: 'Aprobado',
    installation: 'Instalación',
    completed: 'Completado'
}

export function ProjectTimeline({ projects }: { projects: ProjectListItem[] }) {
    if (projects.length === 0) {
        return <div className="p-8 text-center text-muted-foreground border-2 border-dashed rounded-xl">No hay proyectos para mostrar en el cronograma.</div>
    }

    return (
        <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="space-y-4 p-1">
                {projects.map(project => {
                    const currentPhaseIndex = PHASES.indexOf(project.status)
                    const progress = ((currentPhaseIndex + 1) / PHASES.length) * 100

                    return (
                        <Card key={project.id} className="overflow-hidden">
                            <CardContent className="p-4">
                                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-4">
                                    <div>
                                        <Link href={`/dashboard/projects/${project.id}`} className="font-semibold hover:underline text-lg">
                                            {project.name}
                                        </Link>
                                        <div className="text-sm text-muted-foreground">
                                            {project.customer_name} • {new Date(project.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="capitalize">
                                        {PHASE_LABELS[project.status] || project.status}
                                    </Badge>
                                </div>

                                {/* Timeline/Stepper */}
                                <div className="relative pt-2 pb-2">
                                    <div className="absolute top-1/2 left-0 w-full h-1 bg-zinc-100 dark:bg-zinc-800 -translate-y-1/2 rounded-full" />
                                    <div
                                        className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 -translate-y-1/2 rounded-full transition-all duration-500"
                                        style={{ width: `${progress}%` }}
                                    />

                                    <div className="relative flex justify-between w-full">
                                        {PHASES.map((phase, index) => {
                                            const isActive = index <= currentPhaseIndex
                                            const isCurrent = index === currentPhaseIndex

                                            return (
                                                <div key={phase} className="flex flex-col items-center gap-2">
                                                    <div className={cn(
                                                        "w-4 h-4 rounded-full border-2 transition-colors z-10",
                                                        isActive
                                                            ? "bg-indigo-500 border-indigo-500"
                                                            : "bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700",
                                                        isCurrent && "ring-4 ring-indigo-500/20"
                                                    )} />
                                                    <span className={cn(
                                                        "text-xs font-medium uppercase",
                                                        isActive ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400"
                                                    )}>
                                                        {PHASE_LABELS[phase]}
                                                    </span>
                                                    {isCurrent && project.end_date && (
                                                        <span className="text-[10px] text-zinc-500 font-mono bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">
                                                            {new Date(project.end_date).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </ScrollArea>
    )
}
