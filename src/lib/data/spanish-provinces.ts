// ═══════════════════════════════════════════════════════════════════════════════
// PROVINCIAS DE ESPAÑA
// Datos oficiales para selectores y validación
// ═══════════════════════════════════════════════════════════════════════════════

export interface Province {
    code: string      // Código INE
    name: string      // Nombre oficial
    community: string // Comunidad Autónoma
}

export const SPANISH_PROVINCES: Province[] = [
    // Andalucía
    { code: '04', name: 'Almería', community: 'Andalucía' },
    { code: '11', name: 'Cádiz', community: 'Andalucía' },
    { code: '14', name: 'Córdoba', community: 'Andalucía' },
    { code: '18', name: 'Granada', community: 'Andalucía' },
    { code: '21', name: 'Huelva', community: 'Andalucía' },
    { code: '23', name: 'Jaén', community: 'Andalucía' },
    { code: '29', name: 'Málaga', community: 'Andalucía' },
    { code: '41', name: 'Sevilla', community: 'Andalucía' },

    // Aragón
    { code: '22', name: 'Huesca', community: 'Aragón' },
    { code: '44', name: 'Teruel', community: 'Aragón' },
    { code: '50', name: 'Zaragoza', community: 'Aragón' },

    // Asturias
    { code: '33', name: 'Asturias', community: 'Principado de Asturias' },

    // Islas Baleares
    { code: '07', name: 'Illes Balears', community: 'Illes Balears' },

    // Canarias
    { code: '35', name: 'Las Palmas', community: 'Canarias' },
    { code: '38', name: 'Santa Cruz de Tenerife', community: 'Canarias' },

    // Cantabria
    { code: '39', name: 'Cantabria', community: 'Cantabria' },

    // Castilla-La Mancha
    { code: '02', name: 'Albacete', community: 'Castilla-La Mancha' },
    { code: '13', name: 'Ciudad Real', community: 'Castilla-La Mancha' },
    { code: '16', name: 'Cuenca', community: 'Castilla-La Mancha' },
    { code: '19', name: 'Guadalajara', community: 'Castilla-La Mancha' },
    { code: '45', name: 'Toledo', community: 'Castilla-La Mancha' },

    // Castilla y León
    { code: '05', name: 'Ávila', community: 'Castilla y León' },
    { code: '09', name: 'Burgos', community: 'Castilla y León' },
    { code: '24', name: 'León', community: 'Castilla y León' },
    { code: '34', name: 'Palencia', community: 'Castilla y León' },
    { code: '37', name: 'Salamanca', community: 'Castilla y León' },
    { code: '40', name: 'Segovia', community: 'Castilla y León' },
    { code: '42', name: 'Soria', community: 'Castilla y León' },
    { code: '47', name: 'Valladolid', community: 'Castilla y León' },
    { code: '49', name: 'Zamora', community: 'Castilla y León' },

    // Cataluña
    { code: '08', name: 'Barcelona', community: 'Cataluña' },
    { code: '17', name: 'Girona', community: 'Cataluña' },
    { code: '25', name: 'Lleida', community: 'Cataluña' },
    { code: '43', name: 'Tarragona', community: 'Cataluña' },

    // Extremadura
    { code: '06', name: 'Badajoz', community: 'Extremadura' },
    { code: '10', name: 'Cáceres', community: 'Extremadura' },

    // Galicia
    { code: '15', name: 'A Coruña', community: 'Galicia' },
    { code: '27', name: 'Lugo', community: 'Galicia' },
    { code: '32', name: 'Ourense', community: 'Galicia' },
    { code: '36', name: 'Pontevedra', community: 'Galicia' },

    // Madrid
    { code: '28', name: 'Madrid', community: 'Comunidad de Madrid' },

    // Murcia
    { code: '30', name: 'Murcia', community: 'Región de Murcia' },

    // Navarra
    { code: '31', name: 'Navarra', community: 'Comunidad Foral de Navarra' },

    // País Vasco
    { code: '01', name: 'Álava', community: 'País Vasco' },
    { code: '20', name: 'Gipuzkoa', community: 'País Vasco' },
    { code: '48', name: 'Bizkaia', community: 'País Vasco' },

    // La Rioja
    { code: '26', name: 'La Rioja', community: 'La Rioja' },

    // Comunidad Valenciana
    { code: '03', name: 'Alicante', community: 'Comunidad Valenciana' },
    { code: '12', name: 'Castellón', community: 'Comunidad Valenciana' },
    { code: '46', name: 'Valencia', community: 'Comunidad Valenciana' },

    // Ceuta y Melilla
    { code: '51', name: 'Ceuta', community: 'Ceuta' },
    { code: '52', name: 'Melilla', community: 'Melilla' },
]

// Ordenadas alfabéticamente por nombre
export const PROVINCES_ALPHABETICAL = [...SPANISH_PROVINCES].sort((a, b) =>
    a.name.localeCompare(b.name, 'es')
)

// Agrupadas por comunidad autónoma
export const PROVINCES_BY_COMMUNITY = SPANISH_PROVINCES.reduce((acc, province) => {
    if (!acc[province.community]) {
        acc[province.community] = []
    }
    acc[province.community].push(province)
    return acc
}, {} as Record<string, Province[]>)

// Helper para obtener provincia por nombre (case insensitive)
export function findProvinceByName(name: string): Province | undefined {
    const normalized = name.trim().toLowerCase()
    return SPANISH_PROVINCES.find(p =>
        p.name.toLowerCase() === normalized ||
        // Variantes comunes
        p.name.toLowerCase().replace(/[áàäâ]/g, 'a')
            .replace(/[éèëê]/g, 'e')
            .replace(/[íìïî]/g, 'i')
            .replace(/[óòöô]/g, 'o')
            .replace(/[úùüû]/g, 'u') ===
        normalized.replace(/[áàäâ]/g, 'a')
            .replace(/[éèëê]/g, 'e')
            .replace(/[íìïî]/g, 'i')
            .replace(/[óòöô]/g, 'o')
            .replace(/[úùüû]/g, 'u')
    )
}

// Helper para normalizar nombre de provincia
export function normalizeProvinceName(name: string): string {
    const found = findProvinceByName(name)
    return found?.name || name.trim()
}

// Lista simple de nombres para selectores
export const PROVINCE_NAMES = PROVINCES_ALPHABETICAL.map(p => p.name)

// Comunidades autónomas únicas
export const AUTONOMOUS_COMMUNITIES = [...new Set(SPANISH_PROVINCES.map(p => p.community))].sort()
