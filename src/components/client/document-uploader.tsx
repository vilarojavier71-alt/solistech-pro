'use client'

import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
    Upload,
    CheckCircle2,
    XCircle,
    Clock,
    FileText,
    AlertTriangle,
    Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { mapDocumentStatusToUI, getRequiredDocumentTypes } from '@/lib/utils/solar-status-mapper'

interface DocumentItem {
    id: string
    type: string
    status: 'PENDING' | 'UPLOADED' | 'REJECTED' | 'APPROVED'
    url?: string
    fileName?: string
    rejectionReason?: string
    uploadedAt?: Date
}

interface DocumentUploaderProps {
    projectId: string
    documents: DocumentItem[]
    onUpload: (type: string, file: File) => Promise<void>
    onReupload?: (documentId: string, file: File) => Promise<void>
    disabled?: boolean
}

export function DocumentUploader({
    projectId,
    documents,
    onUpload,
    onReupload,
    disabled = false
}: DocumentUploaderProps) {
    const [uploading, setUploading] = useState<string | null>(null)
    const requiredDocs = getRequiredDocumentTypes()

    const getDocumentByType = (type: string) => {
        return documents.find(d => d.type === type)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Documentación Requerida
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {requiredDocs.map((docType) => {
                    const doc = getDocumentByType(docType.type)
                    return (
                        <DocumentRow
                            key={docType.type}
                            type={docType.type}
                            label={docType.label}
                            description={docType.description}
                            required={docType.required}
                            document={doc}
                            isUploading={uploading === docType.type}
                            disabled={disabled}
                            onUpload={async (file) => {
                                setUploading(docType.type)
                                try {
                                    if (doc && doc.status === 'REJECTED' && onReupload) {
                                        await onReupload(doc.id, file)
                                    } else {
                                        await onUpload(docType.type, file)
                                    }
                                } finally {
                                    setUploading(null)
                                }
                            }}
                        />
                    )
                })}
            </CardContent>
        </Card>
    )
}

interface DocumentRowProps {
    type: string
    label: string
    description: string
    required: boolean
    document?: DocumentItem
    isUploading: boolean
    disabled: boolean
    onUpload: (file: File) => Promise<void>
}

function DocumentRow({
    type,
    label,
    description,
    required,
    document,
    isUploading,
    disabled,
    onUpload
}: DocumentRowProps) {
    const status = document?.status || 'PENDING'
    const uiStatus = mapDocumentStatusToUI(status)

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: async (files) => {
            if (files[0]) {
                await onUpload(files[0])
            }
        },
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg'],
            'application/pdf': ['.pdf'],
        },
        maxFiles: 1,
        disabled: disabled || isUploading || status === 'APPROVED',
    })

    // Estado REJECTED - Mostrar alerta roja
    if (status === 'REJECTED') {
        return (
            <div className="space-y-2">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="flex items-center gap-2">
                        {label}
                        <Badge variant="destructive">Rechazado</Badge>
                    </AlertTitle>
                    <AlertDescription className="mt-2">
                        <p className="font-medium text-red-700 dark:text-red-300">
                            {document?.rejectionReason || 'Este documento necesita ser corregido'}
                        </p>
                    </AlertDescription>
                </Alert>
                <div
                    {...getRootProps()}
                    className={cn(
                        "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
                        "border-red-300 bg-red-50 hover:bg-red-100",
                        "dark:border-red-800 dark:bg-red-950/30 dark:hover:bg-red-950/50"
                    )}
                >
                    <input {...getInputProps()} />
                    {isUploading ? (
                        <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Subiendo corrección...</span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400">
                            <Upload className="w-4 h-4" />
                            <span className="font-medium">Subir Corrección</span>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // Estado APPROVED - Mostrar check verde
    if (status === 'APPROVED') {
        return (
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <div>
                        <p className="font-medium text-green-800 dark:text-green-200">{label}</p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                            {document?.fileName || 'Documento aprobado'}
                        </p>
                    </div>
                </div>
                <Badge className="bg-green-500">✓ Aprobado</Badge>
            </div>
        )
    }

    // Estado UPLOADED - Pendiente de revisión
    if (status === 'UPLOADED') {
        return (
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-600 animate-pulse" />
                    <div>
                        <p className="font-medium text-blue-800 dark:text-blue-200">{label}</p>
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                            {document?.fileName || 'Pendiente de revisión'}
                        </p>
                    </div>
                </div>
                <Badge variant="secondary">En revisión</Badge>
            </div>
        )
    }

    // Estado PENDING - Dropzone para subir
    return (
        <div
            {...getRootProps()}
            className={cn(
                "border-2 border-dashed rounded-lg p-4 transition-colors cursor-pointer",
                isDragActive
                    ? "border-primary bg-primary/10"
                    : "border-muted-foreground/25 hover:border-primary/50",
                disabled && "opacity-50 cursor-not-allowed"
            )}
        >
            <input {...getInputProps()} />
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    {isUploading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    ) : (
                        <Upload className="w-5 h-5 text-muted-foreground" />
                    )}
                </div>
                <div className="flex-1">
                    <p className="font-medium">
                        {label}
                        {required && <span className="text-red-500 ml-1">*</span>}
                    </p>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <Button variant="outline" size="sm" disabled={disabled || isUploading}>
                    {isUploading ? 'Subiendo...' : 'Subir'}
                </Button>
            </div>
        </div>
    )
}
