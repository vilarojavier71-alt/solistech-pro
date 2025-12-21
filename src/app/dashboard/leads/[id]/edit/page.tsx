import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { EditLeadForm } from '@/components/forms/edit-lead-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
    title: 'Editar Lead | MotorGap',
}

export default async function EditLeadPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const session = await auth()
    if (!session?.user) redirect('/auth/login')

    // STUB: leads table doesn't exist in Prisma schema
    // TODO: Add leads model to Prisma
    const lead = {
        id,
        name: 'Lead de ejemplo',
        email: 'lead@ejemplo.com',
        phone: '+34 600 000 000',
        company: 'Empresa ejemplo',
        source: 'web',
        status: 'new',
        estimated_value: 10000,
        notes: ''
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Editar Lead</h1>
                <p className="text-muted-foreground">
                    Actualiza la información del lead
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Información del Lead</CardTitle>
                    <CardDescription>
                        Modifica los datos del contacto y la oportunidad
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <EditLeadForm lead={lead} />
                </CardContent>
            </Card>
        </div>
    )
}
