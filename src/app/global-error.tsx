'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Global Error:', error);
    }, [error]);

    return (
        <html>
            <body className="antialiased min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
                <div className="text-center space-y-4 p-8 max-w-md">
                    <h1 className="text-4xl font-bold tracking-tight text-destructive">
                        Error Crítico
                    </h1>
                    <p className="text-muted-foreground">
                        Ha ocurrido un error inesperado en la aplicación.
                        <br />
                        Nuestros ingenieros han sido notificados.
                    </p>
                    {process.env.NODE_ENV === 'development' && (
                        <pre className="text-xs bg-slate-950 text-slate-50 p-4 rounded overflow-auto max-h-40 text-left">
                            {error.message}
                        </pre>
                    )}
                    <div className="pt-4 flex justify-center gap-4">
                        <Button onClick={() => reset()} variant="default">
                            Intentar recuperar
                        </Button>
                        <Button onClick={() => window.location.href = '/'} variant="outline">
                            Volver al inicio
                        </Button>
                    </div>
                </div>
            </body>
        </html>
    );
}
