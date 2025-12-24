import { Metadata } from 'next'
import { CreateInvoiceForm } from '@/components/invoices/create-invoice-form'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
    title: 'Nueva Factura | MotorGap',
    description: 'Crear nueva factura con Verifactu',
}

export default async function NewInvoicePage() {
    const session = await auth()

    if (!session?.user) redirect('/auth/login')

    // [FIX] Use prisma.user instead of prisma.user to avoid TS errors and potential runtime issues
    const userData = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { organization_id: true }
    })

    if (!userData?.organization_id) redirect('/auth/login')

    // Get customers
    const customersRaw = await prisma.customer.findMany({
        where: { organization_id: userData.organization_id },
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' }
    })

    // [FIX] Ensure email is string (not null) to match component props
    const customers = customersRaw.map(c => ({
        ...c,
        email: c.email || ''
    }))

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Nueva Factura</h1>
                <p className="text-muted-foreground">
                    Crea una nueva factura con firma electrónica Verifactu
                </p>
            </div>

            <CreateInvoiceForm customers={customers} />
        </div>
    )
}


