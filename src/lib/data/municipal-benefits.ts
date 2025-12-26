// Datos de beneficios municipales IBI/ICIO para instalaciones solares
// Fuente: Ordenanzas fiscales municipales (datos orientativos)

export interface MunicipalBenefit {
    id: string
    municipality: string | null
    province: string | null
    autonomous_community: string
    scope_level: 'region' | 'comarca' | 'municipality'
    ibi_percentage: number
    ibi_years: number
    icio_percentage: number
    requirements: string[]
    source_url?: string
    last_updated: string
}

// Base de datos de beneficios por comunidad autónoma y municipios principales
export const MUNICIPAL_BENEFITS: MunicipalBenefit[] = [
    // === COMUNIDAD DE MADRID ===
    {
        id: 'madrid-ciudad',
        municipality: 'Madrid',
        province: 'Madrid',
        autonomous_community: 'Comunidad de Madrid',
        scope_level: 'municipality',
        ibi_percentage: 50,
        ibi_years: 3,
        icio_percentage: 95,
        requirements: ['Instalación mínima 1 kW', 'Vivienda habitual'],
        last_updated: '2024-01'
    },
    {
        id: 'mostoles',
        municipality: 'Móstoles',
        province: 'Madrid',
        autonomous_community: 'Comunidad de Madrid',
        scope_level: 'municipality',
        ibi_percentage: 50,
        ibi_years: 5,
        icio_percentage: 50,
        requirements: ['Instalación solar térmica o fotovoltaica'],
        last_updated: '2024-01'
    },
    {
        id: 'alcala-henares',
        municipality: 'Alcalá de Henares',
        province: 'Madrid',
        autonomous_community: 'Comunidad de Madrid',
        scope_level: 'municipality',
        ibi_percentage: 50,
        ibi_years: 4,
        icio_percentage: 50,
        requirements: ['Autoconsumo energético'],
        last_updated: '2024-01'
    },
    // === CATALUÑA ===
    {
        id: 'barcelona-ciudad',
        municipality: 'Barcelona',
        province: 'Barcelona',
        autonomous_community: 'Cataluña',
        scope_level: 'municipality',
        ibi_percentage: 50,
        ibi_years: 3,
        icio_percentage: 95,
        requirements: ['Instalación fotovoltaica para autoconsumo'],
        last_updated: '2024-01'
    },
    {
        id: 'sabadell',
        municipality: 'Sabadell',
        province: 'Barcelona',
        autonomous_community: 'Cataluña',
        scope_level: 'municipality',
        ibi_percentage: 50,
        ibi_years: 5,
        icio_percentage: 50,
        requirements: ['Energía renovable'],
        last_updated: '2024-01'
    },
    {
        id: 'terrassa',
        municipality: 'Terrassa',
        province: 'Barcelona',
        autonomous_community: 'Cataluña',
        scope_level: 'municipality',
        ibi_percentage: 50,
        ibi_years: 4,
        icio_percentage: 75,
        requirements: ['Instalación solar'],
        last_updated: '2024-01'
    },
    // === ANDALUCÍA ===
    {
        id: 'sevilla-ciudad',
        municipality: 'Sevilla',
        province: 'Sevilla',
        autonomous_community: 'Andalucía',
        scope_level: 'municipality',
        ibi_percentage: 50,
        ibi_years: 3,
        icio_percentage: 95,
        requirements: ['Instalación fotovoltaica'],
        last_updated: '2024-01'
    },
    {
        id: 'malaga-ciudad',
        municipality: 'Málaga',
        province: 'Málaga',
        autonomous_community: 'Andalucía',
        scope_level: 'municipality',
        ibi_percentage: 50,
        ibi_years: 5,
        icio_percentage: 95,
        requirements: ['Autoconsumo solar'],
        last_updated: '2024-01'
    },
    {
        id: 'granada-ciudad',
        municipality: 'Granada',
        province: 'Granada',
        autonomous_community: 'Andalucía',
        scope_level: 'municipality',
        ibi_percentage: 50,
        ibi_years: 4,
        icio_percentage: 50,
        requirements: ['Energía renovable'],
        last_updated: '2024-01'
    },
    {
        id: 'cordoba-ciudad',
        municipality: 'Córdoba',
        province: 'Córdoba',
        autonomous_community: 'Andalucía',
        scope_level: 'municipality',
        ibi_percentage: 50,
        ibi_years: 3,
        icio_percentage: 95,
        requirements: ['Instalación solar'],
        last_updated: '2024-01'
    },
    // === COMUNIDAD VALENCIANA ===
    {
        id: 'valencia-ciudad',
        municipality: 'Valencia',
        province: 'Valencia',
        autonomous_community: 'Comunidad Valenciana',
        scope_level: 'municipality',
        ibi_percentage: 50,
        ibi_years: 5,
        icio_percentage: 95,
        requirements: ['Instalación fotovoltaica'],
        last_updated: '2024-01'
    },
    {
        id: 'alicante-ciudad',
        municipality: 'Alicante',
        province: 'Alicante',
        autonomous_community: 'Comunidad Valenciana',
        scope_level: 'municipality',
        ibi_percentage: 50,
        ibi_years: 4,
        icio_percentage: 50,
        requirements: ['Autoconsumo'],
        last_updated: '2024-01'
    },
    {
        id: 'elche',
        municipality: 'Elche',
        province: 'Alicante',
        autonomous_community: 'Comunidad Valenciana',
        scope_level: 'municipality',
        ibi_percentage: 50,
        ibi_years: 5,
        icio_percentage: 75,
        requirements: ['Energía solar'],
        last_updated: '2024-01'
    },
    // === ARAGÓN ===
    {
        id: 'zaragoza-ciudad',
        municipality: 'Zaragoza',
        province: 'Zaragoza',
        autonomous_community: 'Aragón',
        scope_level: 'municipality',
        ibi_percentage: 50,
        ibi_years: 5,
        icio_percentage: 95,
        requirements: ['Instalación solar fotovoltaica o térmica'],
        last_updated: '2024-01'
    },
    // === PAÍS VASCO ===
    {
        id: 'bilbao',
        municipality: 'Bilbao',
        province: 'Vizcaya',
        autonomous_community: 'País Vasco',
        scope_level: 'municipality',
        ibi_percentage: 50,
        ibi_years: 5,
        icio_percentage: 90,
        requirements: ['Energías renovables'],
        last_updated: '2024-01'
    },
    {
        id: 'san-sebastian',
        municipality: 'Donostia-San Sebastián',
        province: 'Guipúzcoa',
        autonomous_community: 'País Vasco',
        scope_level: 'municipality',
        ibi_percentage: 50,
        ibi_years: 5,
        icio_percentage: 90,
        requirements: ['Instalación fotovoltaica'],
        last_updated: '2024-01'
    },
    {
        id: 'vitoria',
        municipality: 'Vitoria-Gasteiz',
        province: 'Álava',
        autonomous_community: 'País Vasco',
        scope_level: 'municipality',
        ibi_percentage: 50,
        ibi_years: 5,
        icio_percentage: 95,
        requirements: ['Autoconsumo solar'],
        last_updated: '2024-01'
    },
    // === MURCIA ===
    {
        id: 'murcia-ciudad',
        municipality: 'Murcia',
        province: 'Murcia',
        autonomous_community: 'Región de Murcia',
        scope_level: 'municipality',
        ibi_percentage: 50,
        ibi_years: 5,
        icio_percentage: 95,
        requirements: ['Instalación solar'],
        last_updated: '2024-01'
    },
    {
        id: 'cartagena',
        municipality: 'Cartagena',
        province: 'Murcia',
        autonomous_community: 'Región de Murcia',
        scope_level: 'municipality',
        ibi_percentage: 50,
        ibi_years: 4,
        icio_percentage: 50,
        requirements: ['Energía renovable'],
        last_updated: '2024-01'
    },
    // === CASTILLA Y LEÓN ===
    {
        id: 'valladolid',
        municipality: 'Valladolid',
        province: 'Valladolid',
        autonomous_community: 'Castilla y León',
        scope_level: 'municipality',
        ibi_percentage: 50,
        ibi_years: 5,
        icio_percentage: 50,
        requirements: ['Instalación fotovoltaica'],
        last_updated: '2024-01'
    },
    {
        id: 'burgos',
        municipality: 'Burgos',
        province: 'Burgos',
        autonomous_community: 'Castilla y León',
        scope_level: 'municipality',
        ibi_percentage: 50,
        ibi_years: 4,
        icio_percentage: 50,
        requirements: ['Autoconsumo'],
        last_updated: '2024-01'
    },
    {
        id: 'salamanca',
        municipality: 'Salamanca',
        province: 'Salamanca',
        autonomous_community: 'Castilla y León',
        scope_level: 'municipality',
        ibi_percentage: 50,
        ibi_years: 3,
        icio_percentage: 50,
        requirements: ['Energía solar'],
        last_updated: '2024-01'
    },
    // === GALICIA ===
    {
        id: 'a-coruna',
        municipality: 'A Coruña',
        province: 'A Coruña',
        autonomous_community: 'Galicia',
        scope_level: 'municipality',
        ibi_percentage: 50,
        ibi_years: 4,
        icio_percentage: 50,
        requirements: ['Instalación solar'],
        last_updated: '2024-01'
    },
    {
        id: 'vigo',
        municipality: 'Vigo',
        province: 'Pontevedra',
        autonomous_community: 'Galicia',
        scope_level: 'municipality',
        ibi_percentage: 50,
        ibi_years: 5,
        icio_percentage: 75,
        requirements: ['Autoconsumo fotovoltaico'],
        last_updated: '2024-01'
    },
    // === ASTURIAS ===
    {
        id: 'oviedo',
        municipality: 'Oviedo',
        province: 'Asturias',
        autonomous_community: 'Asturias',
        scope_level: 'municipality',
        ibi_percentage: 50,
        ibi_years: 4,
        icio_percentage: 50,
        requirements: ['Energía renovable'],
        last_updated: '2024-01'
    },
    {
        id: 'gijon',
        municipality: 'Gijón',
        province: 'Asturias',
        autonomous_community: 'Asturias',
        scope_level: 'municipality',
        ibi_percentage: 50,
        ibi_years: 4,
        icio_percentage: 75,
        requirements: ['Instalación solar'],
        last_updated: '2024-01'
    },
    // === CANTABRIA ===
    {
        id: 'santander',
        municipality: 'Santander',
        province: 'Cantabria',
        autonomous_community: 'Cantabria',
        scope_level: 'municipality',
        ibi_percentage: 50,
        ibi_years: 3,
        icio_percentage: 50,
        requirements: ['Autoconsumo'],
        last_updated: '2024-01'
    },
    // === LA RIOJA ===
    {
        id: 'logrono',
        municipality: 'Logroño',
        province: 'La Rioja',
        autonomous_community: 'La Rioja',
        scope_level: 'municipality',
        ibi_percentage: 50,
        ibi_years: 5,
        icio_percentage: 95,
        requirements: ['Instalación fotovoltaica'],
        last_updated: '2024-01'
    },
    // === NAVARRA ===
    {
        id: 'pamplona',
        municipality: 'Pamplona',
        province: 'Navarra',
        autonomous_community: 'Navarra',
        scope_level: 'municipality',
        ibi_percentage: 50,
        ibi_years: 5,
        icio_percentage: 75,
        requirements: ['Energía renovable'],
        last_updated: '2024-01'
    },
    // === EXTREMADURA ===
    {
        id: 'badajoz',
        municipality: 'Badajoz',
        province: 'Badajoz',
        autonomous_community: 'Extremadura',
        scope_level: 'municipality',
        ibi_percentage: 50,
        ibi_years: 4,
        icio_percentage: 50,
        requirements: ['Instalación solar'],
        last_updated: '2024-01'
    },
    // === CASTILLA-LA MANCHA ===
    {
        id: 'albacete',
        municipality: 'Albacete',
        province: 'Albacete',
        autonomous_community: 'Castilla-La Mancha',
        scope_level: 'municipality',
        ibi_percentage: 50,
        ibi_years: 4,
        icio_percentage: 50,
        requirements: ['Autoconsumo fotovoltaico'],
        last_updated: '2024-01'
    },
    // === ISLAS BALEARES ===
    {
        id: 'palma',
        municipality: 'Palma',
        province: 'Islas Baleares',
        autonomous_community: 'Islas Baleares',
        scope_level: 'municipality',
        ibi_percentage: 50,
        ibi_years: 5,
        icio_percentage: 95,
        requirements: ['Instalación solar'],
        last_updated: '2024-01'
    },
    // === CANARIAS ===
    {
        id: 'las-palmas',
        municipality: 'Las Palmas de Gran Canaria',
        province: 'Las Palmas',
        autonomous_community: 'Canarias',
        scope_level: 'municipality',
        ibi_percentage: 50,
        ibi_years: 5,
        icio_percentage: 95,
        requirements: ['Energía renovable'],
        last_updated: '2024-01'
    },
    {
        id: 'santa-cruz-tenerife',
        municipality: 'Santa Cruz de Tenerife',
        province: 'Santa Cruz de Tenerife',
        autonomous_community: 'Canarias',
        scope_level: 'municipality',
        ibi_percentage: 50,
        ibi_years: 5,
        icio_percentage: 95,
        requirements: ['Instalación fotovoltaica'],
        last_updated: '2024-01'
    },

    // === BENEFICIOS REGIONALES (fallback) ===
    {
        id: 'region-madrid',
        municipality: null,
        province: null,
        autonomous_community: 'Comunidad de Madrid',
        scope_level: 'region',
        ibi_percentage: 30,
        ibi_years: 3,
        icio_percentage: 50,
        requirements: ['Según ordenanza municipal'],
        last_updated: '2024-01'
    },
    {
        id: 'region-cataluna',
        municipality: null,
        province: null,
        autonomous_community: 'Cataluña',
        scope_level: 'region',
        ibi_percentage: 30,
        ibi_years: 3,
        icio_percentage: 50,
        requirements: ['Según ordenanza municipal'],
        last_updated: '2024-01'
    },
    {
        id: 'region-andalucia',
        municipality: null,
        province: null,
        autonomous_community: 'Andalucía',
        scope_level: 'region',
        ibi_percentage: 30,
        ibi_years: 3,
        icio_percentage: 50,
        requirements: ['Según ordenanza municipal'],
        last_updated: '2024-01'
    },
    {
        id: 'region-valencia',
        municipality: null,
        province: null,
        autonomous_community: 'Comunidad Valenciana',
        scope_level: 'region',
        ibi_percentage: 30,
        ibi_years: 3,
        icio_percentage: 50,
        requirements: ['Según ordenanza municipal'],
        last_updated: '2024-01'
    },
    {
        id: 'region-pais-vasco',
        municipality: null,
        province: null,
        autonomous_community: 'País Vasco',
        scope_level: 'region',
        ibi_percentage: 40,
        ibi_years: 4,
        icio_percentage: 75,
        requirements: ['Según ordenanza municipal'],
        last_updated: '2024-01'
    },
]

// Función de búsqueda fuzzy simple
function fuzzyMatch(text: string, query: string): number {
    const textLower = text.toLowerCase()
    const queryLower = query.toLowerCase()

    if (textLower === queryLower) return 1.0
    if (textLower.includes(queryLower)) return 0.8
    if (textLower.startsWith(queryLower)) return 0.9

    // Búsqueda por palabras
    const queryWords = queryLower.split(' ')
    const matchedWords = queryWords.filter(word => textLower.includes(word))
    if (matchedWords.length > 0) {
        return 0.5 + (matchedWords.length / queryWords.length) * 0.3
    }

    return 0
}

// Buscar beneficios por municipio o región
export function searchBenefits(query: string, limit: number = 10): MunicipalBenefit[] {
    const queryLower = query.toLowerCase().trim()

    if (!queryLower) return []

    const results: { benefit: MunicipalBenefit; score: number }[] = []

    for (const benefit of MUNICIPAL_BENEFITS) {
        let maxScore = 0

        // Match por municipio
        if (benefit.municipality) {
            maxScore = Math.max(maxScore, fuzzyMatch(benefit.municipality, queryLower))
        }

        // Match por provincia
        if (benefit.province) {
            maxScore = Math.max(maxScore, fuzzyMatch(benefit.province, queryLower) * 0.7)
        }

        // Match por comunidad autónoma
        maxScore = Math.max(maxScore, fuzzyMatch(benefit.autonomous_community, queryLower) * 0.6)

        if (maxScore > 0.3) {
            results.push({ benefit, score: maxScore })
        }
    }

    // Ordenar por relevancia y scope (municipales primero)
    return results
        .sort((a, b) => {
            // Primero por scope
            const scopeOrder = { municipality: 0, comarca: 1, region: 2 }
            const scopeDiff = scopeOrder[a.benefit.scope_level] - scopeOrder[b.benefit.scope_level]
            if (scopeDiff !== 0) return scopeDiff
            // Luego por score
            return b.score - a.score
        })
        .slice(0, limit)
        .map(r => r.benefit)
}

// Autocompletado de municipios
export function autocompleteBenefits(query: string, limit: number = 5): Array<{
    label: string
    value: string
    province: string | null
    autonomous_community: string
    scope_level: string
}> {
    const queryLower = query.toLowerCase().trim()

    if (queryLower.length < 2) return []

    const results: Array<{ item: MunicipalBenefit; score: number }> = []

    for (const benefit of MUNICIPAL_BENEFITS) {
        if (!benefit.municipality) continue // Solo municipios para autocomplete

        const score = fuzzyMatch(benefit.municipality, queryLower)
        if (score > 0.3) {
            results.push({ item: benefit, score })
        }
    }

    return results
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(r => ({
            label: r.item.municipality!,
            value: r.item.municipality!,
            province: r.item.province,
            autonomous_community: r.item.autonomous_community,
            scope_level: r.item.scope_level
        }))
}
