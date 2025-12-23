/**
 * User-Agent Rotation - Anti-Ban 2.0
 * 
 * Rota User-Agents en peticiones salientes a APIs externas.
 * Previene detección y baneos por proveedores.
 * 
 * ISO 27001 A.8.28 Compliance
 */

/**
 * Pool de User-Agents realistas (navegadores modernos)
 * Actualizado periódicamente para evitar detección
 */
const USER_AGENT_POOL = [
    // Chrome (Windows)
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    
    // Chrome (macOS)
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    
    // Firefox (Windows)
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
    
    // Firefox (macOS)
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
    
    // Safari (macOS)
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    
    // Edge (Windows)
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0',
    
    // Custom para APIs (más profesional)
    'MotorGap-API-Client/1.0 (+https://motorgap.es)',
    'MotorGap-Bot/1.0 (compatible; +https://motorgap.es)'
]

/**
 * Historial de User-Agents usados (para evitar repetición inmediata)
 */
const recentUserAgents = new Map<string, string[]>()
const MAX_RECENT = 5 // Máximo de User-Agents recientes a recordar por dominio

/**
 * Obtiene un User-Agent aleatorio del pool
 * Evita usar el mismo User-Agent consecutivamente para el mismo dominio
 */
export function getRotatedUserAgent(domain?: string): string {
    if (!domain) {
        // Sin dominio, selección completamente aleatoria
        return USER_AGENT_POOL[Math.floor(Math.random() * USER_AGENT_POOL.length)]
    }

    // Obtener User-Agents recientes para este dominio
    const recent = recentUserAgents.get(domain) || []
    
    // Filtrar User-Agents disponibles (excluir los recientes)
    const available = USER_AGENT_POOL.filter(ua => !recent.includes(ua))
    
    // Si todos están en recientes, resetear y usar todos
    const pool = available.length > 0 ? available : USER_AGENT_POOL
    
    // Seleccionar aleatoriamente
    const selected = pool[Math.floor(Math.random() * pool.length)]
    
    // Actualizar historial
    const updatedRecent = [selected, ...recent].slice(0, MAX_RECENT)
    recentUserAgents.set(domain, updatedRecent)
    
    return selected
}

/**
 * Añade headers de User-Agent rotado a un fetch request
 */
export function addRotatedUserAgent(
    headers: HeadersInit = {},
    domain?: string
): HeadersInit {
    const userAgent = getRotatedUserAgent(domain)
    
    if (headers instanceof Headers) {
        headers.set('User-Agent', userAgent)
        return headers
    }
    
    if (Array.isArray(headers)) {
        return [...headers, ['User-Agent', userAgent]]
    }
    
    return {
        ...headers,
        'User-Agent': userAgent
    }
}

/**
 * Helper para fetch con User-Agent rotado
 */
export async function fetchWithRotatedUserAgent(
    url: string | URL,
    options: RequestInit = {},
    domain?: string
): Promise<Response> {
    const parsedUrl = typeof url === 'string' ? new URL(url) : url
    const targetDomain = domain || parsedUrl.hostname
    
    const headers = addRotatedUserAgent(options.headers, targetDomain)
    
    return fetch(url, {
        ...options,
        headers
    })
}

/**
 * Limpia el historial de User-Agents (llamar periódicamente)
 */
export function clearUserAgentHistory(): void {
    recentUserAgents.clear()
}

// Limpiar historial cada hora
if (typeof setInterval !== 'undefined') {
    setInterval(clearUserAgentHistory, 60 * 60 * 1000)
}

