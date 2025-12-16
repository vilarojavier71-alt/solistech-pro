import type pptxgen from 'pptxgenjs'

// Tipos de deducciones fiscales
export type FiscalDeductionType = '20' | '40' | '60'

export interface PresentationData {
    // Cliente y proyecto
    customerName: string
    customerEmail?: string
    projectAddress?: string

    // Sistema técnico
    systemSizeKwp: number
    panelCount: number
    panelModel: string
    inverterModel: string

    // Producción y ahorro
    annualProductionKwh: number
    monthlyProduction: number[] // 12 meses
    currentBillEuros: number
    estimatedSavings: number

    // Financiero
    totalCost: number
    fiscalDeductionType: FiscalDeductionType

    // Subvenciones adicionales (opcional)
    ibiPercentage?: number
    ibiDurationYears?: number
    ibiTotalSavings?: number
    icioPercentage?: number
    icioSavings?: number
    totalSubsidies?: number
    netCost?: number

    // Imágenes
    simulatedPhotoUrl?: string // Foto con placas simuladas por IA

    // Organización
    companyName: string
    companyLogo?: string
}

// Configuración de deducciones fiscales según Hacienda 2024-2025
const FISCAL_DEDUCTIONS = {
    '20': {
        percentage: 20,
        maxAmount: 5000,
        requirement: 'Reducción de demanda de calefacción/refrigeración ≥7%',
        description: 'Deducción del 20% por mejora de eficiencia energética'
    },
    '40': {
        percentage: 40,
        maxAmount: 7500,
        requirement: 'Reducción de consumo de energía primaria no renovable ≥30%',
        description: 'Deducción del 40% por reducción significativa de consumo'
    },
    '60': {
        percentage: 60,
        maxAmount: 15000,
        requirement: 'Rehabilitación integral del edificio',
        description: 'Deducción del 60% por rehabilitación energética completa'
    }
}

// Calcular deducción fiscal
function calculateFiscalDeduction(totalCost: number, type: FiscalDeductionType) {
    const config = FISCAL_DEDUCTIONS[type]
    const deduction = Math.min(totalCost * (config.percentage / 100), config.maxAmount)

    return {
        percentage: config.percentage,
        amount: deduction,
        maxAmount: config.maxAmount,
        requirement: config.requirement,
        description: config.description,
        netCost: totalCost - deduction
    }
}

// Generar presentación PowerPoint
export async function generatePresentation(data: PresentationData): Promise<Buffer> {
    const module = await import('pptxgenjs')
    const PptxGen = module.default
    const pptx = new PptxGen()

    // Configuración global
    pptx.layout = 'LAYOUT_16x9'
    pptx.author = data.companyName
    pptx.title = `Propuesta Solar - ${data.customerName}`

    // Colores corporativos
    const colors = {
        primary: '1F4788',
        secondary: 'F59E0B',
        accent: '10B981',
        text: '1F2937',
        lightGray: 'F3F4F6'
    }

    // 1. PORTADA
    addCoverSlide(pptx, data, colors)

    // 2. PROPUESTA TÉCNICA
    addTechnicalSlide(pptx, data, colors)

    // 3. PRODUCCIÓN ESTIMADA
    addProductionSlide(pptx, data, colors)

    // 4. AHORRO ECONÓMICO
    addSavingsSlide(pptx, data, colors)

    // 5. DEDUCCIONES FISCALES ⭐
    addFiscalDeductionsSlide(pptx, data, colors)

    // 6. SIMULACIÓN VISUAL (si hay imagen generada por IA)
    if (data.simulatedPhotoUrl) {
        addSimulationSlide(pptx, data, colors)
    }

    // 7. PRESUPUESTO
    addBudgetSlide(pptx, data, colors)

    // 8. CIERRE
    addClosingSlide(pptx, data, colors)

    // Generar y retornar buffer
    const buffer = await pptx.write({ outputType: 'arraybuffer' }) as ArrayBuffer
    return Buffer.from(buffer)
}

// DIAPOSITIVA 1: Portada
function addCoverSlide(pptx: pptxgen, data: PresentationData, colors: any) {
    const slide = pptx.addSlide()

    // Fondo degradado
    slide.background = { color: colors.primary }

    // Logo (si existe)
    if (data.companyLogo) {
        slide.addImage({
            path: data.companyLogo,
            x: 0.5,
            y: 0.5,
            w: 2,
            h: 1
        })
    }

    // Título principal
    slide.addText('PROPUESTA DE INSTALACIÓN SOLAR', {
        x: 0.5,
        y: 2.5,
        w: 9,
        h: 1,
        fontSize: 44,
        bold: true,
        color: 'FFFFFF',
        align: 'center'
    })

    // Nombre del cliente
    slide.addText(data.customerName, {
        x: 0.5,
        y: 3.8,
        w: 9,
        h: 0.6,
        fontSize: 28,
        color: colors.secondary,
        align: 'center'
    })

    // Fecha
    slide.addText(new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }), {
        x: 0.5,
        y: 5,
        w: 9,
        h: 0.4,
        fontSize: 16,
        color: 'CCCCCC',
        align: 'center'
    })
}

// DIAPOSITIVA 2: Propuesta Técnica
function addTechnicalSlide(pptx: pptxgen, data: PresentationData, colors: any) {
    const slide = pptx.addSlide()

    slide.addText('PROPUESTA TÉCNICA', {
        x: 0.5,
        y: 0.5,
        fontSize: 32,
        bold: true,
        color: colors.primary
    })

    // Tabla de especificaciones
    const rows = [
        ['Potencia del Sistema', `${data.systemSizeKwp} kWp`],
        ['Número de Paneles', `${data.panelCount} unidades`],
        ['Modelo de Paneles', data.panelModel],
        ['Inversor', data.inverterModel],
        ['Producción Anual Estimada', `${data.annualProductionKwh.toLocaleString()} kWh/año`]
    ]

    slide.addTable(rows as any[], {
        x: 1,
        y: 1.5,
        w: 8,
        rowH: 0.6,
        fontSize: 16,
        border: { pt: 1, color: colors.lightGray },
        fill: { color: 'FFFFFF' },
        color: colors.text,
        valign: 'middle'
    })
}

// DIAPOSITIVA 3: Producción Estimada
function addProductionSlide(pptx: pptxgen, data: PresentationData, colors: any) {
    const slide = pptx.addSlide()

    slide.addText('PRODUCCIÓN ESTIMADA', {
        x: 0.5,
        y: 0.5,
        fontSize: 32,
        bold: true,
        color: colors.primary
    })

    // Gráfico de barras mensual
    const chartData = [{
        name: 'Producción (kWh)',
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
        values: data.monthlyProduction
    }]

    slide.addChart(pptx.ChartType.bar, chartData, {
        x: 1,
        y: 1.5,
        w: 8,
        h: 4,
        barDir: 'col',
        chartColors: [colors.secondary],
        showValue: true,
        valAxisMaxVal: Math.max(...data.monthlyProduction) * 1.2
    })
}

// DIAPOSITIVA 4: Ahorro Económico
function addSavingsSlide(pptx: pptxgen, data: PresentationData, colors: any) {
    const slide = pptx.addSlide()

    slide.addText('AHORRO ECONÓMICO', {
        x: 0.5,
        y: 0.5,
        fontSize: 32,
        bold: true,
        color: colors.primary
    })

    // Comparativa antes/después
    slide.addText('Factura Actual', {
        x: 1.5,
        y: 2,
        fontSize: 20,
        bold: true
    })

    slide.addText(`${data.currentBillEuros}€/mes`, {
        x: 1.5,
        y: 2.6,
        fontSize: 36,
        bold: true,
        color: 'DC2626'
    })

    slide.addText('Ahorro Estimado', {
        x: 5.5,
        y: 2,
        fontSize: 20,
        bold: true
    })

    slide.addText(`${data.estimatedSavings}€/mes`, {
        x: 5.5,
        y: 2.6,
        fontSize: 36,
        bold: true,
        color: colors.accent
    })

    // ROI Anual
    const annualROI = ((data.estimatedSavings * 12 / data.totalCost) * 100).toFixed(1)
    slide.addText(`Rentabilidad anual: ${annualROI}%`, {
        x: 2,
        y: 4.5,
        w: 6,
        fontSize: 18,
        align: 'center',
        color: colors.text
    })
}

// DIAPOSITIVA 5: Deducciones Fiscales ⭐
function addFiscalDeductionsSlide(pptx: pptxgen, data: PresentationData, colors: any) {
    const slide = pptx.addSlide()

    const fiscal = calculateFiscalDeduction(data.totalCost, data.fiscalDeductionType)

    slide.addText('DEDUCCIONES FISCALES IRPF', {
        x: 0.5,
        y: 0.5,
        fontSize: 32,
        bold: true,
        color: colors.primary
    })

    // Deducción aplicable
    slide.addText(`Deducción del ${fiscal.percentage}%`, {
        x: 1,
        y: 1.8,
        w: 8,
        fontSize: 28,
        bold: true,
        align: 'center',
        color: colors.secondary
    })

    // Ahorro fiscal
    slide.addText('Ahorro Fiscal Estimado:', {
        x: 1,
        y: 2.8,
        w: 8,
        fontSize: 20,
        align: 'center'
    })

    slide.addText(`${fiscal.amount.toLocaleString()}€`, {
        x: 1,
        y: 3.3,
        w: 8,
        fontSize: 48,
        bold: true,
        align: 'center',
        color: colors.accent
    })

    // Coste neto final
    slide.addShape(pptx.ShapeType.rect, {
        x: 2,
        y: 4.5,
        w: 6,
        h: 0.8,
        fill: { color: colors.accent }
    })

    slide.addText(`COSTE NETO FINAL: ${fiscal.netCost.toLocaleString()}€`, {
        x: 2,
        y: 4.5,
        w: 6,
        h: 0.8,
        fontSize: 24,
        bold: true,
        color: 'FFFFFF',
        align: 'center',
        valign: 'middle'
    })

    // Requisito
    slide.addText(`Requisito: ${fiscal.requirement}`, {
        x: 1,
        y: 5.5,
        w: 8,
        fontSize: 12,
        italic: true,
        align: 'center',
        color: '666666'
    })

    // Disclaimer
    slide.addText('* Sujeto a certificado de eficiencia energética y normativa vigente', {
        x: 0.5,
        y: 6,
        w: 9,
        fontSize: 10,
        italic: true,
        align: 'center',
        color: '999999'
    })
}

// DIAPOSITIVA 6: Simulación Visual (con IA)
function addSimulationSlide(pptx: pptxgen, data: PresentationData, colors: any) {
    const slide = pptx.addSlide()

    slide.addText('SIMULACIÓN DE SU INSTALACIÓN', {
        x: 0.5,
        y: 0.5,
        fontSize: 32,
        bold: true,
        color: colors.primary
    })

    // Imagen generada por IA
    if (data.simulatedPhotoUrl) {
        slide.addImage({
            path: data.simulatedPhotoUrl,
            x: 1,
            y: 1.5,
            w: 8,
            h: 4.5,
            sizing: { type: 'contain', w: 8, h: 4.5 }
        })
    }
}

// DIAPOSITIVA 7: Presupuesto
function addBudgetSlide(pptx: pptxgen, data: PresentationData, colors: any) {
    const slide = pptx.addSlide()

    slide.addText('PRESUPUESTO', {
        x: 0.5,
        y: 0.5,
        fontSize: 32,
        bold: true,
        color: colors.primary
    })

    const fiscal = calculateFiscalDeduction(data.totalCost, data.fiscalDeductionType)

    // Si tenemos datos de subvenciones adicionales, mostrar tabla completa
    if (data.totalSubsidies && data.netCost) {
        const rows = [
            ['CONCEPTO', 'IMPORTE'],
            ['Inversión Total', `${data.totalCost.toLocaleString()}€`],
            ['', ''],
            ['AYUDAS Y SUBVENCIONES:', ''],
            [`  Deducción IRPF (${fiscal.percentage}%)`, `-${fiscal.amount.toLocaleString()}€`],
        ]

        // Añadir IBI si existe
        if (data.ibiTotalSavings && data.ibiTotalSavings > 0) {
            rows.push([
                `  Bonificación IBI (${data.ibiPercentage}% × ${data.ibiDurationYears} años)`,
                `-${data.ibiTotalSavings.toLocaleString()}€`
            ])
        }

        // Añadir ICIO si existe
        if (data.icioSavings && data.icioSavings > 0) {
            rows.push([
                `  Bonificación ICIO (${data.icioPercentage}%)`,
                `-${data.icioSavings.toLocaleString()}€`
            ])
        }

        rows.push(
            ['', ''],
            ['TOTAL AYUDAS', `-${data.totalSubsidies.toLocaleString()}€`],
            ['', ''],
            ['COSTE NETO FINAL', `${data.netCost.toLocaleString()}€`]
        )

        slide.addTable(rows as any[], {
            x: 1.5,
            y: 1.8,
            w: 7,
            rowH: 0.5,
            fontSize: 16,
            border: { pt: 1, color: colors.lightGray },
            fill: [
                { color: colors.primary },      // Header
                { color: 'FFFFFF' },             // Inversión Total
                { color: 'FFFFFF' },             // Espacio
                { color: 'F3F4F6' },             // "AYUDAS Y SUBVENCIONES"
                { color: 'FFFFFF' },             // IRPF
                ...(data.ibiTotalSavings && data.ibiTotalSavings > 0 ? [{ color: 'FFFFFF' }] : []), // IBI
                ...(data.icioSavings && data.icioSavings > 0 ? [{ color: 'FFFFFF' }] : []),         // ICIO
                { color: 'FFFFFF' },             // Espacio
                { color: 'FEF3C7' },             // Total ayudas (amarillo claro)
                { color: 'FFFFFF' },             // Espacio
                { color: colors.accent }         // Coste neto final (verde)
            ],
            color: [
                'FFFFFF',                        // Header
                colors.text,                     // Inversión Total
                colors.text,                     // Espacio
                colors.primary,                  // "AYUDAS Y SUBVENCIONES"
                colors.text,                     // IRPF
                ...(data.ibiTotalSavings && data.ibiTotalSavings > 0 ? [colors.text] : []),
                ...(data.icioSavings && data.icioSavings > 0 ? [colors.text] : []),
                colors.text,                     // Espacio
                colors.text,                     // Total ayudas
                colors.text,                     // Espacio
                'FFFFFF'                         // Coste neto final
            ],
            bold: [
                true,                            // Header
                true,                            // Inversión Total
                false,                           // Espacio
                true,                            // "AYUDAS Y SUBVENCIONES"
                false,                           // IRPF
                ...(data.ibiTotalSavings && data.ibiTotalSavings > 0 ? [false] : []),
                ...(data.icioSavings && data.icioSavings > 0 ? [false] : []),
                false,                           // Espacio
                true,                            // Total ayudas
                false,                           // Espacio
                true                             // Coste neto final
            ],
            valign: 'middle',
            align: 'center'
        })

        // Nota informativa
        slide.addText('* Las ayudas están sujetas a cumplimiento de requisitos legales y disponibilidad presupuestaria', {
            x: 1,
            y: 5.8,
            w: 8,
            fontSize: 10,
            italic: true,
            align: 'center',
            color: '666666'
        })

    } else {
        // Tabla simplificada (solo IRPF) - fallback si no hay datos completos
        const rows = [
            ['CONCEPTO', 'IMPORTE'],
            ['Inversión Total', `${data.totalCost.toLocaleString()}€`],
            [`Deducción IRPF (${fiscal.percentage}%)`, `-${fiscal.amount.toLocaleString()}€`],
            ['COSTE NETO FINAL', `${fiscal.netCost.toLocaleString()}€`]
        ]

        slide.addTable(rows as any[], {
            x: 2,
            y: 2,
            w: 6,
            rowH: 0.7,
            fontSize: 18,
            border: { pt: 1, color: colors.lightGray },
            fill: [
                { color: colors.primary },
                { color: 'FFFFFF' },
                { color: 'FFFFFF' },
                { color: colors.accent }
            ],
            color: [
                'FFFFFF',
                colors.text,
                colors.text,
                'FFFFFF'
            ],
            bold: [true, false, false, true],
            valign: 'middle',
            align: 'center'
        })
    }
}

// DIAPOSITIVA 8: Cierre mejorado con CTA optimizado
function addClosingSlide(pptx: pptxgen, data: PresentationData, colors: any) {
    const slide = pptx.addSlide()

    // Fondo degradado
    slide.background = { fill: colors.primary }

    // Título principal
    slide.addText('¿LISTO PARA DAR EL PASO?', {
        x: 0.5,
        y: 1.5,
        w: 9,
        h: 1,
        fontSize: 44,
        bold: true,
        color: 'FFFFFF',
        align: 'center'
    })

    // Subtítulo persuasivo
    slide.addText('Empieza a ahorrar desde el primer día', {
        x: 0.5,
        y: 2.5,
        w: 9,
        h: 0.5,
        fontSize: 24,
        color: colors.secondary,
        align: 'center'
    })

    // Beneficios clave
    const benefits = [
        '✓ Instalación profesional garantizada',
        '✓ Financiación disponible',
        '✓ Gestión completa de ayudas y subvenciones',
        '✓ Mantenimiento y soporte incluido'
    ]

    benefits.forEach((benefit, index) => {
        slide.addText(benefit, {
            x: 2,
            y: 3.5 + (index * 0.4),
            w: 6,
            fontSize: 16,
            color: 'FFFFFF',
            align: 'center'
        })
    })

    // QR Code placeholder (en producción, generar QR real)
    slide.addShape(pptx.ShapeType.rect, {
        x: 4,
        y: 5.5,
        w: 2,
        h: 2,
        fill: { color: 'FFFFFF' }
    })

    slide.addText('📱', {
        x: 4,
        y: 6,
        w: 2,
        h: 1,
        fontSize: 60,
        align: 'center'
    })

    // Texto del QR
    slide.addText('Escanea para agendar tu visita técnica GRATUITA', {
        x: 0.5,
        y: 7.7,
        w: 9,
        fontSize: 14,
        color: 'FFFFFF',
        align: 'center',
        italic: true
    })

    // Datos de contacto
    slide.addText(`${data.companyName} | Energía Solar Profesional`, {
        x: 0.5,
        y: 8.3,
        w: 9,
        fontSize: 12,
        color: 'CCCCCC',
        align: 'center'
    })
}
