import { Metadata } from 'next'
import { NewProjectForm } from '@/components/forms/new-project-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Suspense } from 'react'

export const metadata: Metadata = {
    title: 'Nuevo Proyecto | SolisTech PRO',
    description: 'Crear un nuevo proyecto solar',
}

export default async function NewProjectPage() {
    const session = await auth()

    if (!session?.user) return null

    const profile = await prisma.users.findUnique({
        where: { id: session.user.id },
        select: { organization_id: true }
    })

    if (!profile?.organization_id) return null

    // Get customers for dropdown
    const customers = await prisma.customers.findMany({
        where: { organization_id: profile.organization_id },
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' }
    })

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Nuevo Proyecto</h1>
                <p className="text-muted-foreground">
                    Crea un nuevo proyecto de instalación solar
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Información del Proyecto</CardTitle>
                    <CardDescription>
                        Completa los datos del proyecto fotovoltaico
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<div>Cargando formulario...</div>}>
                        <NewProjectForm customers={customers || []} />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    )
}

