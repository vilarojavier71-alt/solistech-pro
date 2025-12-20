import { Metadata } from 'next'
import { CreateInvoiceForm } from '@/components/invoices/create-invoice-form'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
    title: 'Nueva Factura | SolisTech PRO',
    description: 'Crear nueva factura con Verifactu',
}

export default async function NewInvoicePage() {
    const session = await auth()

    if (!session?.user) redirect('/auth/login')

    const userData = await prisma.users.findUnique({
        where: { id: session.user.id },
        select: { organization_id: true }
    })

    if (!userData?.organization_id) redirect('/auth/login')

    // Get customers
    const customers = await prisma.customers.findMany({
        where: { organization_id: userData.organization_id },
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' }
    })

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Nueva Factura</h1>
                <p className="text-muted-foreground">
                    Crea una nueva factura con firma electrónica Verifactu
                </p>
            </div>

            <CreateInvoiceForm customers={customers || []} />
        </div>
    )
}

