import { XMLParser } from "fast-xml-parser";

interface CadastralData {
    rc: string; // Referencia Catastral
    address: string; // Dirección
    city: string; // Municipio
}

// Helpers para URL y Geocoding
export function extractCoordsFromUrl(url: string): { lat: number, lng: number } | null {
    const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match = url.match(regex);
    if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };

    const queryRegex = /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/;
    const queryMatch = url.match(queryRegex);
    if (queryMatch) return { lat: parseFloat(queryMatch[1]), lng: parseFloat(queryMatch[2]) };

    return null;
}

export async function geocodeAddress(address: string): Promise<{ lat: number, lng: number } | null> {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`, {
            headers: { "User-Agent": "MotorGap/1.0" }
        });
        const data = await response.json();
        if (data && data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        return null;
    } catch (error) {
        console.error("Geocoding error:", error);
        return null;
    }
}

export function parseAddressComponents(fullAddress: string) {
    // Simple heuristic parser: "Calle X, Numero, Ciudad, Provincia, CP"
    const parts = fullAddress.split(',').map(p => p.trim());

    const zipIndex = parts.findIndex(p => /^\d{5}$/.test(p));
    const postalCode = zipIndex !== -1 ? parts[zipIndex] : undefined;

    let street = parts[0] || "";
    let number = "";

    const numberMatch = street.match(/(\d+)$/);
    if (numberMatch) {
        number = numberMatch[1];
        street = street.replace(/\s*\d+$/, "");
    }

    const city = parts[1] || "";
    const province = parts[2] || parts[1] || "";

    return {
        street,
        number: number || "1",
        city,
        province,
        postalCode
    };
}

// Helper to infer Province from CP
export function getProvinceFromCP(cp: string): string {
    const code = cp.substring(0, 2);
    // Tabla basada en los dos primeros dígitos del Código Postal de España
    const provinces: Record<string, string> = {
        '01': 'ALAVA', '02': 'ALBACETE', '03': 'ALICANTE', '04': 'ALMERIA', '05': 'AVILA',
        '06': 'BADAJOZ', '07': 'BALEARES', '08': 'BARCELONA', '09': 'BURGOS', '10': 'CACERES',
        '11': 'CADIZ', '12': 'CASTELLON', '13': 'CIUDAD REAL', '14': 'CORDOBA', '15': 'CORUÑA',
        '16': 'CUENCA', '17': 'GIRONA', '18': 'GRANADA', '19': 'GUADALAJARA', '20': 'GUIPUZCOA',
        '21': 'HUELVA', '22': 'HUESCA', '23': 'JAEN', '24': 'LEON', '25': 'LERIDA',
        '26': 'LA RIOJA', '27': 'LUGO', '28': 'MADRID', '29': 'MALAGA', '30': 'MURCIA',
        '31': 'NAVARRA', '32': 'ORENSE', '33': 'ASTURIAS', '34': 'PALENCIA', '35': 'PALMAS',
        '36': 'PONTEVEDRA', '37': 'SALAMANCA', '38': 'STA. CRUZ TENERIFE', '39': 'CANTABRIA', '40': 'SEGOVIA',
        '41': 'SEVILLA', '42': 'SORIA', '43': 'TARRAGONA', '44': 'TERUEL', '45': 'TOLEDO',
        '46': 'VALENCIA', '47': 'VALLADOLID', '48': 'VIZCAYA', '49': 'ZAMORA', '50': 'ZARAGOZA',
        '51': 'CEUTA', '52': 'MELILLA'
    };
    return provinces[code] || "";
}

// Función de Pausa para el Reintento
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Circuit breaker sencillo en memoria (por instancia)
const breaker = {
    failures: 0,
    threshold: 3,
    timeoutMs: 30_000,
    openedAt: 0
}

function isBreakerOpen() {
    if (breaker.failures < breaker.threshold) return false
    if (Date.now() - breaker.openedAt > breaker.timeoutMs) {
        breaker.failures = 0
        return false
    }
    return true
}

function recordFailure() {
    breaker.failures += 1
    if (breaker.failures >= breaker.threshold) {
        breaker.openedAt = Date.now()
        console.warn('[CircuitBreaker] Catastro abierto por fallos consecutivos')
    }
}

function recordSuccess() {
    breaker.failures = 0
}

const ALLOWED_HOST = 'ovc.catastro.meh.es'
const BLOCKED_HOSTS = ['127.', '10.', '192.168.', '172.16.', '172.17.', '172.18.', '172.19.', '172.2', '172.30.', '172.31.']

// FUNCIÓN DE FETCH GENÉRICA CON REINTENTO, VALIDACIÓN SSRF Y CIRCUIT BREAKER
async function resilientFetch(url: string, attempts: number = 2): Promise<Response> {
    const parsed = new URL(url)
    const host = parsed.hostname.toLowerCase()

    if (host !== ALLOWED_HOST) {
        throw new Error(`Host no permitido para Catastro: ${host}`)
    }
    if (BLOCKED_HOSTS.some(h => host.startsWith(h))) {
        throw new Error(`Bloqueo SSRF: host privado ${host}`)
    }

    if (isBreakerOpen()) {
        throw new Error('Circuit breaker Catastro abierto. Intenta más tarde.')
    }

    for (let i = 0; i < attempts; i++) {
        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 7000) // 7s timeout

            const response = await fetch(url, {
                cache: 'no-store',
                signal: controller.signal,
                headers: {
                    'User-Agent': 'MotorGap/1.0 (Contact: support@motorgap.es)'
                }
            })

            clearTimeout(timeoutId)

            if (response.status === 500 && i < attempts - 1) {
                console.warn(`[REINTENTO #${i + 1}] API Catastro devolvió 500. Reintentando en 500ms...`)
                await sleep(500)
                continue
            }
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status} ${response.statusText}`)
            }

            recordSuccess()
            return response
        } catch (error: any) {
            recordFailure()
            if (i < attempts - 1) {
                console.warn(`[REINTENTO #${i + 1}] Fallo de red/conexión. Reintentando...`)
                await sleep(500)
                continue
            }
            throw error
        }
    }
    throw new Error("El servicio de Catastro no respondió tras múltiples intentos.");
}

// NUEVA VERISÓN STRICT & BLINDADA (v4: Resiliente)
export async function fetchCadastreByText(
    province: string,
    city: string,
    street: string,
    number: string,
    postalCode: string
): Promise<{ rc: string; address: string; city: string } | { error: string } | null> {

    // 0. Aux: Normalizador de Calles (Surgical Fix)
    function normalizeStreetName(s: string): string {
        return s
            .replace(/^C\/\s*/i, "CALLE ")
            .replace(/^Av\.?\s*/i, "AVENIDA ")
            .replace(/^Pz\.?\s*/i, "PLAZA ")
            .replace(/^Cam\.?\s*/i, "CAMINO ") // Fix para "Cam. De Torre Morales"
            .replace(/^Pas\.?\s*/i, "PASEO ")
            .replace(/\s+/g, " ")
            .trim();
    }

    // 1. Limpieza y preparación para la API
    // 🚨 BLINDAJE: Asignamos Provincia automáticamente si no viene, usando el CP
    const assignedProv = province || getProvinceFromCP(postalCode);

    // Aplicamos normalización específica a la calle
    const cleanStreet = normalizeStreetName(street).toUpperCase().trim();

    const cleanCity = city.toUpperCase().trim();
    const cleanProv = assignedProv.toUpperCase().trim();
    const cleanNum = number.toUpperCase().trim();
    const cleanCP = postalCode.toUpperCase().trim();

    console.log(`📡 Consultando Catastro Texto (Resiliente): ${cleanStreet}, ${cleanNum}, CP: ${cleanCP}, Mun: ${cleanCity}, Prov: ${cleanProv}`);

    if (!cleanProv) {
        console.warn("⚠️ No se pudo determinar la provincia. La consulta podría fallar.");
    }

    // 2. Construcción de URL
    const provParam = cleanProv ? `Provincia=${encodeURIComponent(cleanProv)}&` : '';

    const baseUrl = `http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/Consulta_DNPRC?`;

    const url = baseUrl + provParam +
        `Municipio=${encodeURIComponent(cleanCity)}&` +
        `CodigoPostal=${encodeURIComponent(cleanCP)}&` +
        `Calle=${encodeURIComponent(cleanStreet)}&` +
        `Numero=${encodeURIComponent(cleanNum)}`;


    try {
        // 🚨 Usamos la función blindada para la llamada
        const response = await resilientFetch(url);

        const xmlText = await response.text();

        const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false });
        const jsonObj = parser.parse(xmlText);

        const err = jsonObj?.consulta_dnp?.lerr?.err;
        if (err) {
            console.warn("⚠️ API Catastro reportó error:", err.des);
            return { error: `Catastro: ${err.des}` };
        }

        const bi = jsonObj?.consulta_dnp?.bico?.bi;
        if (!bi) return { error: "No se encontraron inmuebles con esos datos. Verifica calle y número." };

        // Manejo de Array/Objeto
        const target = Array.isArray(bi) ? bi[0] : bi;

        if (!target?.idbi?.rc?.pc1 || !target?.idbi?.rc?.pc2) {
            return { error: "Inmueble encontrado pero sin Referencia Catastral accesible." };
        }

        const rc = `${target.idbi.rc.pc1}${target.idbi.rc.pc2}`;
        const addressRaw = target.ldt || `${street} ${number}, ${city}`;

        return {
            rc,
            address: addressRaw,
            city: cleanCity
        };

    } catch (error: any) {
        console.error("🔥 Error CRÍTICO de Conexión Catastro:", error.message);
        if (error.name === 'AbortError') {
            throw new Error("La conexión con Catastro ha excedido el tiempo de espera. Inténtalo de nuevo.");
        }
        // Si falla el reintento, lanzamos el error final
        throw error;
    }
}

export async function fetchCadastralData(lat: number, lng: number): Promise<CadastralData | null> {
    const latFixed = lat.toFixed(6);
    const lngFixed = lng.toFixed(6);

    const url = `http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCoordenadas.asmx/Consulta_RCCOOR?SRS=EPSG:4326&Coordenada_X=${lngFixed}&Coordenada_Y=${latFixed}`;

    console.log(`📡 Consultando Catastro: ${url}`);

    try {
        const response = await fetch(url, { cache: 'no-store' });
        const xmlText = await response.text();

        const parser = new XMLParser({
            ignoreAttributes: false,
            parseTagValue: false
        });
        const jsonObj = parser.parse(xmlText);

        const err = jsonObj?.consulta_coordenadas?.lerr?.err;
        if (err) {
            console.warn("⚠️ API Catastro reportó error:", err?.des);
            return null;
        }

        let coord = jsonObj?.consulta_coordenadas?.coordenadas?.coord;

        if (!coord) return null;

        if (Array.isArray(coord)) {
            coord = coord[0];
        }

        if (!coord.pc || !coord.pc.pc1 || !coord.pc.pc2) {
            return null;
        }

        const rc = `${coord.pc.pc1}${coord.pc.pc2}`;
        const address = coord.ldt || "Dirección sin normalizar";
        const city = coord.nm || "";

        return { rc, address, city };

    } catch (error) {
        console.error("🔥 Error CRÍTICO en conexión Catastro:", error);
        return null;
    }
}
