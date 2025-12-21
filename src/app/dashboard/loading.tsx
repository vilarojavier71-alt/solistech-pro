import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

/**
 * Dashboard Loading State
 * 
 * Muestra skeletons mientras se cargan los datos del dashboard.
 * Evita pantallas en blanco durante la carga.
 */
export default function DashboardLoading() {
    return (
        <div className="space-y-8 p-6 max-w-7xl mx-auto animate-pulse">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center pb-6 border-b border-border/30">
                <div className="space-y-3">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <div className="text-right space-y-2">
                    <Skeleton className="h-4 w-24 ml-auto" />
                    <Skeleton className="h-8 w-32 ml-auto" />
                </div>
            </div>

            {/* KPIs Grid Skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="border-border/50">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-8 w-8 rounded-lg" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-20 mb-2" />
                            <Skeleton className="h-3 w-32" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Widgets Grid Skeleton */}
            <div className="grid gap-6 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="border-border/50">
                        <CardHeader>
                            <Skeleton className="h-5 w-32" />
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-5/6" />
                            <Skeleton className="h-4 w-2/3" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
