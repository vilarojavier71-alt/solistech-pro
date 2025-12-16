/**
 * API Route: Create Presentation
 * STUB: presentations table doesn't exist in Prisma schema
 * Also uses Supabase Storage which is not available
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
        }

        // STUB: presentations table and Supabase Storage don't exist in migrated system
        // TODO: Add presentations model to Prisma schema
        // TODO: Implement local file storage or S3 alternative
        return NextResponse.json({
            error: 'Generación de presentaciones no disponible - pendiente de migración',
            success: false
        }, { status: 501 })

    } catch (error: any) {
        console.error('Error creating presentation:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
