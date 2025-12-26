'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { NewSubsidyApplicationDialog } from '@/components/subsidies/new-subsidy-application-dialog'

// Definición de columnas del Kanban
const KANBAN_COLUMNS = [
    { id: 'collecting_docs', label: 'Recopilando Docs', color: 'bg-gray-100', textColor: 'text-gray-700' },
    { id: 'ready_to_submit', label: 'Listo', color: 'bg-blue-100', textColor: 'text-blue-700' },
    { id: 'submitted', label: 'Presentado', color: 'bg-yellow-100', textColor: 'text-yellow-700' },
    { id: 'approved', label: 'Aprobado', color: 'bg-green-100', textColor: 'text-green-700' },
    { id: 'rejected', label: 'Rechazado', color: 'bg-red-100', textColor: 'text-red-700' },
]

export default function SubsidiesPage() {
    const [applications, setApplications] = useState<any[]>([])
    const [customers, setCustomers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Cargar datos al montar el componente
    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        await Promise.all([fetchApplications(), fetchCustomers()])
        setLoading(false)
    }

    const fetchApplications = async () => {
        try {
            const response = await fetch('/api/subsidy-applications')
            if (response.ok) {
                const data = await response.json()
                setApplications(data.applications || [])
            }
        } catch (error) {
            console.error('Error fetching applications:', error)
        }
    }

    const fetchCustomers = async () => {
        try {
            const response = await fetch('/api/customers')
            if (response.ok) {
                const data = await response.json()
                setCustomers(data.customers || [])
            }
        } catch (error) {
            console.error('Error fetching customers:', error)
        }
    }

    const getApplicationsByStatus = (status: string) => {
        return applications.filter(app => app.status === status)
    }

    const moveApplication = async (appId: string, newStatus: string) => {
        try {
            const response = await fetch(`/api/subsidy-applications/${appId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })
            if (response.ok) {
                toast.success('Estado actualizado')
                fetchApplications()
            } else {
                toast.error('Error al actualizar estado')
            }
        } catch (error) {
            toast.error('Error de conexión')
        }
    }

    const isUrgent = (deadline: string | null) => {
        if (!deadline) return false
        const daysUntil = Math.floor((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        return daysUntil <= 7 && daysUntil >= 0
    }

    if (loading) {
        return <div className="flex items-center justify-center h-64">Cargando expedientes...</div>
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tramitación de Subvenciones</h1>
                    <p className="text-muted-foreground">Gestiona los expedientes de ayudas fotovoltaicas</p>
                </div>
                <NewSubsidyApplicationDialog
                    customers={customers}
                    onSuccess={fetchApplications}
                />
            </div>

            {/* Kanban Board */}
            <div className="flex gap-4 overflow-x-auto pb-4">
                {KANBAN_COLUMNS.map(column => {
                    const columnApps = getApplicationsByStatus(column.id)

                    return (
                        <div key={column.id} className="flex-shrink-0 w-80">
                            <div className={`${column.color} ${column.textColor} p-3 rounded-t-lg font-semibold flex items-center justify-between`}>
                                <span>{column.label}</span>
                                <span className="bg-white/50 px-2 py-0.5 rounded text-xs">{columnApps.length}</span>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-b-lg min-h-[500px] space-y-3">
                                {columnApps.map(app => {
                                    const urgent = isUrgent(app.submission_deadline)
                                    const docsProgress = app.required_docs
                                        ? app.required_docs.filter((d: any) => d.uploaded).length / app.required_docs.length * 100
                                        : 0

                                    return (
                                        <Card key={app.id} className={`cursor-pointer hover:shadow-md transition ${urgent ? 'border-red-500 border-2' : ''}`}>
                                            <CardHeader className="p-4 pb-2">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <CardTitle className="text-sm">{app.customers?.full_name || 'Cliente Desconocido'}</CardTitle>
                                                        <CardDescription className="text-xs mt-1">
                                                            {app.application_number}
                                                        </CardDescription>
                                                    </div>
                                                    {urgent && (
                                                        <AlertCircle className="h-4 w-4 text-red-500" />
                                                    )}
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-4 pt-0 space-y-2">
                                                <div className="text-xs text-muted-foreground">
                                                    {app.region} • {app.subsidy_type}
                                                </div>

                                                {app.estimated_amount && (
                                                    <div className="text-sm font-semibold text-green-600">
                                                        {app.estimated_amount.toLocaleString()}€
                                                    </div>
                                                )}

                                                {/* Progress Bar de Documentos */}
                                                {app.required_docs && app.required_docs.length > 0 && (
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between text-xs">
                                                            <span>Documentos</span>
                                                            <span>{Math.round(docsProgress)}%</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                            <div
                                                                className="bg-blue-600 h-1.5 rounded-full transition-all"
                                                                style={{ width: `${docsProgress}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {app.submission_deadline && (
                                                    <div className={`text-xs ${urgent ? 'text-red-600 font-semibold' : 'text-muted-foreground'}`}>
                                                        Límite: {new Date(app.submission_deadline).toLocaleDateString()}
                                                    </div>
                                                )}

                                                {/* Acciones rápidas */}
                                                <div className="flex gap-1 pt-2">
                                                    {column.id !== 'approved' && column.id !== 'rejected' && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-xs h-7"
                                                            onClick={() => {
                                                                const nextStatusIndex = KANBAN_COLUMNS.findIndex(c => c.id === column.id) + 1
                                                                if (nextStatusIndex < KANBAN_COLUMNS.length) {
                                                                    moveApplication(app.id, KANBAN_COLUMNS[nextStatusIndex].id)
                                                                }
                                                            }}
                                                        >
                                                            Avanzar →
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )
                                })}

                                {columnApps.length === 0 && (
                                    <div className="text-center text-muted-foreground text-sm py-8">
                                        Sin expedientes
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{applications.length}</div>
                        <p className="text-xs text-muted-foreground">Total Expedientes</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-yellow-600">
                            {applications.filter(a => isUrgent(a.submission_deadline)).length}
                        </div>
                        <p className="text-xs text-muted-foreground">Urgentes (&lt; 7 días)</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-green-600">
                            {applications.filter(a => a.status === 'approved').length}
                        </div>
                        <p className="text-xs text-muted-foreground">Aprobados</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-blue-600">
                            {applications.reduce((sum, a) => sum + (a.estimated_amount || 0), 0).toLocaleString()}€
                        </div>
                        <p className="text-xs text-muted-foreground">Total Estimado</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
