
'use client'

import { motion } from 'framer-motion'
import { Info, MapPin, Calculator, Search } from 'lucide-react'
import { useMunicipalBenefits } from '@/hooks/use-municipal-benefits'
import { BenefitCard } from '@/components/benefits/benefit-card'
import { SearchBar } from '@/components/benefits/search-bar'
import { FilterPanel } from '@/components/benefits/filter-panel'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function BenefitsSearchPage() {
    const {
        data, loading, error, total,
        filters, setQuery, setRegion, setMinIbi
    } = useMunicipalBenefits()

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950">
            {/* Hero Section with Search */}
            <div className="relative overflow-hidden bg-zinc-900 pb-32 pt-16 lg:pt-24">
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/30 via-transparent to-blue-600/20 blur-3xl opacity-50" />

                <div className="relative container mx-auto px-4 text-center z-10">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-bold tracking-tight text-white sm:text-6xl"
                    >
                        Buscador de<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">
                            Ayudas Municipales
                        </span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mt-6 text-lg leading-8 text-zinc-300 max-w-2xl mx-auto"
                    >
                        Encuentra al instante las bonificaciones IBI e ICIO activas en más de 8,000 municipios y calcula tu ahorro real.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mt-10 max-w-2xl mx-auto"
                    >
                        <SearchBar
                            value={filters.q}
                            onChange={setQuery}
                            loading={loading}
                        />
                    </motion.div>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-20 relative z-20 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Filters Sidebar */}
                    <div className="hidden lg:block space-y-6">
                        <div className="sticky top-24">
                            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xl p-6">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <Calculator className="h-5 w-5 text-primary" /> Filtros Avanzados
                                </h3>
                                <FilterPanel
                                    region={filters.region}
                                    onRegionChange={setRegion}
                                    minIbi={parseFloat(filters.min_ibi || '0')}
                                    onMinIbiChange={setMinIbi}
                                />
                            </div>

                            <Card className="mt-6 border-blue-100 bg-blue-50/50 dark:bg-blue-900/20 dark:border-blue-800">
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-blue-900 dark:text-blue-300">¿Sabías qué?</p>
                                            <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                                                El IBI se bonifica anualmente (3-5 años), mientras que el ICIO es un descuento único en la licencia de obra.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Results Grid */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="flex items-center justify-between text-zinc-500 text-sm bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <span>Encontrados <strong>{total}</strong> municipios</span>
                            {filters.region && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {filters.region}</span>}
                        </div>

                        {data.length === 0 && !loading ? (
                            <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
                                <Search className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Sin resultados</h3>
                                <p className="text-zinc-500 mt-1">Intenta ajustar los filtros o buscar otro municipio.</p>
                                <Button variant="link" onClick={() => { setQuery(''); setRegion(''); }} className="mt-4">
                                    Limpiar filtros
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {data.map((benefit) => (
                                    <BenefitCard key={benefit.id} benefit={benefit} />
                                ))}
                            </div>
                        )}

                        {error && (
                            <Alert variant="destructive">
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
