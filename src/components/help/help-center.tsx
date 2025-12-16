"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    ChevronRight,
    Search,
    FileSpreadsheet,
    Sparkles,
    MapPin,
    Calculator,
    Users,
    Shield,
    Receipt,
    FileText,
    HelpCircle
} from 'lucide-react'
import Link from 'next/link'
import { HELP_TOPICS, HelpTopic } from './help-data'
import { cn } from '@/lib/utils'

// Icon mapping based on string names
const iconMap = {
    FileSpreadsheet,
    Sparkles,
    MapPin,
    Calculator,
    Users,
    Shield,
    Receipt,
    FileText
}

export function HelpCenter() {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

    // Filter logic
    const filteredTopics = HELP_TOPICS.filter(topic => {
        const matchesSearch =
            topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            topic.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            topic.steps.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))

        const matchesCategory = selectedCategory ? topic.category === selectedCategory : true

        return matchesSearch && matchesCategory
    })

    const categories = [
        { id: 'basics', label: 'Básicos' },
        { id: 'tools', label: 'Herramientas' },
        { id: 'troubleshooting', label: 'Resolución de Problemas' },
        { id: 'admin', label: 'Administración' }
    ]

    return (
        <div className="space-y-8">
            {/* Search & Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar guías (ej: GPS, Excel, Usuario)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-slate-900/50 border-slate-700 focus:border-cyan-500 transition-colors"
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto scrollbar-hide">
                    <Button
                        variant={selectedCategory === null ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(null)}
                        className={cn(
                            selectedCategory === null ? "bg-cyan-600 hover:bg-cyan-700" : "hover:text-cyan-400"
                        )}
                    >
                        Todos
                    </Button>
                    {categories.map(cat => (
                        <Button
                            key={cat.id}
                            variant={selectedCategory === cat.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedCategory(cat.id)}
                            className={cn(
                                "whitespace-nowrap",
                                selectedCategory === cat.id ? "bg-cyan-600 hover:bg-cyan-700" : "hover:text-cyan-400"
                            )}
                        >
                            {cat.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Content Grid */}
            {filteredTopics.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTopics.map((topic) => (
                        <HelpCard key={topic.id} topic={topic} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-slate-900/30 rounded-lg border border-dashed border-slate-700">
                    <HelpCircle className="mx-auto h-12 w-12 text-slate-600 mb-4" />
                    <h3 className="text-xl font-medium text-slate-300">No se encontraron guías</h3>
                    <p className="text-slate-500">Prueba con otros términos de búsqueda</p>
                    <Button
                        variant="link"
                        onClick={() => { setSearchTerm(''); setSelectedCategory(null) }}
                        className="mt-2 text-cyan-500"
                    >
                        Limpiar filtros
                    </Button>
                </div>
            )}
        </div>
    )
}

function HelpCard({ topic }: { topic: HelpTopic }) {
    const Icon = iconMap[topic.iconName] || HelpCircle

    return (
        <Card className="flex flex-col border-slate-700 bg-slate-900/50 hover:bg-slate-900/70 hover:border-slate-600 transition-all duration-300 group shadow-lg shadow-black/20">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 group-hover:text-cyan-300 transition-colors">
                        <Icon className="size-6" />
                    </div>
                </div>
                <CardTitle className="mt-4 text-lg font-semibold text-slate-100 group-hover:text-cyan-100 transition-colors">
                    {topic.title}
                </CardTitle>
                <CardDescription className="text-slate-400 line-clamp-2">
                    {topic.description}
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 flex-1">
                {/* Steps Accordion-like visual */}
                <div className="bg-slate-950/30 rounded-md p-3 border border-slate-800/50">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Pasos</h4>
                    <ol className="space-y-2">
                        {topic.steps.slice(0, 3).map((step, i) => (
                            <li key={i} className="text-sm text-slate-300 flex gap-2">
                                <span className="text-cyan-600 font-mono text-xs mt-0.5">{(i + 1).toString().padStart(2, '0')}</span>
                                <span className="line-clamp-2">{step.replace(/^\d+\.\s/, '')}</span>
                            </li>
                        ))}
                        {topic.steps.length > 3 && (
                            <li className="text-xs text-slate-500 pt-1 italic">... y {topic.steps.length - 3} pasos más</li>
                        )}
                    </ol>
                </div>

                {/* Status/Tips */}
                <div className="flex flex-wrap gap-2">
                    {topic.tips.slice(0, 2).map((tip, i) => (
                        <Badge key={i} variant="secondary" className="bg-slate-800 text-slate-300 border-none font-normal text-xs">
                            {tip.replace(/^[✅⚠️💡]/, '').trim().substring(0, 25) + '...'}
                        </Badge>
                    ))}
                </div>
            </CardContent>

            <CardFooter className="pt-2">
                <Button asChild className="w-full bg-gradient-to-r from-slate-800 to-slate-900 hover:from-cyan-900 hover:to-teal-900 border border-slate-700 hover:border-cyan-700/50 text-slate-200 hover:text-white transition-all duration-300">
                    <Link href={topic.cta.link}>
                        <span className="mr-2">{topic.cta.text}</span>
                        <ChevronRight className="size-4" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    )
}
