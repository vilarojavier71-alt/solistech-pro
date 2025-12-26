'use client'

import { useState, useEffect } from 'react'
import { Search, MapPin, TrendingUp, Info } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { searchMunicipalitiesFuzzy, autocompleteMunicipalities } from '@/lib/actions/municipal-benefits-search'
import { SPANISH_CITIES, searchCities, type CityLocation } from '@/lib/data/spanish-cities'

interface SearchResult {
    id: string
    municipality: string | null
    province: string | null
    autonomous_community: string
    scope_level: 'region' | 'comarca' | 'municipality'
    similarity_score: number
    ibi_percentage: number
    icio_percentage: number
}

interface AutocompleteOption {
    label: string
    value: string
    province: string | null
    autonomous_community: string
    scope_level: string
}

export function MunicipalBenefitsSearch() {
    const [searchTerm, setSearchTerm] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const [suggestions, setSuggestions] = useState<AutocompleteOption[]>([])
    const [loading, setLoading] = useState(false)
    const [showSuggestions, setShowSuggestions] = useState(false)

    // Estados para selector de ciudades
    const [useTextSearch, setUseTextSearch] = useState(false)
    const [citySearch, setCitySearch] = useState('')
    const [filteredCities, setFilteredCities] = useState<CityLocation[]>(SPANISH_CITIES.slice(0, 10))
    const [selectedCity, setSelectedCity] = useState<string>('')

    // Autocompletado mientras escribe
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchTerm.length >= 2) {
                const { data } = await autocompleteMunicipalities(searchTerm, 5)
                if (data) {
                    setSuggestions(data)
                    setShowSuggestions(true)
                }
            } else {
                setSuggestions([])
                setShowSuggestions(false)
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [searchTerm])

    const handleSearch = async (cityName?: string) => {
        const term = cityName || searchTerm
        if (!term.trim()) return

        setLoading(true)
        setShowSuggestions(false)

        const { data, error } = await searchMunicipalitiesFuzzy(term, 10)

        if (data) {
            setResults(data)
        }

        setLoading(false)
    }

    const handleSuggestionClick = async (suggestion: AutocompleteOption) => {
        setSearchTerm(suggestion.label)
        setShowSuggestions(false)

        // Buscar inmediatamente
        const { data } = await searchMunicipalitiesFuzzy(suggestion.value, 10)
        if (data) {
            setResults(data)
        }
    }

    const getScopeLevelBadge = (level: string) => {
        const badges = {
            'municipality': { label: 'Municipal', variant: 'default' as const },
            'comarca': { label: 'Comarcal', variant: 'secondary' as const },
            'region': { label: 'Regional', variant: 'outline' as const }
        }
        return badges[level as keyof typeof badges] || badges.region
    }

    const calculateEstimatedSavings = (projectCost: number, ibi: number, icio: number) => {
        const ibiAnnual = (projectCost * 0.7 * 0.007) * (ibi / 100)
        const ibiTotal = ibiAnnual * 3 // 3 años promedio
        const icioSavings = (projectCost * 0.03) * (icio / 100)
        return Math.round(ibiTotal + icioSavings)
    }

    return (
        <div className="space-y-6">
            {/* Buscador */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Buscador de Ayudas Municipales
                    </CardTitle>
                    <CardDescription>
                        Encuentra las bonificaciones IBI/ICIO disponibles en tu municipio
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Toggle entre selector y búsqueda */}
                        <div className="flex items-center justify-between">
                            <Label>Método de búsqueda</Label>
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={useTextSearch}
                                    onCheckedChange={setUseTextSearch}
                                />
                                <span className="text-xs text-muted-foreground">
                                    Búsqueda por texto
                                </span>
                            </div>
                        </div>

                        {!useTextSearch ? (
                            /* Selector de ciudades */
                            <>
                                <Input
                                    value={citySearch}
                                    onChange={(e) => {
                                        const query = e.target.value
                                        setCitySearch(query)
                                        if (query.length > 0) {
                                            setFilteredCities(searchCities(query))
                                        } else {
                                            setFilteredCities(SPANISH_CITIES.slice(0, 10))
                                        }
                                    }}
                                    placeholder="Buscar ciudad..."
                                />
                                <Select
                                    value={selectedCity}
                                    onValueChange={(value) => {
                                        setSelectedCity(value)
                                        setSearchTerm(value)
                                        setCitySearch('')
                                        // Buscar automáticamente
                                        handleSearch(value)
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona una ciudad" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredCities.map((city) => (
                                            <SelectItem key={city.name} value={city.name}>
                                                {city.name} ({city.province})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    💡 Selecciona de la lista de 50 ciudades principales de España
                                </p>
                            </>
                        ) : (
                            /* Búsqueda por texto */
                            <div className="relative">
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Input
                                            placeholder="Escribe tu municipio (ej: Zaragoza, Madrid, Barcelona...)"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                            className="pr-10"
                                        />
                                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <button
                                        onClick={() => handleSearch()}
                                        disabled={loading}
                                        className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                                    >
                                        {loading ? 'Buscando...' : 'Buscar'}
                                    </button>
                                </div>

                                {/* Sugerencias de autocompletado */}
                                {showSuggestions && suggestions.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                                        {suggestions.map((suggestion, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleSuggestionClick(suggestion)}
                                                className="w-full px-4 py-2 text-left hover:bg-accent flex items-center justify-between"
                                            >
                                                <span>{suggestion.label}</span>
                                                <Badge variant={getScopeLevelBadge(suggestion.scope_level).variant}>
                                                    {getScopeLevelBadge(suggestion.scope_level).label}
                                                </Badge>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <Alert className="mt-4">
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Tip:</strong> Si tu municipio no aparece, se mostrarán las bonificaciones de tu comarca o región.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>

            {/* Resultados */}
            {results.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Resultados de búsqueda</h3>

                    {results.map((result) => {
                        const badge = getScopeLevelBadge(result.scope_level)
                        const estimatedSavings = calculateEstimatedSavings(15000, result.ibi_percentage, result.icio_percentage)

                        return (
                            <Card key={result.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <MapPin className="h-5 w-5" />
                                                {result.municipality || result.autonomous_community}
                                            </CardTitle>
                                            <CardDescription>
                                                {result.province && `${result.province}, `}
                                                {result.autonomous_community}
                                            </CardDescription>
                                        </div>
                                        <Badge variant={badge.variant}>{badge.label}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* IBI */}
                                        <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                                            <p className="text-sm text-muted-foreground">Bonificación IBI</p>
                                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                {result.ibi_percentage}%
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Durante 3 años (promedio)
                                            </p>
                                        </div>

                                        {/* ICIO */}
                                        <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                                            <p className="text-sm text-muted-foreground">Bonificación ICIO</p>
                                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                {result.icio_percentage}%
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Aplicación única
                                            </p>
                                        </div>

                                        {/* Ahorro estimado */}
                                        <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg">
                                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                <TrendingUp className="h-4 w-4" />
                                                Ahorro Estimado
                                            </p>
                                            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                                {estimatedSavings.toLocaleString()}€
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Para proyecto de 15.000€
                                            </p>
                                        </div>
                                    </div>

                                    {result.similarity_score < 1 && (
                                        <Alert className="mt-4">
                                            <AlertDescription>
                                                <strong>Nota:</strong> Resultado aproximado basado en similitud de texto.
                                                Verifica las ordenanzas fiscales de tu municipio.
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Sin resultados */}
            {!loading && searchTerm && results.length === 0 && (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No se encontraron resultados</h3>
                        <p className="text-muted-foreground mb-4">
                            No hay bonificaciones registradas para "{searchTerm}"
                        </p>
                        <Alert>
                            <AlertDescription>
                                <strong>¿Tu municipio no está?</strong> Puedes reportar las bonificaciones
                                de tu ayuntamiento para que las añadamos a la base de datos.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
