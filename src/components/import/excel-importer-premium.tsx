'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
    DataTablePremium,
    LoadingStatePremium,
    OptimisticAction
} from '@/components/premium'
import {
    Upload,
    Eye,
    Table as TableIcon,
    CheckCircle,
    AlertCircle,
    FileSpreadsheet,
    ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ============================================
// EXCEL IMPORTER PREMIUM - INTELLIGENT VIEW
// ============================================

export function ExcelImporterPremium() {
    const [file, setFile] = useState<File | null>(null)
    const [isCompact, setIsCompact] = useState(true)
    const [data, setData] = useState<any[]>([])
    const [columns, setColumns] = useState<any[]>([])
    const [mappedColumns, setMappedColumns] = useState<any[]>([])
    const [unmappedColumns, setUnmappedColumns] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    // Mock data for demonstration
    const mockData = [
        { id: 1, nombre: 'Juan García', email: 'juan@example.com', telefono: '612345678', ciudad: 'Madrid', nif: '12345678A', empresa: 'Acme Corp', cargo: 'CEO', sector: 'Tecnología' },
        { id: 2, nombre: 'María López', email: 'maria@example.com', telefono: '678901234', ciudad: 'Barcelona', nif: '87654321B', empresa: 'Tech Solutions', cargo: 'CTO', sector: 'Software' },
        { id: 3, nombre: 'Pedro Martínez', email: 'pedro@example.com', telefono: '654321098', ciudad: 'Valencia', nif: '11223344C', empresa: 'Solar Energy', cargo: 'Director', sector: 'Energía' }
    ]

    const mockColumns = [
        { id: 'nombre', label: 'Nombre', accessor: 'nombre', mapped: true, sortable: true },
        { id: 'email', label: 'Email', accessor: 'email', mapped: true, sortable: true },
        { id: 'telefono', label: 'Teléfono', accessor: 'telefono', mapped: true, sortable: true },
        { id: 'ciudad', label: 'Ciudad', accessor: 'ciudad', mapped: true, sortable: true },
        { id: 'nif', label: 'NIF', accessor: 'nif', mapped: false },
        { id: 'empresa', label: 'Empresa', accessor: 'empresa', mapped: false },
        { id: 'cargo', label: 'Cargo', accessor: 'cargo', mapped: false },
        { id: 'sector', label: 'Sector', accessor: 'sector', mapped: false }
    ]

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFile = e.target.files?.[0]
        if (!uploadedFile) return

        setFile(uploadedFile)
        setLoading(true)

        // Simulate file processing
        await new Promise(resolve => setTimeout(resolve, 1500))

        setData(mockData)
        setColumns(mockColumns)
        setMappedColumns(mockColumns.filter(c => c.mapped))
        setUnmappedColumns(mockColumns.filter(c => !c.mapped))
        setLoading(false)

        toast.success(`Archivo cargado: ${mockColumns.length} columnas, ${mockData.length} filas`)
    }

    const displayColumns = isCompact ? mappedColumns : columns
    const hiddenCount = columns.length - displayColumns.length

    return (
        <div className="space-y-6">
            {/* Upload Section */}
            {!file && (
                <Card className="card-premium shadow-premium">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileSpreadsheet className="h-6 w-6 text-teal-600" />
                            Importador Excel Premium
                        </CardTitle>
                        <CardDescription>
                            Sube tu archivo Excel o CSV para importar datos
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="border-2 border-dashed rounded-lg p-12 text-center hover:border-teal-500 transition-colors cursor-pointer">
                            <Upload className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                            <label htmlFor="file-upload" className="cursor-pointer">
                                <span className="text-teal-600 hover:underline font-medium text-lg">
                                    Haz clic para subir
                                </span>
                                <span className="text-slate-600 dark:text-slate-400"> o arrastra un archivo aquí</span>
                            </label>
                            <input
                                id="file-upload"
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                            <p className="text-sm text-slate-500 dark:text-slate-500 mt-4">
                                Formatos soportados: Excel (.xlsx, .xls) y CSV
                            </p>
                        </div>

                        {/* Security Limits */}
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                <div className="text-sm space-y-1">
                                    <div><strong>Límites de seguridad:</strong></div>
                                    <div>• Tamaño máximo: 10 MB</div>
                                    <div>• Filas máximas: 10,000</div>
                                    <div>• Campos personalizados: 20 máx</div>
                                </div>
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            )}

            {/* Loading State */}
            {loading && (
                <LoadingStatePremium
                    type="narrative"
                    steps={[
                        { label: "Validando archivo" },
                        { label: "Detectando columnas" },
                        { label: "Analizando datos" },
                        { label: "Preparando vista previa" }
                    ]}
                    currentStep={2}
                    progress={65}
                />
            )}

            {/* Preview Section */}
            {file && !loading && data.length > 0 && (
                <>
                    {/* Stats */}
                    <Card className="glass-strong border-2 border-teal-500/20">
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-3 gap-6">
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                                        <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                            {columns.length}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">columnas detectadas</p>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <FileSpreadsheet className="h-5 w-5 text-teal-500" />
                                        <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                            {data.length}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">filas encontradas</p>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <CheckCircle className="h-5 w-5 text-gold-500" />
                                        <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                            {mappedColumns.length}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">campos mapeados</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Data Table with Compact/Full Toggle */}
                    <DataTablePremium
                        columns={displayColumns}
                        data={data}
                        features={{
                            virtualScroll: true,
                            stickyHeader: true,
                            compactView: true,
                            export: true,
                            search: true,
                            sort: true
                        }}
                        maxHeight="500px"
                    />

                    {/* Hidden Columns Alert */}
                    {isCompact && hiddenCount > 0 && (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="flex items-center justify-between">
                                <div>
                                    <strong>{hiddenCount} columnas adicionales</strong> se guardarán como campos personalizados.
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsCompact(false)}
                                >
                                    <Eye className="mr-2 h-4 w-4" />
                                    Ver todas las columnas
                                </Button>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Actions */}
                    <div className="flex justify-between items-center">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setFile(null)
                                setData([])
                                setColumns([])
                            }}
                        >
                            Cancelar
                        </Button>

                        <div className="flex gap-2">
                            {!isCompact && (
                                <Button
                                    variant="outline"
                                    onClick={() => setIsCompact(true)}
                                >
                                    <Eye className="mr-2 h-4 w-4" />
                                    Vista Compacta
                                </Button>
                            )}
                            <OptimisticAction
                                onAction={async () => {
                                    await new Promise(resolve => setTimeout(resolve, 2000))
                                    return { success: true, imported: data.length }
                                }}
                                successMessage={`${data.length} registros importados correctamente`}
                                loadingMessage="Importando datos..."
                            >
                                <Button size="lg" className="btn-premium">
                                    <CheckCircle className="mr-2 h-5 w-5" />
                                    Importar {data.length} Registros
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </OptimisticAction>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
