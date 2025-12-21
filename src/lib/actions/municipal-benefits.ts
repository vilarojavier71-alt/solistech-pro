'use server'

import { getCurrentUserWithRole } from '@/lib/session'

export interface MunicipalBenefits {
    id: string
    municipality: string | null
    province: string | null
    comarca: string | null
    autonomous_community: string
    scope_level: 'region' | 'comarca' | 'municipality'
    ibi_percentage: number
    ibi_duration_years: number
    ibi_conditions: string
    icio_percentage: number
    icio_conditions: string
    source_url?: string
    source: 'official' | 'user_reported' | 'verified'
    priority: number
}

export interface MunicipalSavings {
    ibiAnnual: number
    ibiTotal: number
    icio: number
    total: number
}

// Geocodificación inversa: coordenadas → municipio
export async function reverseGeocode(lat: number, lng: number) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`,
            {
                headers: {
                    'User-Agent': 'MotorGap'
                }
            }
        )

        if (!response.ok) {
            return { error: 'Error en geocodificación' }
        }

        const data = await response.json()

        return {
            municipality: data.address.city || data.address.town || data.address.village || data.address.municipality,
            province: data.address.province || data.address.state,
            comarca: data.address.county || data.address.region,
            postalCode: data.address.postcode,
            country: data.address.country,
            autonomousCommunity: data.address.state // En España, state = Comunidad Autónoma
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        console.error('Reverse geocode error:', error)
        return { error: errorMessage }
    }
}

// Buscar bonificaciones con lógica jerárquica
export async function getMunicipalBenefitsHierarchical(
    municipality: string,
    province?: string,
    comarca?: string,
    autonomousCommunity?: string
) {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('find_benefits_hierarchical', {
        search_municipality: municipality,
        search_province: province || null,
        search_comarca: comarca || null,
        search_community: autonomousCommunity || null
    })

    if (error) {
        console.error('Error fetching hierarchical benefits:', error)
        return { data: null, error: error.message }
    }

    if (!data || data.length === 0) {
        return { data: null, error: 'No hay bonificaciones disponibles para esta ubicación' }
    }

    return { data: data[0] as MunicipalBenefits, error: null }
}

// Buscar bonificaciones por coordenadas (con geocodificación)
export async function getMunicipalBenefitsByCoordinates(lat: number, lng: number) {
    // 1. Geocodificación inversa
    const location = await reverseGeocode(lat, lng)

    if (location.error || !location.municipality) {
        return { data: null, error: 'No se pudo determinar el municipio' }
    }

    // 2. Buscar con lógica jerárquica
    const result = await getMunicipalBenefitsHierarchical(
        location.municipality,
        location.province,
        location.comarca,
        location.autonomousCommunity
    )

    return result
}

// Calcular ahorros municipales estimados
export async function calculateMunicipalSavings(
    projectCost: number,
    benefits: MunicipalBenefits
): Promise<MunicipalSavings> {
    // IBI estimado (0.4% - 1.1% del valor catastral)
    // Aproximamos valor catastral como 70% del coste del proyecto
    const catastralValue = projectCost * 0.7
    const averageIBIRate = 0.007 // 0.7% del valor catastral
    const annualIBI = catastralValue * averageIBIRate
    const ibiSavingsPerYear = annualIBI * (benefits.ibi_percentage / 100)
    const ibiSavingsTotal = ibiSavingsPerYear * benefits.ibi_duration_years

    // ICIO (2% - 4% del presupuesto de obra)
    const averageICIORate = 0.03 // 3% del presupuesto
    const icioAmount = projectCost * averageICIORate
    const icioSavings = icioAmount * (benefits.icio_percentage / 100)

    return {
        ibiAnnual: Math.round(ibiSavingsPerYear),
        ibiTotal: Math.round(ibiSavingsTotal),
        icio: Math.round(icioSavings),
        total: Math.round(ibiSavingsTotal + icioSavings)
    }
}

// Listar todas las bonificaciones disponibles (agrupadas por nivel)
export async function listAllMunicipalBenefits() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('municipal_tax_benefits')
        .select('*')
        .eq('is_active', true)
        .order('scope_level, autonomous_community, province, municipality')

    if (error) {
        return { data: null, error: error.message }
    }

    // Agrupar por nivel jerárquico
    const grouped = {
        regional: data.filter(b => b.scope_level === 'region'),
        comarcal: data.filter(b => b.scope_level === 'comarca'),
        municipal: data.filter(b => b.scope_level === 'municipality')
    }

    return { data: grouped, error: null }
}

// Reportar bonificación (para usuarios)
export async function reportMunicipalBenefit(data: {
    municipality: string
    province?: string
    comarca?: string
    autonomousCommunity: string
    ibiPercentage?: number
    ibiDurationYears?: number
    ibiConditions?: string
    icioPercentage?: number
    icioConditions?: string
    sourceUrl?: string
    notes?: string
}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single()

    if (!userData) return { error: 'Usuario no encontrado' }

    const { error } = await supabase
        .from('user_benefit_reports')
        .insert({
            reported_by: user.id,
            organization_id: userData.organization_id,
            municipality: data.municipality,
            province: data.province,
            comarca: data.comarca,
            autonomous_community: data.autonomousCommunity,
            ibi_percentage: data.ibiPercentage,
            ibi_duration_years: data.ibiDurationYears,
            ibi_conditions: data.ibiConditions,
            icio_percentage: data.icioPercentage,
            icio_conditions: data.icioConditions,
            source_url: data.sourceUrl,
            notes: data.notes
        })

    if (error) return { error: error.message }

    return { success: true }
}

