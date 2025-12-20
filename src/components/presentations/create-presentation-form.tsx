'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Upload, FileText, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Customer {
    id: string
    full_name: string
    email: string
}

interface Project {
    id: string
    name: string
}

export function CreatePresentationForm({ customers, projects }: { customers: Customer[], projects: Project[] }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [customerId, setCustomerId] = useState('')
    const [projectId, setProjectId] = useState('')
    const [fiscalType, setFiscalType] = useState<'20' | '40' | '60'>('40')
    const [photoFile, setPhotoFile] = useState<File | null>(null)
    const [photoPreview, setPhotoPreview] = useState<string>('')

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setPhotoFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!customerId || !projectId) {
            toast.error('Selecciona un cliente y proyecto')
            return
        }

        if (!photoFile) {
            toast.error('Sube una foto de la instalación')
            return
        }

        setLoading(true)

        try {
            // 1. Subir foto a Supabase Storage
            const formData = new FormData()
            formData.append('file', photoFile)
            formData.append('customerId', customerId)
            formData.append('projectId', projectId)
            formData.append('fiscalType', fiscalType)

            const response = await fetch('/api/presentations/create', {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                throw new Error('Error al crear presentación')
            }

            const result = await response.json()

            toast.success('✅ Presentación generada correctamente')
            router.push(`/dashboard/presentations/${result.id}`)
        } catch (error: any) {
            toast.error(error.message || 'Error al generar presentación')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    Asegúrate de tener configurada tu API key de IA en <strong>Settings → Integraciones</strong> para generar la simulación visual.
                </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="customer">Cliente</Label>
                    <Select value={customerId} onValueChange={setCustomerId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona un cliente" />
                        </SelectTrigger>
                        <SelectContent>
                            {customers.map((customer) => (
                                <SelectItem key={customer.id} value={customer.id}>
                                    {customer.full_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="project">Proyecto</Label>
                    <Select value={projectId} onValueChange={setProjectId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona un proyecto" />
                        </SelectTrigger>
                        <SelectContent>
                            {projects.map((project) => (
                                <SelectItem key={project.id} value={project.id}>
                                    {project.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="fiscalType">Tipo de Deducción Fiscal IRPF</Label>
                <Select value={fiscalType} onValueChange={(value: any) => setFiscalType(value)}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="20">20% - Reducción demanda ≥7% (max. 5.000€)</SelectItem>
                        <SelectItem value="40">40% - Reducción consumo ≥30% (max. 7.500€)</SelectItem>
                        <SelectItem value="60">60% - Rehabilitación integral (max. 15.000€)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="photo">Foto de la Instalación / Tejado</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    {photoPreview ? (
                        <div className="space-y-4">
                            <img
                                src={photoPreview}
                                alt="Preview"
                                className="max-h-64 mx-auto rounded"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setPhotoFile(null)
                                    setPhotoPreview('')
                                }}
                            >
                                Cambiar foto
                            </Button>
                        </div>
                    ) : (
                        <div>
                            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <Label htmlFor="photo" className="cursor-pointer">
                                <span className="text-blue-600 hover:underline">Haz clic para subir</span>
                                {' '}o arrastra una imagen
                            </Label>
                            <Input
                                id="photo"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handlePhotoChange}
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                                JPG, PNG o WEBP (max. 10MB)
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full" size="lg">
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generando presentación con IA...
                    </>
                ) : (
                    <>
                        <FileText className="mr-2 h-4 w-4" />
                        Generar Presentación PowerPoint
                    </>
                )}
            </Button>

            {loading && (
                <Alert>
                    <AlertDescription>
                        Esto puede tardar 30-60 segundos. Estamos generando la imagen con IA y creando el PowerPoint personalizado.
                    </AlertDescription>
                </Alert>
            )}
        </form>
    )
}
