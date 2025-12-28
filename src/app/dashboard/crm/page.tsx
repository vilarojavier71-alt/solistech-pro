
import { PageShell } from "@/components/ui/page-shell"
import { KanbanBoard } from "@/components/crm/kanban-board"
import { AddLeadDialog } from "@/components/crm/add-lead-dialog"
import { getCrmPipeline } from "@/lib/actions/crm"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

export default async function CRMDashboardPage() {
    const pipelineData = await getCrmPipeline()

    return (
        <PageShell
            title="CRM & Pipeline"
            description="Gestiona tus oportunidades en tiempo real con vista Kanban."
            action={<AddLeadDialog />}
        >
            <div className="h-[calc(100vh-200px)]">
                <Suspense fallback={<KanbanSkeleton />}>
                    <KanbanBoard initialData={pipelineData} />
                </Suspense>
            </div>
        </PageShell>
    )
}

function KanbanSkeleton() {
    return (
        <div className="flex gap-4 overflow-x-auto pb-4">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex flex-col w-80 shrink-0 gap-3">
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-32 w-full rounded-xl" />
                    <Skeleton className="h-32 w-full rounded-xl" />
                    <Skeleton className="h-32 w-full rounded-xl" />
                </div>
            ))}
        </div>
    )
}
