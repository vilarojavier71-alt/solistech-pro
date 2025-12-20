import { Metadata } from 'next'
import { NewCustomerForm } from '@/components/forms/new-customer-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Suspense } from 'react'

export const metadata: Metadata = {
    title: 'Nuevo Cliente | SolisTech PRO',
    description: 'Crear un nuevo cliente',
}

export default function NewCustomerPage() {
    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Nuevo Cliente</h1>
                <p className="text-muted-foreground">
                    Añade un nuevo cliente a tu cartera
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Información del Cliente</CardTitle>
                    <CardDescription>
                        Completa los datos del cliente
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<div>Cargando formulario...</div>}>
                        <NewCustomerForm />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    )
}
