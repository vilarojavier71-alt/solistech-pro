'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { parseExcelFile, ParsedRow } from '@/lib/utils/excel-parser'
import { Upload, FileSpreadsheet, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'

interface FieldMapping {
    excelColumn: string
    dbField: string
}

interface ExcelImporterProps {
    fields: {
        name: string
        label: string
        required: boolean
    }[]
    onImport: (data: any[]) => Promise<{ success: number; errors: string[] }>
    entityName: string
    preserveUnmappedColumns?: boolean
}

export function ExcelImporter({ fields, onImport, entityName, preserveUnmappedColumns = false }: ExcelImporterProps) {
    const [file, setFile] = useState<File | null>(null)
    const [headers, setHeaders] = useState<string[]>([])
    const [data, setData] = useState<ParsedRow[]>([])
    const [mappings, setMappings] = useState<Record<string, string>>({})
    const [importing, setImporting] = useState(false)
    const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return

        // Validate file type
        const validTypes = [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/csv'
        ]

        if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(xlsx|xls|csv)$/)) {
            toast.error('Formato de archivo no válido. Use .xlsx, .xls o .csv')
            return
        }

        try {
            const parsed = await parseExcelFile(selectedFile)

            if (parsed.errors.length > 0) {
                toast.error(parsed.errors[0])
                return
            }

            setFile(selectedFile)
            setHeaders(parsed.headers)
            setData(parsed.data)
            setResult(null)

            // Auto-map columns with similar names (checking name and label, ignoring accents)
            const removeAccents = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()

            const autoMappings: Record<string, string> = {}
            fields.forEach(field => {
                const normalizedFieldName = removeAccents(field.name)
                const normalizedFieldLabel = removeAccents(field.label)

                const matchingHeader = parsed.headers.find(h => {
                    const normalizedHeader = removeAccents(h)

                    // Check strict matches first
                    if (normalizedHeader === normalizedFieldName) return true
                    if (normalizedHeader === normalizedFieldLabel) return true

                    // Check contains
                    if (normalizedHeader.includes(normalizedFieldName) || normalizedFieldName.includes(normalizedHeader)) return true
                    if (normalizedHeader.includes(normalizedFieldLabel) || normalizedFieldLabel.includes(normalizedHeader)) return true

                    return false
                })

                if (matchingHeader) {
                    autoMappings[field.name] = matchingHeader
                }
            })
            setMappings(autoMappings)

            toast.success(`Archivo cargado: ${parsed.data.length} filas`)
        } catch (error) {
            console.error('Error parsing file:', error)
            toast.error('Error al procesar el archivo')
        }
    }

    const handleImport = async () => {
        // Validate required mappings
        const missingRequired = fields
            .filter(f => f.required && !mappings[f.name])
            .map(f => f.label)

        if (missingRequired.length > 0) {
            toast.error(`Campos requeridos sin mapear: ${missingRequired.join(', ')}`)
            return
        }

        setImporting(true)

        try {
            // Transform data according to mappings (ignore _none values)
            const transformedData = data.map(row => {
                const transformed: any = preserveUnmappedColumns ? { ...row } : {}
                Object.entries(mappings).forEach(([dbField, excelColumn]) => {
                    if (excelColumn && excelColumn !== '_none') {
                        transformed[dbField] = row[excelColumn]
                    }
                })
                return transformed
            })

            const result = await onImport(transformedData)
            setResult(result)

            if (result.errors.length === 0) {
                toast.success(`${result.success} ${entityName}(s) importado(s) correctamente`)
            } else {
                toast.warning(`${result.success} importados, ${result.errors.length} errores`)
            }
        } catch (error: any) {
            console.error('Import error:', error)
            toast.error(error.message || 'Error al importar datos')
        } finally {
            setImporting(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* File Upload */}
            <Card>
                <CardHeader>
                    <CardTitle>1. Seleccionar Archivo</CardTitle>
                    <CardDescription>
                        Sube un archivo Excel (.xlsx, .xls) o CSV con tus datos
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <Label htmlFor="file-upload" className="cursor-pointer">
                            <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-accent">
                                <Upload className="h-4 w-4" />
                                <span>Seleccionar archivo</span>
                            </div>
                            <Input
                                id="file-upload"
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </Label>
                        {file && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <FileSpreadsheet className="h-4 w-4" />
                                <span>{file.name}</span>
                                <span className="text-xs">({data.length} filas)</span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Column Mapping */}
            {headers.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>2. Mapear Columnas</CardTitle>
                        <CardDescription>
                            Indica qué columna de tu Excel corresponde a cada campo
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4">
                            {fields.map(field => (
                                <div key={field.name} className="grid grid-cols-2 gap-4 items-center">
                                    <Label>
                                        {field.label} {field.required && <span className="text-red-500">*</span>}
                                    </Label>
                                    <Select
                                        value={mappings[field.name] || ''}
                                        onValueChange={(value) => setMappings({ ...mappings, [field.name]: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar columna" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="_none">-- No mapear --</SelectItem>
                                            {headers.map(header => (
                                                <SelectItem key={header} value={header}>
                                                    {header}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Preview */}
            {data.length > 0 && Object.keys(mappings).length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>3. Vista Previa</CardTitle>
                        <CardDescription>
                            Primeras 5 filas con el mapeo aplicado
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {fields.map(field => (
                                            <TableHead key={field.name}>{field.label}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.slice(0, 5).map((row, idx) => (
                                        <TableRow key={idx}>
                                            {fields.map(field => (
                                                <TableCell key={field.name}>
                                                    {mappings[field.name] ? String(row[mappings[field.name]] || '-') : '-'}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}


            {/* Import Button */}
            {data.length > 0 && (
                <div className="flex flex-col gap-4">
                    {/* Auto-mapping status */}
                    {Object.keys(mappings).length === 0 && (
                        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-md border border-yellow-200">
                            <strong>Atención:</strong> No se han detectado columnas compatibles automáticamente.
                            Por favor mapea las columnas de tu archivo (Paso 2) manualmente.
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setFile(null)
                                setData([])
                                setHeaders([])
                                setMappings({})
                                setResult(null)
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={() => {
                                if (Object.keys(mappings).length === 0) {
                                    toast.error('Debes mapear al menos una columna antes de importar')
                                    return
                                }
                                handleImport()
                            }}
                            disabled={importing}
                            size="lg"
                        >
                            {importing ? 'Importando...' : `Importar ${data.length} ${entityName}(s)`}
                        </Button>
                    </div>
                </div>
            )}

            {/* Results */}
            {result && (
                <Card>
                    <CardHeader>
                        <CardTitle>Resultado de la Importación</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle2 className="h-5 w-5" />
                                <span className="font-medium">{result.success} registros importados correctamente</span>
                            </div>

                            {result.errors.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-red-600">
                                        <XCircle className="h-5 w-5" />
                                        <span className="font-medium">{result.errors.length} errores</span>
                                    </div>
                                    <div className="max-h-40 overflow-y-auto space-y-1">
                                        {result.errors.map((error, idx) => (
                                            <div key={idx} className="text-sm text-muted-foreground">
                                                • {error}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
