
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const query = searchParams.get('q')?.trim()
        const region = searchParams.get('region')
        const minIbi = searchParams.get('min_ibi')
        const minIcio = searchParams.get('min_icio')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const skip = (page - 1) * limit

        const where: Prisma.MunicipalBenefitWhereInput = {}

        // Filtro de texto (municipio o provincia)
        if (query) {
            where.OR = [
                { municipality: { contains: query, mode: 'insensitive' } },
                { province: { contains: query, mode: 'insensitive' } },
                { autonomous_community: { contains: query, mode: 'insensitive' } }
            ]
        }

        // Filtro por región exacto
        if (region) {
            where.autonomous_community = region
        }

        // Filtros numéricos
        if (minIbi) {
            where.ibi_percentage = { gte: parseFloat(minIbi) }
        }

        if (minIcio) {
            where.icio_percentage = { gte: parseFloat(minIcio) }
        }

        // Ejecutar query
        const [benefits, total] = await Promise.all([
            prisma.municipalBenefit.findMany({
                where,
                skip,
                take: limit,
                orderBy: [
                    // Priorizar municipios sobre regiones generales
                    { scope_level: 'asc' },
                    { municipality: 'asc' }
                ]
            }),
            prisma.municipalBenefit.count({ where })
        ])

        return NextResponse.json({
            data: benefits,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        })

    } catch (error) {
        console.error('Error searching municipal benefits:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
