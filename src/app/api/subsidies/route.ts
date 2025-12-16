/**
 * API Route: Subsidies
 * STUB: subsidies table doesn't exist in Prisma schema
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

// GET /api/subsidies?region=Comunidad+Valenciana
export async function GET(request: NextRequest) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const region = searchParams.get('region')

    if (!region) {
        return NextResponse.json(
            { error: 'Parámetro "region" requerido' },
            { status: 400 }
        )
    }

    // STUB: subsidies table doesn't exist in Prisma schema
    // TODO: Add subsidies model to Prisma schema
    return NextResponse.json([])
}
