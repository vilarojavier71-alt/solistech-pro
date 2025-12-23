"use server";

import { fetchCadastralData } from "@/lib/services/catastro"; // Usaremos solo la API de Coordenadas

// Geocode address to coordinates using Nominatim
export async function geocodeAddress(address: string) {
    if (!address || address.trim().length < 5) {
        return { success: false, message: "Dirección demasiado corta" };
    }

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&countrycodes=es&limit=1&accept-language=es`,
            {
                headers: { 'User-Agent': 'MotorGap/1.0' },
                next: { revalidate: 3600 } // Cache for 1 hour
            }
        );

        if (!response.ok) {
            return { success: false, message: "Error al geocodificar" };
        }

        const results = await response.json();

        if (!results || results.length === 0) {
            return { success: false, message: "Dirección no encontrada" };
        }

        const first = results[0];
        return {
            success: true,
            data: {
                lat: parseFloat(first.lat),
                lng: parseFloat(first.lon),
                display_name: first.display_name
            }
        };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error("Geocoding error:", errorMessage);
        return { success: false, message: "Error de conexión" };
    }
}

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

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error("Fallo final en searchCadastreByCoordinates:", errorMessage);
        return { success: false, message: `Error de conexión Catastro: ${errorMessage}` };
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

