'use server'

import { getCurrentUserWithRole } from '@/lib/session'

// Búsqueda fuzzy de municipios
export async function searchMunicipalitiesFuzzy(searchTerm: string, maxResults: number = 10) {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('search_municipalities_fuzzy', {
        search_term: searchTerm,
        max_results: maxResults
    })

    if (error) {
        console.error('Error searching municipalities:', error)
        return { data: null, error: error.message }
    }

    return { data, error: null }
}

// Autocompletado de municipios
export async function autocompleteMunicipalities(searchTerm: string, maxResults: number = 5) {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('autocomplete_municipalities', {
        search_term: searchTerm,
        max_results: maxResults
    })

    if (error) {
        console.error('Error autocompleting municipalities:', error)
        return { data: null, error: error.message }
    }

    return { data, error: null }
}

// Municipios cercanos
export async function findNearbyMunicipalities(
    lat: number,
    lng: number,
    radiusKm: number = 50,
    maxResults: number = 5
) {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('find_nearby_municipalities', {
        reference_lat: lat,
        reference_lng: lng,
        radius_km: radiusKm,
        max_results: maxResults
    })

    if (error) {
        console.error('Error finding nearby municipalities:', error)
        return { data: null, error: error.message }
    }

    return { data, error: null }
}

// Resumen de ayudas por comunidad
export async function getBenefitsSummary() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('benefits_summary')
        .select('*')

    if (error) {
        console.error('Error getting benefits summary:', error)
        return { data: null, error: error.message }
    }

    return { data, error: null }
}

