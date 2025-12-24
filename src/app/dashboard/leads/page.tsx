import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { LeadsTable } from '@/components/dashboard/leads-table'
import { Button } from '@/components/ui/button'
import { Plus, Upload } from 'lucide-react'
import Link from 'next/link'
import { LeadsFilters } from '@/components/dashboard/leads-filters'
import { getLeads } from '@/lib/actions/leads'

export const metadata: Metadata = {
    title: 'Leads | MotorGap',
    description: 'Gestiona tus leads y oportunidades de venta',
}

export default async function LeadsPage({
    searchParams
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    const session = await auth()

    if (!session?.user) return null

    const query = typeof searchParams.query === 'string' ? searchParams.query : undefined
    const status = typeof searchParams.status === 'string' ? searchParams.status : undefined
    const sort = typeof searchParams.sort === 'string' ? searchParams.sort : undefined

    // Get user's organization
    const profile = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { organization_id: true }
    })

    if (!profile?.organization_id) return null

    // Fetch leads from Server Action with filters
    const leads = await getLeads({ query, status, sort })

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

            <LeadsFilters />

            <div className="relative">
                <LeadsTable leads={leads || []} />
            </div>
        </div>
    )
}
