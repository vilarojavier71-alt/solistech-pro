import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { EditProjectForm } from '@/components/forms/edit-project-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
    title: 'Editar Proyecto | SolisTech PRO',
}

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const session = await auth()
    if (!session?.user) redirect('/auth/login')

    const profile = await prisma.users.findUnique({
        where: { id: session.user.id },
        select: { organization_id: true }
    })

    if (!profile?.organization_id) redirect('/dashboard')

    const project = await prisma.projects.findFirst({
        where: {
            id,
            organization_id: profile.organization_id
        }
    })

    if (!project) redirect('/dashboard/projects')

    // Get customers for dropdown
    const customers = await prisma.customers.findMany({
        where: { organization_id: profile.organization_id },
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
    })

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Editar Proyecto</h1>
                <p className="text-muted-foreground">
                    Actualiza la información del proyecto
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Información del Proyecto</CardTitle>
                    <CardDescription>
                        Modifica los datos del proyecto fotovoltaico
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <EditProjectForm project={project} customers={customers || []} />
                </CardContent>
            </Card>
        </div>
    )
}
