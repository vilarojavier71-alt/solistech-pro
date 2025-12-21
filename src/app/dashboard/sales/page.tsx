import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { SalesTable } from '@/components/dashboard/sales-table'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function SalesPage() {
    const session = await auth()

    if (!session?.user) return <div>No autorizado</div>

    const profile = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { organization_id: true }
    })

    if (!profile?.organization_id) {
        return <div>No se encontró la organización del usuario</div>
    }

    // Fetch real sales from database
    const sales = await prisma.sales.findMany({
        where: { organization_id: profile.organization_id },
        orderBy: { created_at: 'desc' }
    })

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Ventas</h1>
                    <p className="text-muted-foreground">
                        Gestiona tus expedientes, cobros y documentación
                    </p>
                </div>
                <Button asChild className="bg-sky-600 hover:bg-sky-700">
                    <Link href="/dashboard/sales/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva Venta
                    </Link>
                </Button>
            </div>

            <SalesTable data={sales || []} />
        </div>
    )
}
