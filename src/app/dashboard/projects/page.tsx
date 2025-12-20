import { Metadata } from 'next'
import { ProjectsTable } from '@/components/projects/projects-table'

export const metadata: Metadata = {
    title: 'Proyectos | SolisTech PRO',
    description: 'Gestiona tus proyectos solares',
}

export default function ProjectsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Proyectos</h1>
                <p className="text-muted-foreground">
                    Gestiona tus proyectos de instalaciones solares
                </p>
            </div>

            <ProjectsTable />
        </div>
    )
}
