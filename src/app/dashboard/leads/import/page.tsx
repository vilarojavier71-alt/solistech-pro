'use client'

import { ExcelImporter } from '@/components/import/excel-importer'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

const LEAD_FIELDS = [
    { name: 'name', label: 'Nombre', required: true },
    { name: 'email', label: 'Email', required: false },
    { name: 'phone', label: 'Teléfono', required: false },
    { name: 'company', label: 'Empresa', required: false },
    { name: 'source', label: 'Origen', required: false },
    { name: 'status', label: 'Estado', required: false },
    { name: 'estimated_value', label: 'Valor Estimado', required: false },
    { name: 'notes', label: 'Notas', required: false },
]

export default function ImportLeadsPage() {
    const router = useRouter()

    // STUB: leads table doesn't exist in Prisma schema
    const handleImport = async (data: any[]) => {
        return {
            success: 0,
            errors: ['Leads no disponible - tabla pendiente de migración a Prisma']
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push('/dashboard/leads')}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Importar Leads</h1>
                    <p className="text-muted-foreground">
                        Importa múltiples leads desde un archivo Excel o CSV
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Instrucciones</CardTitle>
                    <CardDescription>
                        Prepara tu archivo Excel con las siguientes columnas (solo "Nombre" es obligatorio):
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        <li><strong>Nombre</strong> (requerido): Nombre del contacto</li>
                        <li><strong>Email</strong>: Dirección de correo electrónico</li>
                        <li><strong>Teléfono</strong>: Número de teléfono</li>
                        <li><strong>Empresa</strong>: Nombre de la empresa</li>
                        <li><strong>Origen</strong>: web, referral, cold_call, social_media, other</li>
                        <li><strong>Estado</strong>: new, contacted, qualified, proposal, won, lost</li>
                        <li><strong>Valor Estimado</strong>: Valor numérico en euros</li>
                        <li><strong>Notas</strong>: Información adicional</li>
                    </ul>
                </CardContent>
            </Card>

            <ExcelImporter
                fields={LEAD_FIELDS}
                onImport={handleImport}
                entityName="lead"
            />
        </div>
    )
}
