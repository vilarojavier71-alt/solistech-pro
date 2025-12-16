'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

import { Sale, SaleDocument } from '@/types/portal'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
    FileText,
    Upload,
    Trash2,
    CheckCircle2,
    XCircle,
    Download,
    Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface DocumentsManagerProps {
    sale: Sale
    isClientView?: boolean
}

export function DocumentsManager({ sale, isClientView = false }: DocumentsManagerProps) {
    const [documents, setDocuments] = useState<SaleDocument[]>([])
    const [uploading, setUploading] = useState(false)
    const [selectedType, setSelectedType] = useState<string>('other')
    const supabase = createClient()

    useEffect(() => {
        loadDocuments()
    }, [])

    const loadDocuments = async () => {
        const { data } = await supabase
            .from('sale_documents')
            .select('*')
            .eq('sale_id', sale.id)
            .order('uploaded_at', { ascending: false })

        if (data) setDocuments(data)
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return

        const file = e.target.files[0]
        setUploading(true)

        try {
            // 1. Upload to Storage
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(7)}.${fileExt}`
            const filePath = `${sale.organization_id}/${sale.id}/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('sale_documents')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            // 2. Register in DB
            const { error: dbError } = await supabase
                .from('sale_documents')
                .insert({
                    sale_id: sale.id,
                    document_type: selectedType,
                    file_name: file.name,
                    file_size: file.size,
                    mime_type: file.type,
                    storage_url: filePath,
                    uploaded_by: isClientView ? 'client' : 'staff', // TODO: Get user ID if staff
                    status: 'pending'
                })

            if (dbError) throw dbError

            toast.success('Documento subido correctamente')
            loadDocuments()
        } catch (error) {
            console.error('Upload error:', error)
            toast.error('Error al subir el documento')
        } finally {
            setUploading(false)
        }
    }

    const handleDownload = async (doc: SaleDocument) => {
        try {
            const { data, error } = await supabase.storage
                .from('sale_documents')
                .createSignedUrl(doc.storage_url, 60) // 60 seconds validity

            if (error) throw error
            if (data?.signedUrl) window.open(data.signedUrl, '_blank')

        } catch (error) {
            console.error('Download error:', error)
            toast.error('Error al descargar')
        }
    }

    const handleValidate = async (docId: string, status: 'validated' | 'rejected') => {
        try {
            const { error } = await supabase
                .from('sale_documents')
                .update({ status, validated_at: new Date().toISOString() })
                .eq('id', docId)

            if (error) throw error

            toast.success(`Documento ${status === 'validated' ? 'validado' : 'rechazado'}`)
            loadDocuments()
        } catch (error) {
            toast.error('Error al actualizar estado')
        }
    }

    return (
        <div className="space-y-6">
            {/* Upload Area */}
            <div className="flex flex-col sm:flex-row gap-4 items-end bg-slate-50 p-4 rounded-lg border border-dashed border-slate-300">
                <div className="grid w-full max-w-xs items-center gap-1.5">
                    <Label htmlFor="doc-type">Tipo de Documento</Label>
                    <Select value={selectedType} onValueChange={setSelectedType}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="dni">DNI / NIE</SelectItem>
                            <SelectItem value="factura_electrica">Factura Eléctrica</SelectItem>
                            <SelectItem value="catastro">Referencia Catastral</SelectItem>
                            <SelectItem value="escrituras">Escrituras / Nota Simple</SelectItem>
                            <SelectItem value="instalaciones">Cert. Instalaciones (CIE)</SelectItem>
                            <SelectItem value="other">Otros</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid w-full max-w-xs items-center gap-1.5">
                    <Label htmlFor="file">Archivo</Label>
                    <Input id="file" type="file" onChange={handleFileUpload} disabled={uploading} />
                </div>

                {uploading && <Loader2 className="h-6 w-6 animate-spin text-sky-600 mb-2" />}
            </div>

            {/* Documents List */}
            <div className="grid gap-3">
                <h3 className="font-semibold text-lg text-slate-800">Documentos del Expediente</h3>
                {documents.length === 0 ? (
                    <p className="text-muted-foreground italic text-sm">No hay documentos subidos aún.</p>
                ) : (
                    documents.map((doc) => (
                        <Card key={doc.id} className="overflow-hidden">
                            <CardContent className="p-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-sky-50 rounded text-sky-600">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">{doc.file_name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <Badge variant="secondary" className="text-xs font-normal">
                                                {doc.document_type.replace('_', ' ')}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                Subido el {new Date(doc.uploaded_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Status Badge */}
                                    {doc.status === 'validated' && <Badge className="bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" /> OK</Badge>}
                                    {doc.status === 'rejected' && <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rechazado</Badge>}

                                    {/* Actions */}
                                    <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                                        <Download className="h-4 w-4" />
                                    </Button>

                                    {/* Staff Validation Actions */}
                                    {!isClientView && doc.status === 'pending' && (
                                        <>
                                            <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleValidate(doc.id, 'validated')}>
                                                <CheckCircle2 className="h-4 w-4" />
                                            </Button>
                                            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleValidate(doc.id, 'rejected')}>
                                                <XCircle className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
