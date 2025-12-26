import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Obtener lista de clientes
export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
        }

        // Obtener organización del usuario
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { organization_id: true }
        })

        if (!user?.organization_id) {
            return NextResponse.json({ customers: [] })
        }

        // Obtener clientes de la organización
        const customers = await prisma.customer.findMany({
            where: { organization_id: user.organization_id },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true,
                city: true,
                postal_code: true,
                created_at: true
            },
            orderBy: { name: 'asc' },
            take: 100 // Límite para evitar sobrecarga
        })

        return NextResponse.json({ customers })
    } catch (error) {
        console.error('Error fetching customers:', error)
        return NextResponse.json(
            { error: 'Error al obtener clientes' },
            { status: 500 }
        )
    }
}
