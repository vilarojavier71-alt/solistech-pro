'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
    children?: ReactNode
}

interface State {
    hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    }

    public static getDerivedStateFromError(_: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo)
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center border border-dashed border-red-200 rounded-xl bg-red-50/50">
                    <h2 className="text-xl font-bold mb-2">Algo salió mal</h2>
                    <p className="text-muted-foreground max-w-md">
                        Esta sección ha encontrado un problema inesperado. No te preocupes, tus datos están seguros.
                    </p>
                    <button
                        className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        onClick={() => this.setState({ hasError: false })}
                    >
                        Intentar de nuevo
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}
