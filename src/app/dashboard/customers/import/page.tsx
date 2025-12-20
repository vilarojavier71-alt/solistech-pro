'use client'

import { ExcelImporter } from '@/components/import/excel-importer'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { importDataFromCsv } from '@/lib/actions/data-actions'

const CUSTOMER_FIELDS = [
    { name: 'name', label: 'Nombre', required: true },
    { name: 'email', label: 'Email', required: false },
    { name: 'phone', label: 'Tel�fono', required: false },
    { name: 'company', label: 'Empresa', required: false },
    { name: 'tax_id', label: 'CIF/NIF', required: false },
    { name: 'street', label: 'Calle', required: false },
    { name: 'city', label: 'Ciudad', required: false },
    { name: 'postal_code', label: 'C�digo Postal', required: false },
    { name: 'state', label: 'Provincia', required: false },
    { name: 'country', label: 'Pa�s', required: false },
]

export default function ImportCustomersPage() {
    const router = useRouter()

    const handleImport = async (data: any[]) => {
        // Use the migrated server action for importing
        const result = await importDataFromCsv('customers', data)

        if (result.success) {
            router.refresh()
            return { success: result.count || 0, errors: [] }
        } else {
            return { success: 0, errors: [result.message || 'Error en la importaci�n'] }
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push('/dashboard/customers')}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Importar Clientes</h1>
                    <p className="text-muted-foreground">
                        Importa m�ltiples clientes desde un archivo Excel o CSV
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
                        <li><strong>Nombre</strong> (requerido): Nombre del cliente</li>
                        <li><strong>Email</strong>: Direcci�n de correo electr�nico</li>
                        <li><strong>Tel�fono</strong>: N�mero de tel�fono</li>
                        <li><strong>Empresa</strong>: Nombre de la empresa</li>
                        <li><strong>CIF/NIF</strong>: Identificaci�n fiscal</li>
                        <li><strong>Calle</strong>: Direcci�n completa</li>
                        <li><strong>Ciudad</strong>: Ciudad</li>
                        <li><strong>C�digo Postal</strong>: CP</li>
                        <li><strong>Provincia</strong>: Provincia o estado</li>
                        <li><strong>Pa�s</strong>: Pa�s (por defecto: Espa�a)</li>
                    </ul>
                </CardContent>
            </Card>

            <ExcelImporter
                fields={CUSTOMER_FIELDS}
                onImport={handleImport}
                entityName="cliente"
            />
        </div>
    )
}
