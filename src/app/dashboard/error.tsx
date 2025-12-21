'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import Link from 'next/link'

/**
 * Dashboard Error Boundary
 * 
 * Captura errores a nivel de dashboard y muestra una UI amigable
 * en lugar de crashear toda la aplicación.
 */
export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log error to console for debugging
        console.error('[DASHBOARD ERROR]', {
            message: error.message,
            digest: error.digest,
            stack: error.stack
        })

        // TODO: Send to Sentry or logging service
        // logger.error('Dashboard error', { error, digest: error.digest })
    }, [error])

    return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
            <Card className="max-w-lg w-full border-destructive/50 bg-destructive/5">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 p-4 rounded-full bg-destructive/10 w-fit">
                        <AlertTriangle className="h-8 w-8 text-destructive" />
                    </div>
                    <CardTitle className="text-xl">
                        Algo salió mal
                    </CardTitle>
                    <CardDescription>
                        Ha ocurrido un error al cargar el dashboard.
                        Esto puede deberse a un problema temporal.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Error digest for debugging (hidden in production) */}
                    {process.env.NODE_ENV === 'development' && error.digest && (
                        <div className="p-3 rounded-lg bg-muted text-xs font-mono text-muted-foreground">
                            <div className="flex items-center gap-2 mb-2">
                                <Bug className="h-3 w-3" />
                                <span className="font-semibold">Debug Info:</span>
                            </div>
                            <p>Digest: {error.digest}</p>
                            <p className="truncate">Message: {error.message}</p>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                            onClick={reset}
                            className="flex-1"
                            variant="default"
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Reintentar
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                            className="flex-1"
                        >
                            <Link href="/">
                                <Home className="mr-2 h-4 w-4" />
                                Ir al inicio
                            </Link>
                        </Button>
                    </div>

                    <p className="text-center text-xs text-muted-foreground pt-2">
                        Si el problema persiste, contacta a{' '}
                        <a href="mailto:soporte@motorgap.es" className="underline hover:text-primary">
                            soporte@motorgap.es
                        </a>
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
