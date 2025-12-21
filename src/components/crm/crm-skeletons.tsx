import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function MetricsSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-card border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-4 w-[100px]" />
                        <Skeleton className="h-4 w-4 rounded-full" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-[120px] mb-2" />
                        <Skeleton className="h-3 w-[80px]" />
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

export function PipelineSkeleton() {
    return (
        <Card className="col-span-4 bg-card border-border shadow-sm">
            <CardHeader>
                <Skeleton className="h-6 w-[140px]" />
            </CardHeader>
            <CardContent>
                <div className="space-y-5">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="space-y-1.5">
                            <div className="flex justify-between items-end">
                                <Skeleton className="h-4 w-[80px]" />
                                <Skeleton className="h-4 w-[60px]" />
                            </div>
                            <Skeleton className="h-2.5 w-full rounded-full" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
