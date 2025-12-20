import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
    return (
        <div className="space-y-8 p-4 md:p-6 pb-24 md:pb-8">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/40 pb-6">
                <div>
                    <Skeleton className="h-10 w-64 mb-2" />
                    <Skeleton className="h-5 w-48" />
                </div>
                <Skeleton className="h-9 w-40" />
            </div>

            {/* KPI Grid Skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-6 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm space-y-4">
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-5 w-24" />
                            <Skeleton className="h-8 w-8 rounded-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-20" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Skeleton */}
            <div className="grid gap-6 md:grid-cols-7">
                <div className="md:col-span-5 space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-32 rounded-xl" />
                        ))}
                    </div>
                    <Skeleton className="h-[300px] w-full rounded-xl" />
                </div>
                <div className="md:col-span-2">
                    <Skeleton className="h-full min-h-[400px] rounded-xl" />
                </div>
            </div>
        </div>
    )
}
