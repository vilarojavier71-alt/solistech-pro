'use server'

import { generateObject } from 'ai'
import { z } from 'zod'
import { openai } from '@/lib/ai/provider'
import { prisma } from '@/lib/db'
import { MunicipalBenefit } from '@prisma/client'

// Schema for AI Extraction
const SearchFiltersSchema = z.object({
    municipality: z.string().optional().describe('Name of the municipality or city mentioned'),
    province: z.string().optional().describe('Name of the province mentioned'),
    min_ibi: z.number().optional().describe('Minimum IBI bonification percentage mentioned (0-100)'),
    min_icio: z.number().optional().describe('Minimum ICIO bonification percentage mentioned (0-100)'),
    region: z.string().optional().describe('Autonomous community if mentioned (e.g. Madrid, Cataluña)'),
})

/**
 * SolarBrain: Semantic Search for Benefits
 * Transforms natural language query into database filters
 */
export async function searchBenefitsAI(userQuery: string): Promise<MunicipalBenefit[]> {
    if (!userQuery || userQuery.trim().length === 0) {
        // Fallback: Return top benefits if no query
        return await prisma.municipalBenefit.findMany({ take: 20 })
    }

    // 1. AI Extraction
    const { object: filters } = await generateObject({
        model: openai('gpt-4o'),
        schema: SearchFiltersSchema,
        system: `You are a search query parser for a Spanish Solar Energy database.
        Extract filters from the user's natural language search.
        - "Ayudas en Madrid" -> { municipality: "Madrid" } (or region if context implies)
        - "Bonificación IBI del 50%" -> { min_ibi: 50 }
        - "Impuesto construccion" -> refers to ICIO
        - If the user mentions a specific town (e.g. "Alcobendas"), put it in municipality.
        `,
        prompt: userQuery
    })

    console.log("🧠 SolarBrain Filters:", filters)

    // 2. Build Prisma Query
    const where: any = {}

    if (filters.municipality) {
        where.municipality = { contains: filters.municipality, mode: 'insensitive' }
    } else if (filters.province) {
        where.province = { contains: filters.province, mode: 'insensitive' }
    } else if (filters.region) {
        where.autonomous_community = { contains: filters.region, mode: 'insensitive' }
    }

    if (filters.min_ibi) {
        where.ibi_percentage = { gte: filters.min_ibi }
    }

    if (filters.min_icio) {
        where.icio_percentage = { gte: filters.min_icio }
    }

    // If AI found nothing specific, behave like a text search on the raw query
    if (Object.keys(where).length === 0) {
        where.OR = [
            { municipality: { contains: userQuery, mode: 'insensitive' } },
            { province: { contains: userQuery, mode: 'insensitive' } }
        ]
    }

    // 3. Execute Search
    return await prisma.municipalBenefit.findMany({
        where,
        take: 50,
        orderBy: { ibi_percentage: 'desc' }
    })
}
