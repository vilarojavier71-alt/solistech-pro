'use server'

import { searchBenefits, autocompleteBenefits, MUNICIPAL_BENEFITS, type MunicipalBenefit } from '@/lib/data/municipal-benefits'

interface SearchResult {
    id: string
    municipality: string | null
    province: string | null
    autonomous_community: string
    scope_level: 'region' | 'comarca' | 'municipality'
    similarity_score: number
    ibi_percentage: number
    icio_percentage: number
}

// Búsqueda fuzzy de municipios (usando datos estáticos)
export async function searchMunicipalitiesFuzzy(searchTerm: string, maxResults: number = 10) {
    try {
        const benefits = searchBenefits(searchTerm, maxResults)

        const data: SearchResult[] = benefits.map(b => ({
            id: b.id,
            municipality: b.municipality,
            province: b.province,
            autonomous_community: b.autonomous_community,
            scope_level: b.scope_level,
            similarity_score: 1.0, // Static data, so we assume exact match
            ibi_percentage: b.ibi_percentage,
            icio_percentage: b.icio_percentage
        }))

        return { data, error: null }
    } catch (error) {
        console.error('Error searching municipalities:', error)
        return { data: null, error: 'Error en la búsqueda' }
    }
}

// Autocompletado de municipios
export async function autocompleteMunicipalities(searchTerm: string, maxResults: number = 5) {
    try {
        const suggestions = autocompleteBenefits(searchTerm, maxResults)
        return { data: suggestions, error: null }
    } catch (error) {
        console.error('Error autocompleting municipalities:', error)
        return { data: null, error: 'Error en el autocompletado' }
    }
}

// Municipios cercanos (placeholder - requires geolocation data)
export async function findNearbyMunicipalities(
    lat: number,
    lng: number,
    radiusKm: number = 50,
    maxResults: number = 5
) {
    // Para simplificar, devolvemos los primeros municipios
    // Una implementación real calcularía distancia con Haversine
    const data = MUNICIPAL_BENEFITS
        .filter(b => b.scope_level === 'municipality')
        .slice(0, maxResults)
        .map(b => ({
            id: b.id,
            municipality: b.municipality,
            province: b.province,
            autonomous_community: b.autonomous_community,
            distance_km: Math.random() * radiusKm // Placeholder distance
        }))

    return { data, error: null }
}

// Resumen de ayudas por comunidad
export async function getBenefitsSummary() {
    try {
        // Agrupar por comunidad autónoma
        const summaryMap = new Map<string, {
            autonomous_community: string
            total_municipalities: number
            avg_ibi: number
            avg_icio: number
        }>()

        for (const benefit of MUNICIPAL_BENEFITS) {
            if (benefit.scope_level !== 'municipality') continue

            const existing = summaryMap.get(benefit.autonomous_community)
            if (existing) {
                existing.total_municipalities++
                existing.avg_ibi = (existing.avg_ibi + benefit.ibi_percentage) / 2
                existing.avg_icio = (existing.avg_icio + benefit.icio_percentage) / 2
            } else {
                summaryMap.set(benefit.autonomous_community, {
                    autonomous_community: benefit.autonomous_community,
                    total_municipalities: 1,
                    avg_ibi: benefit.ibi_percentage,
                    avg_icio: benefit.icio_percentage
                })
            }
        }

        const data = Array.from(summaryMap.values())
        return { data, error: null }
    } catch (error) {
        console.error('Error getting benefits summary:', error)
        return { data: null, error: 'Error al obtener resumen' }
    }
}
