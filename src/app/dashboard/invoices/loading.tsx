import { PageShell } from "@/components/ui/page-shell"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
    return (
        <PageShell
            title="Facturas"
            description="Administra todas tus facturas emitidas."
        >
            <div className="grid gap-4 md:grid-cols-3 mb-8">
                <Skeleton className="h-[120px] rounded-xl" />
                <Skeleton className="h-[120px] rounded-xl" />
                <Skeleton className="h-[120px] rounded-xl" />
            </div>
            <div className="rounded-md border border-zinc-800 bg-zinc-900">
                <div className="p-4 space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center space-x-4">
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ))}
                </div>
            </div>
        </PageShell>
    )
}
