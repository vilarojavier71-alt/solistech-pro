"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, AlertTriangle, XCircle, Download, RotateCcw, ArrowRight } from "lucide-react"
import { ImportResult } from "@/lib/actions/import-processing"
import { motion } from "framer-motion"

interface ImportSummaryProps {
    result: ImportResult
    entityName: string
    onReset: () => void
    onComplete: () => void
}

export function ImportSummary({ result, entityName, onReset, onComplete }: ImportSummaryProps) {
    const successRate = Math.round((result.successfulRows / result.totalRows) * 100) || 0

    // Generate CSV for errors
    const downloadErrorReport = () => {
        if (result.errors.length === 0) return

        const headers = ['Row', 'Field', 'Message', 'Value']
        const csvContent = [
            headers.join(','),
            ...result.errors.map(err =>
                `${err.row},"${err.field}","${err.message}","${err.value || ''}"`
            )
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `import_errors_${new Date().toISOString()}.csv`
        link.click()
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-green-200 bg-green-50/50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-green-700">Completados</CardDescription>
                        <CardTitle className="text-4xl text-green-700 flex items-center gap-2">
                            <CheckCircle2 className="w-8 h-8" />
                            {result.successfulRows}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-yellow-200 bg-yellow-50/50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-yellow-700">Omitidos (Duplicados)</CardDescription>
                        <CardTitle className="text-4xl text-yellow-700 flex items-center gap-2">
                            <AlertTriangle className="w-8 h-8" />
                            {result.skippedRows}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-red-200 bg-red-50/50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-red-700">Fallidos</CardDescription>
                        <CardTitle className="text-4xl text-red-700 flex items-center gap-2">
                            <XCircle className="w-8 h-8" />
                            {result.failedRows}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Resumen de Operación</CardTitle>
                    <CardDescription>
                        Procesados {result.processedRows} de {result.totalRows} registros detectados.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Tasa de Éxito</span>
                            <span className="font-bold">{successRate}%</span>
                        </div>
                        <Progress value={successRate} className="h-2" />
                    </div>

                    {result.errors.length > 0 && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Atención Requerida</AlertTitle>
                            <AlertDescription className="mt-2">
                                <p className="mb-2">Se encontraron {result.errors.length} problemas que impidieron la importación de algunas filas.</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-white border-red-200 hover:bg-red-50 text-red-700"
                                    onClick={downloadErrorReport}
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Descargar Reporte de Errores (CSV)
                                </Button>
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="flex justify-between pt-4">
                        <Button variant="ghost" onClick={onReset}>
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Nueva Importación
                        </Button>
                        <Button onClick={onComplete} className="gap-2">
                            Finalizar
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
