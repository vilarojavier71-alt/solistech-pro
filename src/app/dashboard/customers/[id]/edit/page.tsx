import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { EditCustomerForm } from '@/components/forms/edit-customer-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
    title: 'Editar Cliente | MotorGap',
}

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const session = await auth()
    if (!session?.user) redirect('/auth/login')

    const profile = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { organization_id: true }
    })

    if (!profile?.organization_id) redirect('/dashboard')

    const customer = await prisma.customer.findFirst({
        where: {
            id,
            organization_id: profile.organization_id
        }
    })

    if (!customer) redirect('/dashboard/customers')

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Editar Cliente</h1>
                <p className="text-muted-foreground">
                    Actualiza la información del cliente
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Información del Cliente</CardTitle>
                    <CardDescription>
                        Modifica los datos del cliente
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <EditCustomerForm customer={customer} />
                </CardContent>
            </Card>
        </div>
    )
}
