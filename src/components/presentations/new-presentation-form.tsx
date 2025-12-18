'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Loader2, Sparkles, Upload, FileText, Users } from 'lucide-react'
import { toast } from 'sonner'
import { createPresentation } from '@/lib/actions/presentation-generator'
import { useRouter } from 'next/navigation'


interface Customer {
    id: string
    name: string
    email: string | null
}

interface NewPresentationFormProps {
    customers: Customer[]
}

export function NewPresentationForm({ customers }: NewPresentationFormProps) {
    const router = useRouter()

    const [isGenerating, setIsGenerating] = useState(false)
    const [selectedCustomer, setSelectedCustomer] = useState('')
    const [selectedProject, setSelectedProject] = useState('')
    const [selectedCalculation, setSelectedCalculation] = useState('')
    const [photo, setPhoto] = useState<File | null>(null)
    const [photoPreview, setPhotoPreview] = useState<string | null>(null)

    const [projects, setProjects] = useState<any[]>([])
    const [calculations, setCalculations] = useState<any[]>([])
    const [loadingProjects, setLoadingProjects] = useState(false)
    const [loadingCalculations, setLoadingCalculations] = useState(false)

    // Cargar proyectos cuando se selecciona un cliente
    useEffect(() => {
        if (!selectedCustomer) {
            setProjects([])
            setSelectedProject('')
            return
        }

        const fetchProjects = async () => {
            setLoadingProjects(true)
            // TODO: Replace with server action
            console.log('[NewPresentationForm] TODO: Fetch projects for customer', selectedCustomer)
            setProjects([])
            setLoadingProjects(false)
        }

        fetchProjects()
    }, [selectedCustomer])

    // Cargar cálculos cuando se selecciona un proyecto
    useEffect(() => {
        if (!selectedProject) {
            setCalculations([])
            setSelectedCalculation('')
            return
        }

        const fetchCalculations = async () => {
            setLoadingCalculations(true)
            // TODO: Replace with server action
            console.log('[NewPresentationForm] TODO: Fetch calculations for project', selectedProject)
            setCalculations([])
            setLoadingCalculations(false)
        }

        fetchCalculations()
    }, [selectedProject])

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setPhoto(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleGenerate = async () => {
        if (!selectedCustomer || !selectedProject || !selectedCalculation) {
            toast.error('Por favor, selecciona cliente, proyecto y cálculo')
            return
        }

        setIsGenerating(true)

        try {
            // TODO: Implement photo upload via server action
            let photoUrl = undefined
            if (photo) {
                console.log('[NewPresentationForm] TODO: Upload photo via server action', photo.name)
                // For now, skip photo upload
            }

            // Generar presentación
            const result = await createPresentation(
                selectedCustomer,
                selectedProject,
                selectedCalculation,
                photoUrl
            )

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('✅ Presentación generada con éxito')
                if (result.hasSimulatedImage) {
                    toast.success('🎨 Imagen simulada con IA incluida')
                }
                router.push('/dashboard/presentations')
            }
        } catch (error: any) {
            toast.error('Error al generar la presentación')
            console.error(error)
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Configuración de la Presentación</CardTitle>
                <CardDescription>
                    Selecciona el cliente, proyecto y cálculo para generar la presentación
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Selector de Cliente */}
                <div className="space-y-2">
                    <Label htmlFor="customer">Cliente</Label>
                    <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                        <SelectTrigger id="customer">
                            <SelectValue placeholder="Selecciona un cliente" />
                        </SelectTrigger>
                        <SelectContent>
                            {customers.length === 0 ? (
                                <div className="p-6 text-center space-y-3">
                                    <div className="flex justify-center">
                                        <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                            <Users className="h-6 w-6 text-slate-400" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                            No hay clientes disponibles
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Crea tu primer cliente para empezar
                                        </p>
                                    </div>
                                    <a
                                        href="/dashboard/customers"
                                        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                                    >
                                        <Users className="h-4 w-4" />
                                        Crear cliente ahora
                                    </a>
                                </div>
                            ) : (
                                customers.map((customer) => (
                                    <SelectItem key={customer.id} value={customer.id}>
                                        {customer.name}
                                        {customer.email && (
                                            <span className="text-xs text-muted-foreground ml-2">
                                                ({customer.email})
                                            </span>
                                        )}
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                </div>

                {/* Selector de Proyecto */}
                <div className="space-y-2">
                    <Label htmlFor="project">Proyecto</Label>
                    <Select
                        value={selectedProject}
                        onValueChange={setSelectedProject}
                        disabled={!selectedCustomer || loadingProjects}
                    >
                        <SelectTrigger id="project">
                            <SelectValue placeholder={
                                loadingProjects ? 'Cargando proyectos...' :
                                    !selectedCustomer ? 'Primero selecciona un cliente' :
                                        'Selecciona un proyecto'
                            } />
                        </SelectTrigger>
                        <SelectContent>
                            {projects.length === 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    No hay proyectos para este cliente
                                </div>
                            ) : (
                                projects.map((project) => (
                                    <SelectItem key={project.id} value={project.id}>
                                        {project.name}
                                        <span className="text-xs text-muted-foreground ml-2">
                                            ({project.status})
                                        </span>
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                </div>

                {/* Selector de Cálculo */}
                <div className="space-y-2">
                    <Label htmlFor="calculation">Cálculo Solar</Label>
                    <Select
                        value={selectedCalculation}
                        onValueChange={setSelectedCalculation}
                        disabled={!selectedProject || loadingCalculations}
                    >
                        <SelectTrigger id="calculation">
                            <SelectValue placeholder={
                                loadingCalculations ? 'Cargando cálculos...' :
                                    !selectedProject ? 'Primero selecciona un proyecto' :
                                        'Selecciona un cálculo'
                            } />
                        </SelectTrigger>
                        <SelectContent>
                            {calculations.length === 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    No hay cálculos para este proyecto
                                </div>
                            ) : (
                                calculations.map((calc) => (
                                    <SelectItem key={calc.id} value={calc.id}>
                                        <div className="flex flex-col">
                                            <span>
                                                {calc.system_size_kwp} kWp - {calc.estimated_production_kwh?.toLocaleString()} kWh/año
                                            </span>
                                            {calc.net_cost && (
                                                <span className="text-xs text-green-600">
                                                    Coste neto: {calc.net_cost.toLocaleString()}€ (con ayudas)
                                                </span>
                                            )}
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(calc.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                </div>

                {/* Upload de Foto */}
                <div className="space-y-2">
                    <Label htmlFor="photo">Foto del Tejado (opcional)</Label>
                    <div className="flex flex-col gap-4">
                        <Input
                            id="photo"
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            className="cursor-pointer"
                        />
                        {photoPreview && (
                            <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                                <img
                                    src={photoPreview}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        Si subes foto y tienes API configurada, la IA generará una simulación con placas solares
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                        💡 Puedes generar presentaciones sin foto ni API - incluirán todos los datos técnicos y fiscales
                    </p>
                </div>

                {/* Información */}
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="text-sm text-blue-900 dark:text-blue-100">
                            <p className="font-medium mb-1">¿Qué incluye la presentación?</p>
                            <ul className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
                                <li>• Datos técnicos del sistema solar</li>
                                <li>• Producción estimada mensual</li>
                                <li>• Ahorro económico detallado</li>
                                <li>• Deducciones fiscales (IRPF, IBI, ICIO)</li>
                                <li>• Simulación visual con IA (si subes foto)</li>
                                <li>• Presupuesto con coste neto final</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Botón Generar */}
                <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || !selectedCalculation}
                    className="w-full"
                    size="lg"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generando presentación...
                        </>
                    ) : (
                        <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generar Presentación con IA
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    )
}
