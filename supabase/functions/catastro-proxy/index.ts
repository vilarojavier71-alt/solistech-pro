import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { XMLParser } from "npm:fast-xml-parser";

const CATASTRO_API = "http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/Consulta_DNPRC?";
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper para obtener Provincia (inline logic for Deno context)
function getProvinceFromCP(cp: string): string {
    const code = cp ? cp.substring(0, 2) : "";
    const provinces: Record<string, string> = {
        '01': 'ALAVA', '02': 'ALBACETE', '03': 'ALICANTE', '04': 'ALMERIA', '05': 'AVILA',
        '06': 'BADAJOZ', '07': 'ILLES BALEARS', '08': 'BARCELONA', '09': 'BURGOS', '10': 'CACERES',
        '11': 'CADIZ', '12': 'CASTELLON', '13': 'CIUDAD REAL', '14': 'CORDOBA', '15': 'A CORUÑA',
        '16': 'CUENCA', '17': 'GIRONA', '18': 'GRANADA', '19': 'GUADALAJARA', '20': 'GIPUZKOA',
        '21': 'HUELVA', '22': 'HUESCA', '23': 'JAEN', '24': 'LEON', '25': 'LLEIDA',
        '26': 'LA RIOJA', '27': 'LUGO', '28': 'MADRID', '29': 'MALAGA', '30': 'MURCIA',
        '31': 'NAVARRA', '32': 'OURENSE', '33': 'ASTURIAS', '34': 'PALENCIA', '35': 'LAS PALMAS',
        '36': 'PONTEVEDRA', '37': 'SALAMANCA', '38': 'SANTA CRUZ DE TENERIFE', '39': 'CANTABRIA', '40': 'SEGOVIA',
        '41': 'SEVILLA', '42': 'SORIA', '43': 'TARRAGONA', '44': 'TERUEL', '45': 'TOLEDO',
        '46': 'VALENCIA', '47': 'VALLADOLID', '48': 'BIZKAIA', '49': 'ZAMORA', '50': 'ZARAGOZA',
        '51': 'CEUTA', '52': 'MELILLA'
    };
    return provinces[code] || "";
}

// FUNCIÓN DE FETCH GENÉRICA CON REINTENTO
async function resilientFetch(url: string, attempts: number = 2): Promise<any> {
    for (let i = 0; i < attempts; i++) {
        try {
            const response = await fetch(url, {
                headers: { 'User-Agent': 'SolisTechPro/1.0 (EdgeFunctionProxy)' }
            });

            if (!response.ok) {
                throw new Error(`HTTP_${response.status}: ${response.statusText}`);
            }

            const xmlText = await response.text();
            const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false });
            const jsonObj = parser.parse(xmlText);

            // Check for API errors
            const err = jsonObj?.consulta_dnp?.lerr?.err;
            if (err) return { success: false, message: `Catastro API error: ${err.des}` };

            // Extraction logic
            const bi = jsonObj?.consulta_dnp?.bico?.bi;
            if (!bi) return { success: false, message: "No se encontraron datos en la respuesta XML." };

            const target = Array.isArray(bi) ? bi[0] : bi;
            if (!target?.idbi?.rc?.pc1 || !target?.idbi?.rc?.pc2) return { success: false, message: "Datos RC incompletos." };

            const rc = `${target.idbi.rc.pc1}${target.idbi.rc.pc2}`;

            return {
                success: true,
                data: { rc, address: target.ldt || "", city: target.nm || "" }
            };

        } catch (error: any) {
            console.warn(`Attempt ${i + 1} failed: ${error.message}`);
            if (i < attempts - 1) {
                await sleep(500);
                continue;
            }
            return { success: false, message: `Conexión fallida: ${error.message}` };
        }
    }
}

// Handler principal
serve(async (req) => {
    // CORS Handling (Optional but good for direct browser calls if needed later, safe for server actions)
    if (req.method === 'OPTIONS') {
        return new Response('ok', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            }
        });
    }

    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const { prov, city, street, num, cp } = await req.json();

        if (!city || !street || !num || !cp) {
            return new Response(JSON.stringify({ message: "Faltan parámetros obligatorios (City, Street, Num, CP)." }), {
                status: 400, headers: { "Content-Type": "application/json" }
            });
        }

        const assignedProv = prov || getProvinceFromCP(cp);

        const provParam = assignedProv ? `Provincia=${encodeURIComponent(assignedProv.toUpperCase())}&` : '';
        const url = CATASTRO_API + provParam +
            `Municipio=${encodeURIComponent(city.toUpperCase())}&` +
            `CodigoPostal=${encodeURIComponent(cp)}&` +
            `Calle=${encodeURIComponent(street.toUpperCase())}&` +
            `Numero=${encodeURIComponent(num)}`;

        const result = await resilientFetch(url);

        if (result.success) {
            return new Response(JSON.stringify(result), { status: 200, headers: { "Content-Type": "application/json" } });
        } else {
            // 🚨 Devolvemos el error lógico de la API como 400/404/500
            // Adjust mapping if needed, but returning details is key.
            const status = result.message.includes('404') ? 404 :
                result.message.includes('HTTP_500') ? 502 : 400;

            return new Response(JSON.stringify({ message: result.message, success: false }), {
                status: status, headers: { "Content-Type": "application/json" }
            });
        }

    } catch (error: any) {
        return new Response(JSON.stringify({ message: "Error interno del Proxy.", debug: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});
