import { PageShell } from "@/components/ui/page-shell"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
    return (
        <PageShell
            title="Clientes"
            description="Gestiona tu cartera de clientes y contactos."
        >
            <div className="rounded-md border border-zinc-800 bg-zinc-900">
                <div className="p-4 border-b border-zinc-800">
                    <div className="flex items-center space-x-4">
                        <Skeleton className="h-4 w-[100px]" />
                        <Skeleton className="h-4 w-[100px]" />
                        <Skeleton className="h-4 w-[100px]" />
                        <Skeleton className="h-4 w-[50px]" />
                    </div>
                </div>
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
