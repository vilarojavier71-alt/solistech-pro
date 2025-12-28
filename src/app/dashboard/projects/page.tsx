
import { Metadata } from 'next'
import { ProjectsTable } from '@/components/projects/projects-table'
import { ProjectTimeline } from '@/components/projects/project-timeline'
import { getProjectsList } from '@/lib/actions/projects'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { List, GitGraph, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const metadata: Metadata = {
    title: 'Proyectos | MotorGap',
    description: 'Gestiona tus proyectos solares',
}

export default async function ProjectsPage() {
    // Fetch initial data (server-side for Timeline, while Table fetches client-side - hybrid approach)
    // Actually table handles its own state. Timeline needs data.
    // We'll fetch a batch for Timeline.
    const timelineData = await getProjectsList({ page: 1, pageSize: 50, sortBy: 'updated_at' })

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Proyectos</h1>
                    <p className="text-muted-foreground">
                        Gestiona tus proyectos de instalaciones solares
                    </p>
                </div>
                <Link href="/dashboard/projects/new">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo Proyecto
                    </Button>
                </Link>
            </div>

            <Tabs defaultValue="list" className="flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <TabsList>
                        <TabsTrigger value="list"><List className="h-4 w-4 mr-2" /> Lista</TabsTrigger>
                        <TabsTrigger value="timeline"><GitGraph className="h-4 w-4 mr-2" /> Cronograma</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="list" className="flex-1">
                    <ProjectsTable />
                </TabsContent>

                <TabsContent value="timeline" className="flex-1">
                    <ProjectTimeline projects={timelineData.data} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
