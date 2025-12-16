import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function LegalLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col font-sans">
            <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between mx-auto px-4 max-w-5xl">
                    <Link href="/" className="flex items-center space-x-2 font-bold text-xl">
                        🚗 MotorGap
                    </Link>
                    <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                        Volver al inicio
                    </Link>
                </div>
            </header>

            <main className="flex-1">
                {children}
            </main>

            <footer className="border-t py-6 md:py-0">
                <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row mx-auto px-4 max-w-5xl">
                    <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                        © 2025 MotorGap. Todos los derechos reservados.
                    </p>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                        <Link href="/legal/privacy" className="hover:underline underline-offset-4">Privacidad</Link>
                        <Link href="/legal/cookies" className="hover:underline underline-offset-4">Cookies</Link>
                        <Link href="/legal/terms" className="hover:underline underline-offset-4">Términos</Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}
