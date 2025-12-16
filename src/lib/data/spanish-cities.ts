// Lista completa de ciudades españolas con coordenadas
export const SPANISH_CITIES = [
    // Capitales de provincia (50 ciudades principales)
    { name: 'Madrid', lat: 40.4168, lng: -3.7038, province: 'Madrid', region: 'Comunidad de Madrid' },
    { name: 'Barcelona', lat: 41.3851, lng: 2.1734, province: 'Barcelona', region: 'Cataluña' },
    { name: 'Valencia', lat: 39.4699, lng: -0.3763, province: 'Valencia', region: 'Comunidad Valenciana' },
    { name: 'Sevilla', lat: 37.3891, lng: -5.9845, province: 'Sevilla', region: 'Andalucía' },
    { name: 'Zaragoza', lat: 41.6488, lng: -0.8891, province: 'Zaragoza', region: 'Aragón' },
    { name: 'Málaga', lat: 36.7213, lng: -4.4214, province: 'Málaga', region: 'Andalucía' },
    { name: 'Murcia', lat: 37.9922, lng: -1.1307, province: 'Murcia', region: 'Región de Murcia' },
    { name: 'Palma', lat: 39.5696, lng: 2.6502, province: 'Islas Baleares', region: 'Islas Baleares' },
    { name: 'Las Palmas de Gran Canaria', lat: 28.1236, lng: -15.4366, province: 'Las Palmas', region: 'Canarias' },
    { name: 'Bilbao', lat: 43.2630, lng: -2.9350, province: 'Vizcaya', region: 'País Vasco' },
    { name: 'Alicante', lat: 38.3452, lng: -0.4810, province: 'Alicante', region: 'Comunidad Valenciana' },
    { name: 'Córdoba', lat: 37.8882, lng: -4.7794, province: 'Córdoba', region: 'Andalucía' },
    { name: 'Valladolid', lat: 41.6523, lng: -4.7245, province: 'Valladolid', region: 'Castilla y León' },
    { name: 'Vigo', lat: 42.2406, lng: -8.7207, province: 'Pontevedra', region: 'Galicia' },
    { name: 'Gijón', lat: 43.5453, lng: -5.6617, province: 'Asturias', region: 'Asturias' },
    { name: 'Hospitalet de Llobregat', lat: 41.3598, lng: 2.1008, province: 'Barcelona', region: 'Cataluña' },
    { name: 'A Coruña', lat: 43.3623, lng: -8.4115, province: 'A Coruña', region: 'Galicia' },
    { name: 'Granada', lat: 37.1773, lng: -3.5986, province: 'Granada', region: 'Andalucía' },
    { name: 'Vitoria-Gasteiz', lat: 42.8467, lng: -2.6716, province: 'Álava', region: 'País Vasco' },
    { name: 'Elche', lat: 38.2699, lng: -0.6983, province: 'Alicante', region: 'Comunidad Valenciana' },
    { name: 'Santa Cruz de Tenerife', lat: 28.4636, lng: -16.2518, province: 'Santa Cruz de Tenerife', region: 'Canarias' },
    { name: 'Oviedo', lat: 43.3614, lng: -5.8493, province: 'Asturias', region: 'Asturias' },
    { name: 'Badalona', lat: 41.4502, lng: 2.2445, province: 'Barcelona', region: 'Cataluña' },
    { name: 'Cartagena', lat: 37.6256, lng: -0.9959, province: 'Murcia', region: 'Región de Murcia' },
    { name: 'Terrassa', lat: 41.5633, lng: 2.0087, province: 'Barcelona', region: 'Cataluña' },
    { name: 'Jerez de la Frontera', lat: 36.6866, lng: -6.1369, province: 'Cádiz', region: 'Andalucía' },
    { name: 'Sabadell', lat: 41.5433, lng: 2.1089, province: 'Barcelona', region: 'Cataluña' },
    { name: 'Móstoles', lat: 40.3230, lng: -3.8650, province: 'Madrid', region: 'Comunidad de Madrid' },
    { name: 'Alcalá de Henares', lat: 40.4818, lng: -3.3643, province: 'Madrid', region: 'Comunidad de Madrid' },
    { name: 'Pamplona', lat: 42.8125, lng: -1.6458, province: 'Navarra', region: 'Navarra' },
    { name: 'Fuenlabrada', lat: 40.2842, lng: -3.7947, province: 'Madrid', region: 'Comunidad de Madrid' },
    { name: 'Almería', lat: 36.8381, lng: -2.4597, province: 'Almería', region: 'Andalucía' },
    { name: 'Leganés', lat: 40.3272, lng: -3.7636, province: 'Madrid', region: 'Comunidad de Madrid' },
    { name: 'Donostia-San Sebastián', lat: 43.3183, lng: -1.9812, province: 'Guipúzcoa', region: 'País Vasco' },
    { name: 'Burgos', lat: 42.3439, lng: -3.6969, province: 'Burgos', region: 'Castilla y León' },
    { name: 'Santander', lat: 43.4623, lng: -3.8099, province: 'Cantabria', region: 'Cantabria' },
    { name: 'Castellón de la Plana', lat: 39.9864, lng: -0.0513, province: 'Castellón', region: 'Comunidad Valenciana' },
    { name: 'Albacete', lat: 38.9943, lng: -1.8585, province: 'Albacete', region: 'Castilla-La Mancha' },
    { name: 'Alcorcón', lat: 40.3458, lng: -3.8242, province: 'Madrid', region: 'Comunidad de Madrid' },
    { name: 'Getafe', lat: 40.3057, lng: -3.7327, province: 'Madrid', region: 'Comunidad de Madrid' },
    { name: 'Logroño', lat: 42.4627, lng: -2.4450, province: 'La Rioja', region: 'La Rioja' },
    { name: 'Badajoz', lat: 38.8794, lng: -6.9707, province: 'Badajoz', region: 'Extremadura' },
    { name: 'Salamanca', lat: 40.9701, lng: -5.6635, province: 'Salamanca', region: 'Castilla y León' },
    { name: 'Huelva', lat: 37.2614, lng: -6.9447, province: 'Huelva', region: 'Andalucía' },
    { name: 'Tarragona', lat: 41.1189, lng: 1.2445, province: 'Tarragona', region: 'Cataluña' },
    { name: 'León', lat: 42.5987, lng: -5.5671, province: 'León', region: 'Castilla y León' },
    { name: 'Cádiz', lat: 36.5271, lng: -6.2886, province: 'Cádiz', region: 'Andalucía' },
    { name: 'Jaén', lat: 37.7796, lng: -3.7849, province: 'Jaén', region: 'Andalucía' },
    { name: 'Ourense', lat: 42.3406, lng: -7.8639, province: 'Ourense', region: 'Galicia' },
    { name: 'Marbella', lat: 36.5108, lng: -4.8851, province: 'Málaga', region: 'Andalucía' },
]

export interface CityLocation {
    name: string
    lat: number
    lng: number
    province: string
    region: string
}

export function findCityByName(name: string): CityLocation | undefined {
    return SPANISH_CITIES.find(city =>
        city.name.toLowerCase() === name.toLowerCase()
    )
}

export function searchCities(query: string): CityLocation[] {
    const lowerQuery = query.toLowerCase()
    return SPANISH_CITIES.filter(city =>
        city.name.toLowerCase().includes(lowerQuery) ||
        city.province.toLowerCase().includes(lowerQuery) ||
        city.region.toLowerCase().includes(lowerQuery)
    ).slice(0, 10) // Limitar a 10 resultados
}
