import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ClientsDataGrid } from '@/components/customers/clients-data-grid'
import { InviteClientDialog } from '@/components/customers/invite-client-dialog'
import { EmptyCustomers } from '@/components/empty-states/empty-customers'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata: Metadata = {
    title: 'Clientes | MotorGap',
    description: 'Gestiona tus clientes',
}

export default async function CustomersPage() {
    const session = await auth()

    if (!session?.user) return null

    const profile = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { organization_id: true }
    })

    if (!profile?.organization_id) return null

    const customers = await prisma.customer.findMany({
        where: {
            organization_id: profile.organization_id,
            is_active: true
        },
        orderBy: { created_at: 'desc' }
    })

    // Mostrar empty state si no hay clientes
    if (!customers || customers.length === 0) {
        return <EmptyCustomers />
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                        Clientes
                    </h1>
                    <p className="text-slate-500 mt-2 font-mono text-sm uppercase tracking-wider">
                        Gestión avanzada de cartera
                    </p>
                </div>
                <div className="flex gap-2" id="import-menu">
                    <InviteClientDialog />
                    <Link href="/dashboard/import?type=customers">
                        <Button variant="outline" className="border-slate-700">
                            <Upload className="mr-2 h-4 w-4" />
                            Importar
                        </Button>
                    </Link>
                </div>
            </div>

            <ClientsDataGrid initialData={customers} />
        </div>
    )
}

