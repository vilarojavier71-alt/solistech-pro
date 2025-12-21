'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

// Dynamic import to avoid SSR issues with Leaflet
const InteractiveLocationPicker = dynamic(
    () => import('./interactive-location-picker').then(mod => ({ default: mod.InteractiveLocationPicker })),
    {
        ssr: false,
        loading: () => (
            <div className="relative overflow-hidden rounded-lg border">
                <Skeleton className="h-[350px] w-full" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        <span className="text-sm">Cargando mapa...</span>
                    </div>
                </div>
            </div>
        )
    }
)

export { InteractiveLocationPicker }
