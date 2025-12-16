/**
 * Geofencing Utilities
 * 
 * Funciones para validación de ubicación mediante geofencing.
 * Implementa algoritmo Haversine para cálculo de distancias.
 * 
 * @author @GEO_COORD
 * @version 1.0.0
 */

export interface Coordinates {
    latitude: number
    longitude: number
}

export interface GeofenceValidation {
    isValid: boolean
    distance: number
    status: "valid" | "suspicious" | "invalid" | "unknown"
    message: string
}

/**
 * Calcula la distancia entre dos puntos geográficos usando la fórmula de Haversine
 * 
 * @param point1 - Primera coordenada (usuario)
 * @param point2 - Segunda coordenada (proyecto)
 * @returns Distancia en metros
 * 
 * @example
 * const distance = calculateDistance(
 *   { latitude: 40.4168, longitude: -3.7038 },
 *   { latitude: 40.4180, longitude: -3.7050 }
 * )
 * console.log(distance) // ~150 metros
 */
export function calculateDistance(
    point1: Coordinates,
    point2: Coordinates
): number {
    const R = 6371e3 // Radio de la Tierra en metros

    // Convertir grados a radianes
    const φ1 = (point1.latitude * Math.PI) / 180
    const φ2 = (point2.latitude * Math.PI) / 180
    const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180
    const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180

    // Fórmula de Haversine
    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    const distance = R * c // Distancia en metros

    return Math.round(distance * 10) / 10 // Redondear a 1 decimal
}

/**
 * Valida si una ubicación está dentro del geofence permitido
 * 
 * @param userLocation - Ubicación actual del usuario
 * @param projectLocation - Ubicación del proyecto
 * @param radius - Radio permitido en metros (default: 500m)
 * @returns Objeto con resultado de validación
 * 
 * @example
 * const validation = validateGeofence(
 *   { latitude: 40.4168, longitude: -3.7038 },
 *   { latitude: 40.4180, longitude: -3.7050 },
 *   500
 * )
 * 
 * if (validation.isValid) {
 *   console.log("✅ Ubicación válida")
 * }
 */
export function validateGeofence(
    userLocation: Coordinates | null,
    projectLocation: Coordinates | null,
    radius: number = 500
): GeofenceValidation {
    // Validar inputs
    if (!userLocation || !projectLocation) {
        return {
            isValid: false,
            distance: 0,
            status: "unknown",
            message: "Ubicación no disponible"
        }
    }

    // Validar coordenadas válidas
    if (
        !isValidCoordinate(userLocation) ||
        !isValidCoordinate(projectLocation)
    ) {
        return {
            isValid: false,
            distance: 0,
            status: "unknown",
            message: "Coordenadas inválidas"
        }
    }

    // Calcular distancia
    const distance = calculateDistance(userLocation, projectLocation)

    // Validar según radio
    if (distance <= radius) {
        return {
            isValid: true,
            distance,
            status: "valid",
            message: `Dentro del área permitida (${Math.round(distance)}m)`
        }
    } else if (distance <= radius * 2) {
        // Zona sospechosa: entre 1x y 2x el radio
        return {
            isValid: false,
            distance,
            status: "suspicious",
            message: `Ubicación sospechosa (${Math.round(distance)}m del proyecto)`
        }
    } else {
        // Fuera del área
        return {
            isValid: false,
            distance,
            status: "invalid",
            message: `Fuera del área permitida (${Math.round(distance)}m del proyecto)`
        }
    }
}

/**
 * Valida que las coordenadas sean válidas
 * 
 * @param coords - Coordenadas a validar
 * @returns true si son válidas
 */
function isValidCoordinate(coords: Coordinates): boolean {
    return (
        typeof coords.latitude === "number" &&
        typeof coords.longitude === "number" &&
        coords.latitude >= -90 &&
        coords.latitude <= 90 &&
        coords.longitude >= -180 &&
        coords.longitude <= 180 &&
        !isNaN(coords.latitude) &&
        !isNaN(coords.longitude)
    )
}

/**
 * Formatea la distancia para mostrar al usuario
 * 
 * @param meters - Distancia en metros
 * @returns String formateado (ej: "150m" o "1.2km")
 */
export function formatDistance(meters: number): string {
    if (meters < 1000) {
        return `${Math.round(meters)}m`
    } else {
        return `${(meters / 1000).toFixed(1)}km`
    }
}

/**
 * Verifica si el usuario está cerca del proyecto (< 100m)
 * Útil para notificaciones de "Has llegado"
 * 
 * @param userLocation - Ubicación del usuario
 * @param projectLocation - Ubicación del proyecto
 * @returns true si está cerca
 */
export function isNearProject(
    userLocation: Coordinates | null,
    projectLocation: Coordinates | null
): boolean {
    if (!userLocation || !projectLocation) return false

    const distance = calculateDistance(userLocation, projectLocation)
    return distance < 100 // Menos de 100 metros
}

/**
 * Calcula el bearing (dirección) desde un punto a otro
 * Útil para mostrar "El proyecto está al Norte"
 * 
 * @param from - Punto de origen
 * @param to - Punto de destino
 * @returns Ángulo en grados (0-360)
 */
export function calculateBearing(
    from: Coordinates,
    to: Coordinates
): number {
    const φ1 = (from.latitude * Math.PI) / 180
    const φ2 = (to.latitude * Math.PI) / 180
    const Δλ = ((to.longitude - from.longitude) * Math.PI) / 180

    const y = Math.sin(Δλ) * Math.cos(φ2)
    const x =
        Math.cos(φ1) * Math.sin(φ2) -
        Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)

    const θ = Math.atan2(y, x)
    const bearing = ((θ * 180) / Math.PI + 360) % 360

    return Math.round(bearing)
}

/**
 * Convierte bearing a dirección cardinal
 * 
 * @param bearing - Ángulo en grados
 * @returns Dirección cardinal (N, NE, E, SE, S, SW, W, NW)
 */
export function bearingToCardinal(bearing: number): string {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
    const index = Math.round(bearing / 45) % 8
    return directions[index]
}
