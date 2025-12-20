'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FileSpreadsheet, Users, FolderKanban, Calculator, Info, ShoppingCart, Calendar, Package } from 'lucide-react'
import { ImportWizard } from './import-wizard'
import { useRouter } from 'next/navigation'

export function UnifiedImportPage() {
    const router = useRouter()
    const [entityType, setEntityType] = useState<'customers' | 'projects' | 'calculations' | 'sales' | 'visitas' | 'stock' | ''>('')

    const handleImportComplete = () => {
        // Redirect to the appropriate page after import
        switch (entityType) {
            case 'customers':
                router.push('/dashboard/customers')
                break
            case 'projects':
                router.push('/dashboard/projects')
                break
            case 'calculations':
                router.push('/dashboard/calculator')
                break
            case 'sales':
                router.push('/dashboard/sales')
                break
            case 'visitas':
                router.push('/dashboard/calendar')
                break
            case 'stock':
                router.push('/dashboard/stock')
                break
        }
    }

    return (
        <div className="space-y-6">
            {/* Entity Type Selector */}
            <Card>
                <CardHeader>
                    <CardTitle>¿Qué tipo de datos deseas importar?</CardTitle>
                    <CardDescription>
                        Selecciona el tipo de información que contiene tu archivo
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                            onClick={() => setEntityType('customers')}
                            className={`p-6 border-2 rounded-lg text-left transition-all hover:border-cyan-500 ${entityType === 'customers'
                                ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950'
                                : 'border-gray-200'
                                }`}
                        >
                            <Users className={`h-8 w-8 mb-3 ${entityType === 'customers' ? 'text-cyan-600' : 'text-muted-foreground'
                                }`} />
                            <div className="font-semibold mb-1">Clientes</div>
                            <div className="text-sm text-muted-foreground">
                                Importar lista de clientes con sus datos de contacto
                            </div>
                        </button>

                        <button
                            onClick={() => setEntityType('projects')}
                            className={`p-6 border-2 rounded-lg text-left transition-all hover:border-cyan-500 ${entityType === 'projects'
                                ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950'
                                : 'border-gray-200'
                                }`}
                        >
                            <FolderKanban className={`h-8 w-8 mb-3 ${entityType === 'projects' ? 'text-cyan-600' : 'text-muted-foreground'
                                }`} />
                            <div className="font-semibold mb-1">Proyectos</div>
                            <div className="text-sm text-muted-foreground">
                                Importar proyectos de instalaciones solares
                            </div>
                        </button>

                        <button
                            onClick={() => setEntityType('calculations')}
                            className={`p-6 border-2 rounded-lg text-left transition-all hover:border-cyan-500 ${entityType === 'calculations'
                                ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950'
                                : 'border-gray-200'
                                }`}
                        >
                            <Calculator className={`h-8 w-8 mb-3 ${entityType === 'calculations' ? 'text-cyan-600' : 'text-muted-foreground'
                                }`} />
                            <div className="font-semibold mb-1">Cálculos</div>
                            <div className="text-sm text-muted-foreground">
                                Importar cálculos solares y estimaciones
                            </div>
                        </button>

                        <button
                            onClick={() => setEntityType('sales')}
                            className={`p-6 border-2 rounded-lg text-left transition-all hover:border-cyan-500 ${entityType === 'sales'
                                ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950'
                                : 'border-gray-200'
                                }`}
                        >
                            <ShoppingCart className={`h-8 w-8 mb-3 ${entityType === 'sales' ? 'text-cyan-600' : 'text-muted-foreground'
                                }`} />
                            <div className="font-semibold mb-1">Ventas</div>
                            <div className="text-sm text-muted-foreground">
                                Importar ventas históricas con importes y estados
                            </div>
                        </button>

                        <button
                            onClick={() => setEntityType('visitas')}
                            className={`p-6 border-2 rounded-lg text-left transition-all hover:border-cyan-500 ${entityType === 'visitas'
                                ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950'
                                : 'border-gray-200'
                                }`}
                        >
                            <Calendar className={`h-8 w-8 mb-3 ${entityType === 'visitas' ? 'text-cyan-600' : 'text-muted-foreground'
                                }`} />
                            <div className="font-semibold mb-1">Visitas</div>
                            <div className="text-sm text-muted-foreground">
                                Importar agenda de visitas y citas comerciales
                            </div>
                        </button>

                        <button
                            onClick={() => setEntityType('stock')}
                            className={`p-6 border-2 rounded-lg text-left transition-all hover:border-cyan-500 ${entityType === 'stock'
                                ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950'
                                : 'border-gray-200'
                                }`}
                        >
                            <Package className={`h-8 w-8 mb-3 ${entityType === 'stock' ? 'text-cyan-600' : 'text-muted-foreground'
                                }`} />
                            <div className="font-semibold mb-1">Stock</div>
                            <div className="text-sm text-muted-foreground">
                                Importar inventario de productos y materiales
                            </div>
                        </button>
                    </div>
                </CardContent>
            </Card>

            {/* Info Alert */}
            {entityType && (
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                        <div className="space-y-2">
                            <div className="font-semibold">Sistema de Importación Inteligente</div>
                            <ul className="text-sm space-y-1 ml-4">
                                <li>? <strong>Mapeo automático:</strong> Detectamos las columnas de tu archivo automáticamente</li>
                                <li>? <strong>Campos personalizados:</strong> Los datos que no encajan en campos estándar se guardan como campos personalizados</li>
                                <li>? <strong>Validación:</strong> Verificamos emails, teléfonos, NIFs y otros datos antes de importar</li>
                                <li>? <strong>Plantillas:</strong> Guarda el mapeo para reutilizarlo en futuras importaciones</li>
                            </ul>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {/* Csv Importer Integration */}
            {entityType && (
                <ImportArea entityType={entityType} onComplete={handleImportComplete} />
            )}

            {/* Help Section */}
            {!entityType && (
                <Card>
                    <CardHeader>
                        <CardTitle>¿Necesitas ayuda?</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <div className="font-semibold mb-2">Formatos soportados</div>
                            <div className="text-sm text-muted-foreground">
                                • CSV (.csv)
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

import { CsvImporter } from '@/components/shared/csv-importer'

function ImportArea({ entityType, onComplete }: { entityType: string, onComplete: () => void }) {
    // Define schemas for each type
    const schemas: Record<string, { tableName: string, options: { label: string, value: string, required?: boolean }[] }> = {
        'customers': {
            tableName: 'customers',
            options: [
                { label: 'Nombre Completo', value: 'full_name', required: true },
                { label: 'DNI / NIF', value: 'dni', required: true },
                { label: 'Email', value: 'email' },
                { label: 'Teléfono', value: 'phone' },
                { label: 'Dirección', value: 'address' },
                { label: 'Ciudad', value: 'city' }
            ]
        },
        'projects': {
            tableName: 'projects',
            options: [
                { label: 'Nombre Proyecto', value: 'name', required: true },
                { label: 'Código', value: 'code' },
                { label: 'Dirección', value: 'address' },
                { label: 'Estado', value: 'status' }
            ]
        },
        'sales': {
            tableName: 'sales',
            options: [
                { label: 'Número Venta', value: 'sale_number', required: true },
                { label: 'Importe', value: 'amount', required: true },
                { label: 'Nombre Cliente', value: 'customer_name' },
                { label: 'Fecha', value: 'sale_date' }
            ]
        },
        'visitas': {
            tableName: 'appointments',
            options: [
                { label: 'Título / Asunto', value: 'title', required: true },
                { label: 'Fecha Inicio', value: 'start_time', required: true },
                { label: 'Fecha Fin', value: 'end_time' },
                { label: 'Dirección', value: 'address' },
                { label: 'Estado', value: 'status' }
            ]
        }
    }

    const config = schemas[entityType]

    if (!config) {
        return (
            <Alert variant="destructive">
                <Info className="h-4 w-4" />
                <AlertDescription>
                    Importación no disponible para {entityType} en este momento.
                </AlertDescription>
            </Alert>
        )
    }

    return (
        <CsvImporter
            tableName={config.tableName}
            columnOptions={config.options}
            onSuccess={onComplete}
        />
    )
}
