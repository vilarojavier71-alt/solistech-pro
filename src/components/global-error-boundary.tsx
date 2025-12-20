"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCcw, Home } from "lucide-react"

interface ErrorBoundaryProps {
    children: React.ReactNode
}

interface ErrorBoundaryState {
    hasError: boolean
    error?: Error
}

export class GlobalErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("?? CRITICAL UI CRASH DETECTED:", error, errorInfo)
        // Here you would log to Sentry/LogRocket
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex h-screen w-full flex-col items-center justify-center bg-zinc-950 p-4 text-center text-zinc-50">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 mb-6 ring-1 ring-red-500/50">
                        <AlertTriangle className="h-10 w-10 text-red-500" />
                    </div>

                    <h1 className="text-3xl font-bold tracking-tight mb-2">Algo salió mal</h1>
                    <p className="text-zinc-400 max-w-md mb-8">
                        Hemos detectado un error crítico en la interfaz. Nuestro equipo de élite ha sido notificado.
                    </p>

                    <div className="bg-zinc-900/50 p-4 rounded-lg border border-red-500/20 max-w-lg w-full mb-8 font-mono text-xs text-left overflow-auto max-h-40">
                        <p className="text-red-400 font-bold mb-1">Error Trace:</p>
                        {this.state.error?.message || "Unknown Error"}
                    </div>

                    <div className="flex gap-4">
                        <Button
                            variant="outline"
                            onClick={() => window.location.reload()}
                            className="gap-2"
                        >
                            <RefreshCcw className="h-4 w-4" />
                            Recargar Sistema
                        </Button>
                        <Button
                            onClick={() => window.location.href = '/dashboard'}
                            className="gap-2 bg-white text-black hover:bg-zinc-200"
                        >
                            <Home className="h-4 w-4" />
                            Volver al Dashboard
                        </Button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
