'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Papa from 'papaparse'
import { importCustomers, importLeads } from '@/lib/actions/import'

interface CSVImporterProps {
    type: 'customers' | 'leads'
}

type ImportStatus = 'idle' | 'uploading' | 'validating' | 'importing' | 'done' | 'error'

export function CSVImporter({ type }: CSVImporterProps) {
    const [status, setStatus] = useState<ImportStatus>('idle')
    const [file, setFile] = useState<File | null>(null)
    const [data, setData] = useState<any[]>([])
    const [headers, setHeaders] = useState<string[]>([])
    const [progress, setProgress] = useState(0)
    const [result, setResult] = useState<{ success: number; errors: number } | null>(null)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return

        if (!selectedFile.name.endsWith('.csv')) {
            toast.error('Por favor selecciona un archivo CSV')
            return
        }

        setFile(selectedFile)
        setStatus('uploading')

        // Parse CSV
        Papa.parse(selectedFile, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.data.length === 0) {
                    toast.error('El archivo CSV está vacío')
                    setStatus('error')
                    return
                }

                setHeaders(results.meta.fields || [])
                setData(results.data)
                setStatus('idle')
                toast.success(`${results.data.length} filas detectadas`)
            },
            error: (error) => {
                toast.error('Error al leer el archivo CSV')
                setStatus('error')
                console.error(error)
            }
        })
    }

    const handleImport = async () => {
        if (data.length === 0) {
            toast.error('No hay datos para importar')
            return
        }

        setStatus('importing')
        setProgress(0)

        try {
            let importedCount = 0
            let errorCount = 0
            const batchSize = 50
            const batches = Math.ceil(data.length / batchSize)

            for (let i = 0; i < batches; i++) {
                const batch = data.slice(i * batchSize, (i + 1) * batchSize)

                try {
                    if (type === 'customers') {
                        const result = await importCustomers(batch)
                        importedCount += result.success
                        errorCount += result.errors.length
                    } else {
                        const result = await importLeads(batch)
                        importedCount += result.success
                        errorCount += result.errors.length
                    }
                } catch (error) {
                    errorCount += batch.length
                }

                setProgress(Math.round(((i + 1) / batches) * 100))
            }

            setResult({ success: importedCount, errors: errorCount })
            setStatus('done')

            if (errorCount === 0) {
                toast.success(`${importedCount} registros importados correctamente`)
            } else {
                toast.warning(`Importados: ${importedCount} | Errores: ${errorCount}`)
            }
        } catch (error) {
            setStatus('error')
            toast.error('Error durante la importación')
        }
    }

    return (
        <div className="space-y-6">
            {/* File Upload */}
            {status === 'idle' && !file && (
                <div className="border-2 border-dashed rounded-lg p-12 text-center">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <Label htmlFor="csv-file" className="cursor-pointer">
                        <div className="text-lg font-semibold mb-2">
                            Selecciona un archivo CSV
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                            o arrastra y suelta aquí
                        </p>
                        <Button type="button" variant="outline" className="pointer-events-none">
                            Examinar archivos
                        </Button>
                        <Input
                            id="csv-file"
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={handleFileSelect}
                        />
                    </Label>
                </div>
            )}

            {/* File Info & Preview */}
            {file && data.length > 0 && status !== 'done' && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                        <FileText className="h-8 w-8 text-blue-600" />
                        <div className="flex-1">
                            <div className="font-semibold">{file.name}</div>
                            <div className="text-sm text-muted-foreground">
                                {data.length} filas | {headers.length} columnas
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setFile(null)
                                setData([])
                                setHeaders([])
                                setStatus('idle')
                            }}
                        >
                            Cambiar archivo
                        </Button>
                    </div>

                    {/* Preview */}
                    <div className="border rounded-lg overflow-hidden">
                        <div className="bg-muted px-4 py-2 font-semibold text-sm">
                            Vista previa (primeras 5 filas)
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        {headers.map((header, i) => (
                                            <th key={i} className="px-4 py-2 text-left font-medium">
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.slice(0, 5).map((row, i) => (
                                        <tr key={i} className="border-t">
                                            {headers.map((header, j) => (
                                                <td key={j} className="px-4 py-2">
                                                    {row[header] || '-'}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Import Button */}
                    <Button
                        onClick={handleImport}
                        disabled={status === 'importing'}
                        className="w-full"
                        size="lg"
                    >
                        {status === 'importing' ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Importando... {progress}%
                            </>
                        ) : (
                            <>
                                <Upload className="mr-2 h-4 w-4" />
                                Importar {data.length} registros
                            </>
                        )}
                    </Button>
                </div>
            )}

            {/* Progress */}
            {status === 'importing' && (
                <div className="space-y-2">
                    <Progress value={progress} />
                    <p className="text-sm text-center text-muted-foreground">
                        Importando registros... {progress}%
                    </p>
                </div>
            )}

            {/* Result */}
            {status === 'done' && result && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-6 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                        <div className="flex-1">
                            <div className="font-semibold text-green-900">
                                Importación completada
                            </div>
                            <div className="text-sm text-green-700">
                                {result.success} registros importados correctamente
                                {result.errors > 0 && ` | ${result.errors} errores`}
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={() => {
                            setFile(null)
                            setData([])
                            setHeaders([])
                            setStatus('idle')
                            setResult(null)
                        }}
                        variant="outline"
                        className="w-full"
                    >
                        Importar otro archivo
                    </Button>
                </div>
            )}

            {/* Error */}
            {status === 'error' && (
                <div className="flex items-center gap-3 p-6 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                    <div className="flex-1">
                        <div className="font-semibold text-red-900">
                            Error en la importación
                        </div>
                        <div className="text-sm text-red-700">
                            Por favor verifica el formato del archivo e inténtalo de nuevo
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
