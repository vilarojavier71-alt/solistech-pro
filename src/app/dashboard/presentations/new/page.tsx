import { Metadata } from 'next'
import { NewPresentationForm } from '@/components/presentations/new-presentation-form'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma as db } from '@/lib/db'

export const metadata: Metadata = {
    title: 'Nueva Presentación | MotorGap',
    description: 'Crear presentación PowerPoint con IA',
}

export default async function NewPresentationPage() {
    // 1. Authenticate with NextAuth
    const session = await auth()

    if (!session?.user) {
        redirect('/auth/login')
    }

    // 2. Get user's organization from DB via Prisma
    // Assuming 'users' table has organization_id and maps to session.user.id
    const userData = await db.users.findUnique({
        where: { id: session.user.id },
        select: { organization_id: true }
    })

    if (!userData?.organization_id) {
        // Fallback or handle error
        // For now, redirect to dashboard if no organization found
        redirect('/dashboard')
    }

    // 3. Get customers via Prisma
    const customers = await db.customers.findMany({
        where: { organization_id: userData.organization_id },
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' }
    })

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Nueva Presentación</h1>
                <p className="text-muted-foreground">
                    Genera una presentación PowerPoint personalizada con datos técnicos y fiscales
                </p>
            </div>

            {/* Pass generic customer objects */}
            <NewPresentationForm customers={customers} />
        </div>
    )
}
