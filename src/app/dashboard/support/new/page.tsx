'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Loader2, Send, Headphones } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { createTicket } from '@/lib/actions/support-tickets'

const CATEGORIES = [
    { value: 'general', label: 'Consulta General', icon: '💬' },
    { value: 'tecnico', label: 'Problema Técnico', icon: '🔧' },
    { value: 'facturacion', label: 'Facturación', icon: '💳' },
    { value: 'solar', label: 'Instalación Solar', icon: '☀️' },
]

const PRIORITIES = [
    { value: 'low', label: 'Baja', description: 'No es urgente' },
    { value: 'normal', label: 'Normal', description: 'Respuesta en 24h' },
    { value: 'high', label: 'Alta', description: 'Necesito respuesta pronto' },
    { value: 'urgent', label: 'Urgente', description: 'Bloquea mi trabajo' },
]

export default function NewTicketPage() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        subject: '',
        description: '',
        category: 'general',
        priority: 'normal',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.subject.trim()) {
            toast.error('El asunto es obligatorio')
            return
        }
        if (!formData.description.trim()) {
            toast.error('La descripción es obligatoria')
            return
        }

        setIsSubmitting(true)

        try {
            const result = await createTicket({
                subject: formData.subject,
                description: formData.description,
                category: formData.category as 'general' | 'tecnico' | 'facturacion' | 'solar' | 'import_incident',
                priority: formData.priority as 'low' | 'normal' | 'high' | 'urgent',
            })

            if (result.success) {
                toast.success('Ticket creado correctamente')
                router.push('/dashboard/support')
            } else {
                toast.error(result.error || 'Error al crear el ticket')
            }
        } catch (error) {
            toast.error('Error de conexión')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="container mx-auto py-6 max-w-2xl">
            {/* Header */}
            <div className="mb-6">
                <Link
                    href="/dashboard/support"
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a Soporte
                </Link>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Headphones className="h-7 w-7 text-primary" />
                    Nuevo Ticket de Soporte
                </h1>
                <p className="text-muted-foreground mt-1">
                    Describe tu problema o consulta y te responderemos lo antes posible
                </p>
            </div>

            {/* Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Información del Ticket</CardTitle>
                    <CardDescription>
                        Cuantos más detalles proporciones, más rápido podremos ayudarte
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Category */}
                        <div className="space-y-2">
                            <Label htmlFor="category">Categoría</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                            >
                                <SelectTrigger id="category">
                                    <SelectValue placeholder="Selecciona categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map((cat) => (
                                        <SelectItem key={cat.value} value={cat.value}>
                                            <span className="flex items-center gap-2">
                                                <span>{cat.icon}</span>
                                                <span>{cat.label}</span>
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Subject */}
                        <div className="space-y-2">
                            <Label htmlFor="subject">Asunto *</Label>
                            <Input
                                id="subject"
                                placeholder="Resumen breve del problema"
                                value={formData.subject}
                                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                                maxLength={100}
                            />
                            <p className="text-xs text-muted-foreground text-right">
                                {formData.subject.length}/100
                            </p>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Descripción *</Label>
                            <Textarea
                                id="description"
                                placeholder="Describe el problema con detalle. Incluye pasos para reproducirlo si es un error técnico."
                                rows={6}
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            />
                        </div>

                        {/* Priority */}
                        <div className="space-y-2">
                            <Label htmlFor="priority">Prioridad</Label>
                            <Select
                                value={formData.priority}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                            >
                                <SelectTrigger id="priority">
                                    <SelectValue placeholder="Selecciona prioridad" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PRIORITIES.map((pri) => (
                                        <SelectItem key={pri.value} value={pri.value}>
                                            <span className="flex flex-col">
                                                <span className="font-medium">{pri.label}</span>
                                                <span className="text-xs text-muted-foreground">{pri.description}</span>
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Submit */}
                        <div className="flex justify-end gap-3 pt-4">
                            <Link href="/dashboard/support">
                                <Button type="button" variant="outline">
                                    Cancelar
                                </Button>
                            </Link>
                            <Button type="submit" disabled={isSubmitting} className="gap-2">
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4" />
                                        Enviar Ticket
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Help Text */}
            <p className="text-sm text-muted-foreground text-center mt-6">
                Te responderemos en un plazo máximo de 24-48 horas laborables.
                Para urgencias, contacta por teléfono.
            </p>
        </div>
    )
}
