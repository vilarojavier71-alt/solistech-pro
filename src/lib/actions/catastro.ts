"use server";

import { fetchCadastralData } from "@/lib/services/catastro"; // Usaremos solo la API de Coordenadas

export async function searchCadastreByCoordinates(lat: number, lng: number, addressHint?: string) {

    if (isNaN(lat) || isNaN(lng)) {
        return { success: false, message: "Coordenadas inválidas." };
    }

    try {
        // Intento 1: Coordenada Exacta
        let data = await fetchCadastralData(lat, lng);
        let matchType = 'exact';

        // Intento 2: Búsqueda Inteligente (Smart Neighbor Search)
        // Si falla, probamos 4 puntos alrededor (~5-7 metros) para salvar errores de lindero/muro
        if (!data) {
            // Offset aprox: 0.00006 grados ~= 6-7 metros
            const OFFSET = 0.00006;
            const neighbors = [
                { l: lat + OFFSET, g: lng }, // Norte
                { l: lat - OFFSET, g: lng }, // Sur
                { l: lat, g: lng + OFFSET }, // Este
                { l: lat, g: lng - OFFSET }  // Oeste
            ];

            for (const p of neighbors) {
                const neighborData = await fetchCadastralData(p.l, p.g);
                if (neighborData) {
                    data = neighborData;
                    matchType = 'approximate';
                    break; // Encontramos uno, nos vale.
                }
            }
        }

        if (!data) {
            return {
                success: false,
                message: "No se encontró R.C. (Fuera de parcela). Intenta mover el pin hacia el centro de la construcción.",
                debug: `Coordenadas: ${lat}, ${lng}`
            };
        }

        // Éxito
        return {
            success: true,
            data: {
                ...data,
                google_address: addressHint || data.address || "Ubicación por Coordenadas",
                match_type: matchType // Metadato útil para UI
            },
            source: matchType === 'exact' ? 'Coordenadas (Exacta)' : 'Coordenadas (Proximidad)'
        };

    } catch (error: any) {
        console.error("Fallo final en searchCadastreByCoordinates:", error.message);
        return { success: false, message: `Error de conexión Catastro: ${error.message}` };
    }
}

// Acción específica para "Verificar Catastro más Cercano" (Spiral Search)
export async function findNearestParcel(lat: number, lng: number) {
    console.log(`🔍 Buscando parcela cercana a: ${lat}, ${lng}`);

    // Espiral de búsqueda (puntos equidistantes a ~10-15m)
    // 0.0001 grados ~= 11 metros
    const OFFSETS = [
        { lat: 0.0001, lng: 0 },      // N
        { lat: -0.0001, lng: 0 },     // S
        { lat: 0, lng: 0.0001 },      // E
        { lat: 0, lng: -0.0001 },     // W
        { lat: 0.0001, lng: 0.0001 }, // NE
        { lat: -0.0001, lng: -0.0001 }, // SW
        { lat: 0.0001, lng: -0.0001 },  // NW
        { lat: -0.0001, lng: 0.0001 }   // SE
    ];

    for (const offset of OFFSETS) {
        const targetLat = lat + offset.lat;
        const targetLng = lng + offset.lng;

        try {
            const data = await fetchCadastralData(targetLat, targetLng);
            if (data) {
                return {
                    success: true,
                    data: {
                        ...data,
                        match_type: 'proximity_spiral'
                    }
                };
            }
        } catch (e) {
            // Ignore errors in spiral
        }
    }

    return {
        success: false,
        message: "No se encontraron parcelas cercanas en el radio de búsqueda."
    };
}

