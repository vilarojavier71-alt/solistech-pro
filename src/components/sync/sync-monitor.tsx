'use client'

import { useOfflineSync } from '@/hooks/useOfflineSync'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Cloud, CloudOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SyncMonitor() {
    const { isOnline, syncState, syncNow } = useOfflineSync()

    // Guard clause: Asegurar que syncState existe antes de acceder
    const pendingCount = syncState?.totalPending || 0
    const hasPending = pendingCount > 0
    const isSyncing = syncState?.isSyncing || false
    const entities = syncState?.byEntity || {}

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "relative h-9 w-9 px-0 md:h-auto md:w-auto md:px-3 md:gap-2",
                        !isOnline && "text-amber-500",
                        hasPending && "text-blue-500"
                    )}
                >
                    <div className="relative">
                        {isOnline ? (
                            hasPending ? (
                                <RefreshCw className={cn("h-5 w-5", isSyncing && "animate-spin")} />
                            ) : (
                                <Cloud className="h-5 w-5" />
                            )
                        ) : (
                            <CloudOff className="h-5 w-5" />
                        )}

                        {hasPending && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white md:hidden">
                                {pendingCount}
                            </span>
                        )}
                    </div>

                    <span className="hidden md:inline font-medium">
                        {!isOnline ? "Offline" : hasPending ? "Sincronizando..." : "Sincronizado"}
                    </span>

                    {hasPending && (
                        <Badge variant="secondary" className="hidden md:flex bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 ml-1">
                            {pendingCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b bg-muted/30">
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold leading-none">Estado de Sincronización</h4>
                        {isOnline ? (
                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Online</Badge>
                        ) : (
                            <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Offline</Badge>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                        {pendingCount === 0
                            ? "Todos los datos están actualizados."
                            : `${pendingCount} cambios pendientes de subida.`}
                    </p>
                </div>

                {pendingCount > 0 && (
                    <ScrollArea className="h-[200px]">
                        <div className="p-4 space-y-4">
                            {Object.entries(entities).map(([entity, count]) => (
                                <div key={entity} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                            <RefreshCw className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium capitalize">{entity.replace('_', ' ')}</p>
                                            <p className="text-xs text-muted-foreground">{count} cambios</p>
                                        </div>
                                    </div>
                                    {isSyncing && (
                                        <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}

                <div className="p-4 border-t bg-muted/30">
                    <Button
                        className="w-full"
                        size="sm"
                        onClick={() => syncNow()}
                        disabled={isSyncing || !isOnline || pendingCount === 0}
                    >
                        {isSyncing ? (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                Sincronizando...
                            </>
                        ) : (
                            <>
                                Sincronizar Ahora
                            </>
                        )}
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}
