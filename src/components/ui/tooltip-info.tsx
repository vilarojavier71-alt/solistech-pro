'use client'

import React from 'react'
import { Info } from 'lucide-react'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface TooltipInfoProps {
    title?: string
    content: string
    icon?: React.ReactNode
    className?: string
    side?: 'top' | 'right' | 'bottom' | 'left'
    id?: string // Added ID for dictionary lookup
}

/**
 * Componente de tooltip contextual con estilo Dark Premium
 * Muestra información de ayuda al pasar el mouse sobre el icono (i)
 */
export function TooltipInfo({
    title,
    content,
    icon,
    className,
    side = 'top',
    id
}: TooltipInfoProps) {
    let finalContent = content
    let finalTitle = title

    // Dictionary lookup if ID provided
    if (id && TooltipInfoMap[id]) {
        finalContent = TooltipInfoMap[id].content
        finalTitle = TooltipInfoMap[id].title || title
    }

    if (!finalContent) return null

    return (
        <TooltipProvider delayDuration={200}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        className={cn(
                            'inline-flex items-center justify-center',
                            'text-slate-400 hover:text-teal-400',
                            'transition-colors duration-200',
                            'cursor-help',
                            'focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-full',
                            className
                        )}
                        aria-label="Más información"
                        onClick={(e) => e.preventDefault()}
                    >
                        {icon || <Info className="h-4 w-4" />}
                    </button>
                </TooltipTrigger>
                <TooltipContent
                    side={side}
                    className={cn(
                        'max-w-xs p-3',
                        'bg-slate-800/95 backdrop-blur-xl',
                        'border border-white/10',
                        'shadow-lg shadow-black/20',
                        'text-slate-100'
                    )}
                >
                    {finalTitle && (
                        <div className="font-semibold text-teal-400 mb-1 text-sm">
                            {finalTitle}
                        </div>
                    )}
                    <div className="text-xs leading-relaxed whitespace-pre-line">
                        {finalContent}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

// @STUDIO_UXWRITER - Tooltips for technical and fiscal fields
export const TooltipInfoMap: Record<string, { title?: string, content: string }> = {
    // Technical Data
    'system_size_kwp': {
        title: '⚡ Potencia Pico del Sistema',
        content: "Potencia máxima que genera la instalación en condiciones ideales (STC). Es la suma de la potencia de todos los paneles."
    },
    'estimated_production_kwh': {
        title: '☀️ Producción Estimada',
        content: "Energía solar que producirá tu sistema en un año. Calculada según la radiación solar de tu ubicación y la orientación."
    },
    'performance_ratio': {
        title: '⚙️ Rendimiento (PR)',
        content: "Porcentaje de energía que realmente aprovechas vs. la teórica. Un PR del 80% es excelente. Incluye pérdidas por temperatura, cableado, etc."
    },
    'azimuth': {
        title: '🧭 Orientación del Tejado',
        content: "Dirección hacia la que mira el tejado. Óptima: Sur (máxima producción). Aceptable: Sureste/Suroeste (95% producción)."
    },
    'tilt': {
        title: '📐 Inclinación del Tejado',
        content: "Ángulo del tejado respecto al suelo. Óptima España: 30-35°. Plano (0°): -10% producción."
    },
    'roi_years': {
        title: '📈 Retorno de Inversión',
        content: "Años que tardas en recuperar la inversión inicial con los ahorros generados. Bueno: 5-7 años. Excelente: < 5 años."
    },
    'payback_period': {
        title: '💰 Periodo de Amortización',
        content: "Tiempo hasta recuperar el coste de la instalación mediante ahorro en factura y venta de excedentes."
    },
    'custom_attributes': {
        title: '📊 Atributos Personalizados',
        content: "Campos extra de tu Excel que no encajan en columnas estándar. Se guardan en formato flexible para búsquedas futuras."
    },

    // Financial Data
    'annual_consumption': {
        title: '⚡ Consumo Eléctrico Anual',
        content: "Energía que consumes al año. Encuéntralo en tu factura eléctrica (apartado 'Consumo anual'). Valor típico vivienda: 3.000-5.000 kWh/año."
    },
    'cadastral_reference': {
        title: '🏠 Referencia Catastral',
        content: "Código único de tu propiedad (20 caracteres). Necesario para bonificaciones IBI. Encuéntralo en el recibo del IBI o en la Sede Electrónica del Catastro."
    },
    'roof_angle': {
        title: '📐 Ángulo del Tejado',
        content: "Inclinación de tu tejado respecto al suelo. Óptima en España: 30-35°. Tejado plano (0°): -10% producción. Consulta con el instalador si no lo conoces."
    },
    'base_investment': {
        title: '💰 Inversión Base',
        content: "Precio de la instalación sin IVA (21%). Necesario para calcular subvenciones y ROI."
    },

    // Engineering & Solar
    'solar_irradiance': {
        title: '☀️ Energía Solar Disponible',
        content: "Cantidad de luz solar que recibe tu ubicación (kWh/m²/año). Cuanto mayor, más energía producirán tus paneles. España: 1.400-1.900 kWh/m²/año."
    },
    'panel_efficiency': {
        title: '🔋 Eficiencia del Panel',
        content: "Porcentaje de luz solar que el panel convierte en electricidad. Paneles modernos: 20-22%."
    },
    'performance_ratio_detail': {
        title: '⚙️ Performance Ratio (PR)',
        content: "Porcentaje de energía que realmente aprovechas vs. la teórica. Un PR del 80% es excelente."
    },
    'azimuth_detail': {
        title: '🧭 Orientación del Tejado',
        content: "Ángulo respecto al Sur (0° = Sur perfecto). Sur: máxima producción. Este/Oeste: -15% producción."
    },

    // Subsidies & Tax
    'tax_deduction': {
        title: '💰 Ahorro en la Declaración',
        content: "Porcentaje del coste de instalación que te devuelve Hacienda (hasta 60%). Varía según CCAA y tipo de instalación."
    },
    'ibi_bonus': {
        title: '🏠 Bonificación IBI',
        content: "Descuento en el Impuesto de Bienes Inmuebles que ofrecen muchos ayuntamientos por instalar placas solares. Ejemplo: 50% durante 3 años."
    },
    'next_gen_funds': {
        title: '🇪🇺 Fondos Next Generation',
        content: "Ayudas europeas directas al coste de la instalación. Pueden cubrir hasta el 40-50% de la inversión."
    },
    'loss_coefficient': {
        title: '⚙️ Coeficiente de Pérdidas',
        content: "Reducción de rendimiento por sombras, suciedad, temperatura. Valor recomendado: 0.80-0.85 (20-15% de pérdidas)"
    },
    'irpf_deduction': {
        title: '💰 Deducción IRPF',
        content: "Porcentaje que te devuelven en la declaración de la renta.\n• 20%: hasta 12.450€ (máx. 2.490€)\n• 40%: hasta 24.900€ (máx. 9.960€)\n• 60%: hasta 37.350€ (máx. 22.410€)"
    },

    // Fichajes
    'geofence': {
        title: "📍 Cerco Digital de Seguridad",
        content: "Área virtual de 500m alrededor de la obra. Si fichas fuera, el sistema lo detecta y marca como 'ubicación sospechosa' para auditoría."
    },

    'modoOffline': {
        title: "📡 Funciona Sin Cobertura",
        content: "Tus fichajes se guardan en el móvil si no hay internet. Al recuperar conexión, se sincronizan automáticamente.\nIdeal para tejados remotos."
    }
}

/**
 * Tooltips predefinidos para compatibilidad con código antiguo
 */
export const CommonTooltips = {
    irradiancia: <TooltipInfo id="solar_irradiance" content="" />,
    coeficienteK: <TooltipInfo id="loss_coefficient" content="" />,
    irpf: <TooltipInfo id="irpf_deduction" content="" />,
    ibi: <TooltipInfo id="ibi_bonus" content="" />,
    potenciaPico: <TooltipInfo id="system_size_kwp" content="" />,
    orientacion: <TooltipInfo id="azimuth" content="" />,
    inclinacion: <TooltipInfo id="tilt" content="" />,
    roi: <TooltipInfo id="roi_years" content="" />,
    payback: <TooltipInfo id="payback_period" content="" />,
    customAttributes: <TooltipInfo id="custom_attributes" content="" />,

    // Fichajes compatibility
    geofence: <TooltipInfo id="geofence" content="" />,
    modoOffline: <TooltipInfo id="modoOffline" content="" />,
}
