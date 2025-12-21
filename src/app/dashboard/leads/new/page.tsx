import { Metadata } from 'next'
import { NewLeadForm } from '@/components/forms/new-lead-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
    title: 'Nuevo Lead | MotorGap',
    description: 'Crear un nuevo lead',
}

export default function NewLeadPage() {
    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Nuevo Lead</h1>
                <p className="text-muted-foreground">
                    Añade una nueva oportunidad de venta
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Información del Lead</CardTitle>
                    <CardDescription>
                        Completa los datos del contacto y la oportunidad
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <NewLeadForm />
                </CardContent>
            </Card>
        </div>
    )
}
