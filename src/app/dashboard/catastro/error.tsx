'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function CatastroError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Catastro Error:', error)
    }, [error])

    return (
        <div className="container mx-auto py-6">
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                        <AlertCircle className="h-5 w-5" />
                        Error en Consulta Catastral
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-red-600 dark:text-red-400">
                        Se ha producido un error al cargar el módulo de consulta catastral.
                    </p>

                    <div className="p-3 bg-white dark:bg-background rounded-lg border text-xs font-mono text-muted-foreground overflow-auto">
                        {error.message || 'Error desconocido'}
                    </div>

                    <div className="flex gap-2">
                        <Button onClick={reset} variant="outline">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Reintentar
                        </Button>
                        <Button variant="secondary" onClick={() => window.location.href = '/dashboard'}>
                            Volver al Dashboard
                        </Button>
                    </div>

                    <p className="text-xs text-muted-foreground">
                        💡 Si el error persiste, prueba a recargar la página o contacta con soporte técnico.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
