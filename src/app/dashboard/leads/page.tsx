import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { LeadsTable } from '@/components/dashboard/leads-table'
import { Button } from '@/components/ui/button'
import { Plus, Upload } from 'lucide-react'
import Link from 'next/link'
import { getLeads } from '@/lib/actions/leads'

export const metadata: Metadata = {
    title: 'Leads | SolisTech PRO',
    description: 'Gestiona tus leads y oportunidades de venta',
}

export default async function LeadsPage() {
    const session = await auth()

    if (!session?.user) return null

    // Get user's organization
    const profile = await prisma.users.findUnique({
        where: { id: session.user.id },
        select: { organization_id: true }
    })

    if (!profile?.organization_id) return null

    // Fetch leads from Server Action
    const leads = await getLeads()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
                    <p className="text-muted-foreground">
                        Gestiona tus oportunidades de venta
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/dashboard/leads/import">
                        <Button variant="outline">
                            <Upload className="mr-2 h-4 w-4" />
                            Importar
                        </Button>
                    </Link>
                    <Link href="/dashboard/leads/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Lead
                        </Button>
                    </Link>
                </div>
            </div>

            <LeadsTable leads={leads || []} />
        </div>
    )
}
