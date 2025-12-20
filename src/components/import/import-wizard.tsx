'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
    Upload,
    FileSpreadsheet,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ArrowRight,
    ArrowLeft,
    Download
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { ImportSummary } from '@/components/import/import-summary'
import { detectColumnsSecure, type DetectedColumn, type MappingSuggestion } from '@/lib/actions/import-detection'
import { processImport, type ImportResult } from '@/lib/actions/import-processing'
import { validateImportFile, IMPORT_LIMITS } from '@/lib/security/import-security'

interface ImportWizardProps {
    entityType: 'customers' | 'projects' | 'calculations' | 'sales' | 'visits' | 'stock'
    onComplete?: () => void
}

export function ImportWizard({ entityType, onComplete }: ImportWizardProps) {
    const [step, setStep] = useState(1)
    const [file, setFile] = useState<File | null>(null)
    const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null)
    const [warnings, setWarnings] = useState<string[]>([])

    // Step 2: Detection
    const [columns, setColumns] = useState<DetectedColumn[]>([])
    const [totalRows, setTotalRows] = useState(0)
    const [previewRows, setPreviewRows] = useState<Record<string, any>[]>([])
    const [suggestions, setSuggestions] = useState<MappingSuggestion[]>([])

    // Step 3: Mapping
    const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})

    // Step 4: Configuration
    const [skipDuplicates, setSkipDuplicates] = useState(true)
    const [updateExisting, setUpdateExisting] = useState(false)
    const [saveTemplate, setSaveTemplate] = useState(false)
    const [templateName, setTemplateName] = useState('')

    // Step 5: Import
    const [importing, setImporting] = useState(false)
    const [importResult, setImportResult] = useState<ImportResult | null>(null)

    // ============================================
    // STEP 1: FILE UPLOAD WITH SECURITY
    // ============================================

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFile = e.target.files?.[0]
        if (!uploadedFile) return

        // SECURITY: Validate file before processing
        const fileValidation = validateImportFile(uploadedFile)
        if (!fileValidation.valid) {
            toast.error(fileValidation.error)
            return
        }

        // Show warnings if any
        if (fileValidation.warnings && fileValidation.warnings.length > 0) {
            setWarnings(fileValidation.warnings)
            fileValidation.warnings.forEach(warning => toast.warning(warning))
        }

        setFile(uploadedFile)

        try {
            const buffer = await uploadedFile.arrayBuffer()
            setFileBuffer(buffer)

            // Detect columns with security checks
            const preview = await detectColumnsSecure(buffer, uploadedFile.name, uploadedFile.size)
            setColumns(preview.columns)
            setTotalRows(preview.totalRows)
            setPreviewRows(preview.previewRows)
            setSuggestions(preview.suggestions)

            // Add any additional warnings from detection
            if (preview.warnings) {
                setWarnings(prev => [...prev, ...preview.warnings!])
            }

            // Auto-apply suggestions
            const autoMapping: Record<string, string> = {}
            preview.suggestions.forEach(sug => {
                autoMapping[sug.sourceColumn] = sug.targetField
            })
            setColumnMapping(autoMapping)

            toast.success(`Archivo cargado: ${preview.columns.length} columnas, ${preview.totalRows} filas`)
            setStep(2)
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    // ============================================
    // STEP 3: MAPPING
    // ============================================

    const handleMappingChange = (sourceColumn: string, targetField: string) => {
        setColumnMapping(prev => ({
            ...prev,
            [sourceColumn]: targetField
        }))
    }

    const removeMappingColumn = (sourceColumn: string) => {
        setColumnMapping(prev => {
            const newMapping = { ...prev }
            delete newMapping[sourceColumn]
            return newMapping
        })
    }

    // ============================================
    // STEP 5: IMPORT
    // ============================================

    const handleImport = async () => {
        if (!fileBuffer) {
            toast.error('No hay archivo cargado')
            return
        }

        setImporting(true)
        setStep(5)

        try {
            const result = await processImport(fileBuffer, {
                entityType,
                columnMapping,
                skipDuplicates,
                updateExisting
            })

            setImportResult(result)

            if (result.successfulRows > 0) {
                toast.success(`? ${result.successfulRows} registros importados`)
            }
            if (result.failedRows > 0) {
                toast.error(`? ${result.failedRows} registros fallidos`)
            }
            if (result.skippedRows > 0) {
                toast.info(`?? ${result.skippedRows} registros omitidos (duplicados)`)
            }
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setImporting(false)
        }
    }

    // ============================================
    // RENDER
    // ============================================

    return (
        <div className="space-y-6">
            {/* Progress Indicator */}
            <div className="flex items-center justify-between">
                {[1, 2, 3, 4, 5].map(s => (
                    <div key={s} className="flex items-center">
                        <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center font-semibold
                            ${step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}
                        `}>
                            {s}
                        </div>
                        {s < 5 && (
                            <div className={`w-16 h-1 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />
                        )}
                    </div>
                ))}
            </div>

            {/* Step 1: Upload */}
            {step === 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Paso 1: Subir Archivo</CardTitle>
                        <CardDescription>
                            Sube tu archivo Excel o CSV con los datos a importar
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="border-2 border-dashed rounded-lg p-12 text-center hover:border-blue-500 transition-colors">
                            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <Label htmlFor="file-upload" className="cursor-pointer">
                                <span className="text-blue-600 hover:underline font-medium">
                                    Haz clic para subir
                                </span>
                                {' '}o arrastra un archivo aquí
                            </Label>
                            <Input
                                id="file-upload"
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                            <p className="text-sm text-muted-foreground mt-2">
                                Formatos soportados: Excel (.xlsx, .xls) y CSV
                            </p>
                        </div>

                        {/* Security Limits Info */}
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                <div className="text-sm space-y-1">
                                    <div><strong>Límites de seguridad:</strong></div>
                                    <div>• Tamaño máximo: {IMPORT_LIMITS.MAX_FILE_SIZE / 1024 / 1024} MB</div>
                                    <div>• Filas máximas: {IMPORT_LIMITS.MAX_ROWS.toLocaleString()}</div>
                                    <div>• Campos personalizados: {IMPORT_LIMITS.MAX_CUSTOM_FIELDS} máx</div>
                                    <div>• Importaciones por hora: {IMPORT_LIMITS.IMPORT_RATE_LIMIT}</div>
                                </div>
                            </AlertDescription>
                        </Alert>

                        {/* Warnings Display */}
                        {warnings.length > 0 && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    <div className="font-semibold mb-1">Advertencias:</div>
                                    {warnings.map((warning, i) => (
                                        <div key={i} className="text-sm">• {warning}</div>
                                    ))}
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Step 2: Preview */}
            {step === 2 && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                >
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Paso 2: Vista Previa e Inspección</CardTitle>
                                    <CardDescription>
                                        Detectamos {columns.length} columnas y {totalRows} filas. Puedes editar valores haciendo doble clean en las celdas.
                                    </CardDescription>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                    Modo Edición Activo
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="overflow-x-auto border rounded-md">
                                <table className="w-full border-collapse text-sm">
                                    <thead className="bg-muted/50">
                                        <tr className="border-b">
                                            {columns.map(col => (
                                                <th key={col.originalName} className="text-left p-3 font-medium">
                                                    <div>{col.originalName}</div>
                                                    <Badge variant="outline" className="mt-1 text-[10px] h-5">
                                                        {col.dataType}
                                                    </Badge>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewRows.map((row, rowIndex) => (
                                            <tr key={rowIndex} className="border-b hover:bg-muted/10 transition-colors group">
                                                {columns.map(col => (
                                                    <td
                                                        key={col.originalName}
                                                        className="p-1 min-w-[150px] relative border-r last:border-r-0"
                                                    >
                                                        <input
                                                            className="w-full h-full bg-transparent p-2 focus:bg-accent focus:outline-none rounded-none transition-colors"
                                                            value={row[col.originalName] || ''}
                                                            onChange={(e) => {
                                                                const newVal = e.target.value
                                                                setPreviewRows(prev => {
                                                                    const newRows = [...prev]
                                                                    newRows[rowIndex] = {
                                                                        ...newRows[rowIndex],
                                                                        [col.originalName]: newVal
                                                                    }
                                                                    return newRows
                                                                })
                                                            }}
                                                        />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex justify-between pt-4">
                                <Button variant="outline" onClick={() => setStep(1)}>
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Volver
                                </Button>
                                <Button onClick={() => setStep(3)}>
                                    Continuar
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Step 3: Mapping */}
            {step === 3 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Paso 3: Mapeo de Columnas</CardTitle>
                        <CardDescription>
                            Confirma o ajusta el mapeo automático de columnas
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {columns.map(col => {
                            const suggestion = suggestions.find(s => s.sourceColumn === col.originalName)
                            const currentMapping = columnMapping[col.originalName]

                            return (
                                <div key={col.originalName} className="flex items-center gap-4 p-3 border rounded-lg">
                                    <div className="flex-1">
                                        <div className="font-medium">{col.originalName}</div>
                                        <div className="text-xs text-muted-foreground">
                                            Ejemplo: {col.sampleValues[0]}
                                        </div>
                                    </div>

                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />

                                    <div className="flex-1">
                                        {currentMapping ? (
                                            <div className="flex items-center gap-2">
                                                <Badge variant={suggestion?.isCustomField ? 'secondary' : 'default'}>
                                                    {currentMapping}
                                                </Badge>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => removeMappingColumn(col.originalName)}
                                                >
                                                    ?
                                                </Button>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">No mapeado</span>
                                        )}
                                    </div>
                                </div>
                            )
                        })}

                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Las columnas marcadas como "custom_attributes.*" se guardarán como campos personalizados
                            </AlertDescription>
                        </Alert>

                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => setStep(2)}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Volver
                            </Button>
                            <Button onClick={() => setStep(4)}>
                                Continuar
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 4: Configuration */}
            {step === 4 && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle>Paso 4: Configuración</CardTitle>
                            <CardDescription>
                                Configura el comportamiento de la importación
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <Label>Saltar duplicados</Label>
                                <Switch checked={skipDuplicates} onCheckedChange={setSkipDuplicates} />
                            </div>

                            <div className="flex items-center justify-between">
                                <Label>Actualizar registros existentes</Label>
                                <Switch checked={updateExisting} onCheckedChange={setUpdateExisting} />
                            </div>

                            <div className="border-t pt-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Switch checked={saveTemplate} onCheckedChange={setSaveTemplate} />
                                    <Label>Guardar este mapeo como plantilla</Label>
                                </div>
                                {saveTemplate && (
                                    <Input
                                        placeholder="Nombre de la plantilla"
                                        value={templateName}
                                        onChange={(e) => setTemplateName(e.target.value)}
                                    />
                                )}
                            </div>

                            <div className="flex justify-between">
                                <Button variant="outline" onClick={() => setStep(3)}>
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Volver
                                </Button>
                                <Button onClick={handleImport}>
                                    Iniciar Importación
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Step 5: Import Progress/Results */}
            {step === 5 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {importing ? 'Procesando Importación...' : 'Resultado de Importación'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {importing ? (
                                <div className="space-y-8 py-8">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm text-muted-foreground">
                                            <span>Procesando...</span>
                                            <span>{Math.round((50 / 100) * 100)}%</span> {/* Placeholder logic, in real implementation we'd need a polling or socket */}
                                        </div>
                                        <Progress value={50} className="w-full h-2 animate-pulse" />
                                    </div>
                                    <p className="text-center text-muted-foreground animate-pulse">
                                        Analizando y securizando {totalRows} filas...
                                    </p>
                                </div>
                            ) : importResult && (
                                <ImportSummary
                                    result={importResult}
                                    entityName={entityType}
                                    onReset={() => {
                                        setStep(1)
                                        setFile(null)
                                        setFileBuffer(null)
                                        setImportResult(null)
                                    }}
                                    onComplete={() => onComplete?.()}
                                />
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </div>
    )
}
