'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home, HelpCircle } from 'lucide-react'
import Link from 'next/link'

/**
 * Help Center Error Boundary
 */
export default function HelpError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('[HELP ERROR]', { message: error.message, digest: error.digest })
    }, [error])

    return (
        <div className="min-h-[40vh] flex items-center justify-center p-6">
            <Card className="max-w-md w-full">
                <CardHeader className="text-center">
                    <HelpCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <CardTitle>Error en Centro de Ayuda</CardTitle>
                    <CardDescription>
                        No pudimos cargar esta sección. Inténtalo de nuevo.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex gap-3">
                    <Button onClick={reset} className="flex-1">
                        <RefreshCw className="mr-2 h-4 w-4" /> Reintentar
                    </Button>
                    <Button asChild variant="outline" className="flex-1">
                        <Link href="/dashboard">
                            <Home className="mr-2 h-4 w-4" /> Dashboard
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
