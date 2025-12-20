import { PageShell } from "@/components/ui/page-shell"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
    return (
        <PageShell
            title="Oportunidades"
            description="Visualiza y gestiona tu pipeline de ventas. (Funcionalidad Global en desarrollo)"
        >
            <div className="rounded-md border border-zinc-800 bg-zinc-900 overflow-hidden">
                <div className="p-4 border-b border-zinc-800 flex justify-between">
                    <Skeleton className="h-8 w-[200px]" />
                    <Skeleton className="h-8 w-[100px]" />
                </div>
                <div className="p-4 grid gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex flex-col space-y-3">
                            <Skeleton className="h-[125px] w-full rounded-xl" />
                        </div>
                    ))}
                </div>
            </div>
        </PageShell>
    )
}
