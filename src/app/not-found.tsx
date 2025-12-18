import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
            <div className="text-center space-y-6 max-w-md">
                <div className="space-y-2">
                    <h1 className="text-8xl font-black text-primary/20">404</h1>
                    <h2 className="text-2xl font-bold tracking-tight">
                        Página no encontrada
                    </h2>
                    <p className="text-muted-foreground">
                        La ruta que buscas no existe o ha sido movida.
                    </p>
                </div>

                <div className="flex justify-center gap-4">
                    <Button asChild variant="default">
                        <Link href="/dashboard">Ir al Dashboard</Link>
                    </Button>
                    <Button asChild variant="ghost">
                        <Link href="/">Volver al Inicio</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
