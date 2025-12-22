import { z } from "zod"
import { ImportConfigDefinition } from "../lib/import-engine/types"

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDADORES REUTILIZABLES
// ═══════════════════════════════════════════════════════════════════════════════

const phoneValidator = z.string()
    .transform(val => val.replace(/[\s\-\(\)]/g, ''))
    .refine(val => /^[\+]?[\d]{9,15}$/.test(val), "Teléfono inválido")

const nifValidator = z.string()
    .transform(val => val.toUpperCase().trim())
    .refine(val => /^[0-9A-Z]{8,12}[A-Z]?$/i.test(val), "NIF/CIF inválido")

const currencyValidator = z.string()
    .transform(val => {
        // Convertir "1.500,00 €" o "1500" a número
        const cleaned = val.replace(/[€$\s]/g, '').replace('.', '').replace(',', '.')
        return parseFloat(cleaned) || 0
    })

const dateValidator = z.string()
    .transform(val => {
        // Intentar parsear DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
        if (!val) return null
        const parts = val.split(/[\/\-]/)
        if (parts.length === 3) {
            // Si el primer elemento tiene 4 dígitos, es YYYY-MM-DD
            if (parts[0].length === 4) {
                return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
            }
            // Si no, es DD/MM/YYYY
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
        }
        return val
    })

const documentStatusValidator = z.enum(['pendiente', 'guardado', 'enviado', 'aprobado', 'rechazado', ''])
    .transform(val => val || 'pendiente')

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIG: IMPORTACIÓN COMPLETA DE CLIENTES/EXPEDIENTES
// ═══════════════════════════════════════════════════════════════════════════════

export const CustomerImportConfig: ImportConfigDefinition = {
    id: 'import_customers_v2',
    targetModel: 'customers',
    label: 'Importación de Clientes y Expedientes',
    identityFields: ['vat_number', 'email'], // Deduplicación por DNI o Email
    defaultDuplicateStrategy: 'skip',
    fields: [
        // ─────────────────────────────────────────────────────────────────────────
        // DATOS PERSONALES
        // ─────────────────────────────────────────────────────────────────────────
        {
            key: 'full_name',
            label: 'Nombre Completo',
            type: 'string',
            required: true,
            aliases: ['nombre', 'name', 'cliente', 'razon_social', 'nombre_cliente'],
            validation: z.string().min(2, "El nombre es muy corto")
        },
        {
            key: 'email',
            label: 'Correo Electrónico',
            type: 'email',
            required: false,
            aliases: ['correo', 'mail', 'e-mail', 'email_cliente'],
            validation: z.string().email("Email inválido").or(z.literal(''))
        },
        {
            key: 'phone',
            label: 'Teléfono',
            type: 'phone',
            required: true,
            aliases: ['telefono', 'celular', 'movil', 'tlf', 'tel'],
            validation: phoneValidator
        },
        {
            key: 'vat_number',
            label: 'DNI/NIF/CIF',
            type: 'string',
            required: true,
            aliases: ['nif', 'cif', 'dni', 'identificacion', 'documento'],
            validation: nifValidator
        },
        {
            key: 'address',
            label: 'Dirección',
            type: 'string',
            required: false,
            aliases: ['direccion', 'domicilio', 'calle', 'direccion_completa']
        },
        {
            key: 'postal_code',
            label: 'Código Postal',
            type: 'string',
            required: false,
            aliases: ['cp', 'codigo_postal', 'zip']
        },
        {
            key: 'city',
            label: 'Ciudad',
            type: 'string',
            required: false,
            aliases: ['ciudad', 'localidad', 'poblacion', 'municipio']
        },
        {
            key: 'province',
            label: 'Provincia',
            type: 'string',
            required: false,
            aliases: ['provincia', 'state', 'region']
        },
        {
            key: 'type',
            label: 'Tipo de Cliente',
            type: 'select',
            required: false,
            defaultValue: 'residential',
            options: [
                { label: 'Residencial', value: 'residential' },
                { label: 'Empresa', value: 'business' },
                { label: 'Industrial', value: 'industrial' }
            ],
            aliases: ['tipo', 'tipo_cliente', 'categoria']
        },

        // ─────────────────────────────────────────────────────────────────────────
        // DATOS TÉCNICOS
        // ─────────────────────────────────────────────────────────────────────────
        {
            key: 'has_electric_charger',
            label: 'Cargador Eléctrico',
            type: 'boolean',
            required: false,
            aliases: ['cargador_electrico', 'cargador', 'ev_charger', 'wallbox'],
            validation: z.boolean().optional()
        },
        {
            key: 'moves_needed',
            label: 'Moves Necesarios',
            type: 'boolean',
            required: false,
            aliases: ['moves_necesarios', 'moves', 'traslados'],
            validation: z.boolean().optional()
        },
        {
            key: 'engineer_name',
            label: 'Ingeniero Asignado',
            type: 'string',
            required: false,
            aliases: ['ingeniero', 'engineer', 'tecnico_responsable']
        },
        {
            key: 'installer_name',
            label: 'Instalador Asignado',
            type: 'string',
            required: false,
            aliases: ['instalador', 'installer', 'empresa_instaladora']
        },

        // ─────────────────────────────────────────────────────────────────────────
        // ESTADOS DOCUMENTALES (CEE, CIE, DROU)
        // ─────────────────────────────────────────────────────────────────────────
        {
            key: 'cee_1_status',
            label: '1º CEE Estado',
            type: 'select',
            required: false,
            options: [
                { label: 'Pendiente', value: 'pendiente' },
                { label: 'Guardado', value: 'guardado' },
                { label: 'Enviado', value: 'enviado' },
                { label: 'Aprobado', value: 'aprobado' }
            ],
            aliases: ['1_cee', 'cee1', 'primer_cee', 'certificado_1'],
            validation: documentStatusValidator
        },
        {
            key: 'cee_2_status',
            label: '2º CEE Estado',
            type: 'select',
            required: false,
            options: [
                { label: 'Pendiente', value: 'pendiente' },
                { label: 'Guardado', value: 'guardado' },
                { label: 'Enviado', value: 'enviado' },
                { label: 'Aprobado', value: 'aprobado' }
            ],
            aliases: ['2_cee', 'cee2', 'segundo_cee', 'certificado_2'],
            validation: documentStatusValidator
        },
        {
            key: 'cie_status',
            label: 'CIE Estado',
            type: 'select',
            required: false,
            options: [
                { label: 'Pendiente', value: 'pendiente' },
                { label: 'Guardado', value: 'guardado' },
                { label: 'Enviado', value: 'enviado' },
                { label: 'Aprobado', value: 'aprobado' }
            ],
            aliases: ['cie', 'certificado_instalacion', 'cie_estado'],
            validation: documentStatusValidator
        },
        {
            key: 'drou_status',
            label: 'DROU Estado',
            type: 'select',
            required: false,
            options: [
                { label: 'Pendiente', value: 'pendiente' },
                { label: 'Guardado', value: 'guardado' },
                { label: 'Enviado', value: 'enviado' },
                { label: 'Aprobado', value: 'aprobado' }
            ],
            aliases: ['drou', 'declaracion_responsable', 'drou_estado'],
            validation: documentStatusValidator
        },

        // ─────────────────────────────────────────────────────────────────────────
        // DATOS FINANCIEROS
        // ─────────────────────────────────────────────────────────────────────────
        {
            key: 'budget_amount',
            label: 'Importe Presupuesto',
            type: 'currency',
            required: false,
            aliases: ['importe_presupuesto', 'presupuesto', 'budget', 'precio_total', 'importe'],
            validation: currencyValidator
        },
        {
            key: 'amount_pending',
            label: 'Importe Pendiente',
            type: 'currency',
            required: false,
            aliases: ['importe_pendiente', 'pendiente', 'a_deber', 'deuda', 'saldo'],
            validation: currencyValidator
        },
        {
            key: 'payment_status',
            label: 'Estado de Pago',
            type: 'select',
            required: false,
            options: [
                { label: 'Pendiente', value: 'pending' },
                { label: 'Parcial', value: 'partial' },
                { label: 'Pagado', value: 'paid' }
            ],
            aliases: ['estado_pago', 'pago', 'cobrado'],
            validation: z.enum(['pending', 'partial', 'paid', '']).transform(v => v || 'pending')
        },

        // ─────────────────────────────────────────────────────────────────────────
        // FECHAS
        // ─────────────────────────────────────────────────────────────────────────
        {
            key: 'installation_date',
            label: 'Fecha Instalación',
            type: 'date',
            required: false,
            aliases: ['fecha_instalacion', 'fecha_install', 'install_date', 'fecha'],
            validation: dateValidator
        },
        {
            key: 'contract_date',
            label: 'Fecha Contrato',
            type: 'date',
            required: false,
            aliases: ['fecha_contrato', 'contract_date', 'fecha_firma'],
            validation: dateValidator
        },

        // ─────────────────────────────────────────────────────────────────────────
        // OTROS
        // ─────────────────────────────────────────────────────────────────────────
        {
            key: 'expedient_number',
            label: 'Nº Expediente',
            type: 'string',
            required: false,
            aliases: ['expediente', 'numero_expediente', 'ref', 'referencia']
        },
        {
            key: 'notes',
            label: 'Notas / Observaciones',
            type: 'string',
            required: false,
            aliases: ['notas', 'observaciones', 'comentarios', 'notes']
        }
    ]
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIG: IMPORTACIÓN DE LEADS
// ═══════════════════════════════════════════════════════════════════════════════

export const LeadImportConfig: ImportConfigDefinition = {
    id: 'import_leads_v1',
    targetModel: 'leads',
    label: 'Importación de Leads',
    identityFields: ['email', 'phone'],
    defaultDuplicateStrategy: 'skip',
    fields: [
        {
            key: 'name',
            label: 'Nombre',
            type: 'string',
            required: true,
            aliases: ['nombre', 'cliente', 'contacto'],
            validation: z.string().min(2)
        },
        {
            key: 'email',
            label: 'Email',
            type: 'email',
            required: false,
            aliases: ['correo', 'mail']
        },
        {
            key: 'phone',
            label: 'Teléfono',
            type: 'phone',
            required: false,
            aliases: ['telefono', 'movil', 'tlf'],
            validation: phoneValidator.optional()
        },
        {
            key: 'source',
            label: 'Origen',
            type: 'select',
            required: false,
            options: [
                { label: 'Web', value: 'web' },
                { label: 'Referido', value: 'referral' },
                { label: 'Publicidad', value: 'ads' },
                { label: 'Otro', value: 'other' }
            ],
            aliases: ['origen', 'fuente', 'canal']
        },
        {
            key: 'status',
            label: 'Estado',
            type: 'select',
            required: false,
            defaultValue: 'new',
            options: [
                { label: 'Nuevo', value: 'new' },
                { label: 'Contactado', value: 'contacted' },
                { label: 'Calificado', value: 'qualified' },
                { label: 'Propuesta', value: 'proposal' },
                { label: 'Ganado', value: 'won' },
                { label: 'Perdido', value: 'lost' }
            ],
            aliases: ['estado', 'fase']
        },
        {
            key: 'estimated_value',
            label: 'Valor Estimado',
            type: 'currency',
            required: false,
            aliases: ['valor', 'importe', 'presupuesto'],
            validation: currencyValidator
        },
        {
            key: 'notes',
            label: 'Notas',
            type: 'string',
            required: false,
            aliases: ['notas', 'comentarios', 'observaciones']
        }
    ]
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIG: IMPORTACIÓN DE COMPONENTES/INVENTARIO
// ═══════════════════════════════════════════════════════════════════════════════

export const ComponentImportConfig: ImportConfigDefinition = {
    id: 'import_components_v1',
    targetModel: 'components',
    label: 'Importación de Componentes',
    identityFields: ['manufacturer', 'model'],
    defaultDuplicateStrategy: 'update',
    fields: [
        {
            key: 'manufacturer',
            label: 'Fabricante',
            type: 'string',
            required: true,
            aliases: ['fabricante', 'marca', 'brand']
        },
        {
            key: 'model',
            label: 'Modelo',
            type: 'string',
            required: true,
            aliases: ['modelo', 'referencia', 'ref']
        },
        {
            key: 'type',
            label: 'Tipo',
            type: 'select',
            required: true,
            options: [
                { label: 'Panel', value: 'panel' },
                { label: 'Inversor', value: 'inverter' },
                { label: 'Batería', value: 'battery' },
                { label: 'Estructura', value: 'mounting' },
                { label: 'Optimizador', value: 'optimizer' },
                { label: 'Otro', value: 'other' }
            ],
            aliases: ['tipo', 'categoria', 'category']
        },
        {
            key: 'price',
            label: 'Precio',
            type: 'currency',
            required: true,
            aliases: ['precio', 'pvp', 'coste'],
            validation: currencyValidator
        },
        {
            key: 'stock_quantity',
            label: 'Stock',
            type: 'number',
            required: false,
            aliases: ['stock', 'cantidad', 'unidades'],
            validation: z.number().int().min(0).optional()
        }
    ]
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIG: IMPORTACIÓN DE VISITAS/CITAS TÉCNICAS
// ═══════════════════════════════════════════════════════════════════════════════

// Validador de hora (HH:MM o H:MM)
const timeValidator = z.string()
    .transform(val => {
        if (!val) return null
        // Normalizar "9:30" a "09:30"
        const match = val.match(/^(\d{1,2}):(\d{2})$/)
        if (match) {
            return `${match[1].padStart(2, '0')}:${match[2]}`
        }
        return val
    })

// Validador de estado de visita
const visitStatusValidator = z.enum(['scheduled', 'in_progress', 'completed', 'cancelled', 'incident', ''])
    .transform(val => val || 'scheduled')

export const VisitImportConfig: ImportConfigDefinition = {
    id: 'import_visits_v1',
    targetModel: 'appointments',
    label: 'Importación de Visitas Técnicas',
    identityFields: ['customer_name', 'visit_date'], // Detectar duplicados por cliente+fecha
    defaultDuplicateStrategy: 'ask', // Preguntar si es segunda visita
    fields: [
        // ─────────────────────────────────────────────────────────────────────────
        // IDENTIFICACIÓN DEL CLIENTE
        // ─────────────────────────────────────────────────────────────────────────
        {
            key: 'customer_name',
            label: 'Nombre Cliente',
            type: 'string',
            required: true,
            aliases: ['nombre', 'cliente', 'nombre_cliente', 'contacto'],
            validation: z.string().min(2, "El nombre es muy corto")
        },
        {
            key: 'customer_phone',
            label: 'Teléfono Cliente',
            type: 'phone',
            required: false,
            aliases: ['telefono', 'movil', 'tlf', 'tel', 'phone'],
            validation: phoneValidator.optional()
        },

        // ─────────────────────────────────────────────────────────────────────────
        // UBICACIÓN / LOGÍSTICA
        // ─────────────────────────────────────────────────────────────────────────
        {
            key: 'town',
            label: 'Pueblo / Localidad',
            type: 'string',
            required: true,
            aliases: ['pueblo', 'localidad', 'ciudad', 'poblacion', 'municipio'],
            validation: z.string().min(2)
        },
        {
            key: 'address',
            label: 'Dirección Exacta',
            type: 'string',
            required: false,
            aliases: ['direccion', 'calle', 'domicilio', 'ubicacion']
        },
        {
            key: 'postal_code',
            label: 'Código Postal',
            type: 'string',
            required: false,
            aliases: ['cp', 'codigo_postal', 'zip']
        },

        // ─────────────────────────────────────────────────────────────────────────
        // TEMPORALIDAD
        // ─────────────────────────────────────────────────────────────────────────
        {
            key: 'visit_date',
            label: 'Fecha de Visita',
            type: 'date',
            required: true,
            aliases: ['fecha', 'fecha_visita', 'dia', 'date'],
            validation: dateValidator
        },
        {
            key: 'scheduled_time',
            label: 'Hora Programada',
            type: 'string',
            required: false,
            aliases: ['hora', 'hora_visita', 'hora_programada', 'time'],
            validation: timeValidator
        },
        {
            key: 'check_in_time',
            label: 'Hora Pica (Llegada)',
            type: 'string',
            required: false,
            aliases: ['hora_pica', 'hora_llegada', 'check_in', 'pica'],
            validation: timeValidator
        },
        {
            key: 'check_out_time',
            label: 'Hora Salida',
            type: 'string',
            required: false,
            aliases: ['hora_salida', 'check_out', 'fin'],
            validation: timeValidator
        },

        // ─────────────────────────────────────────────────────────────────────────
        // ESTADO Y TIPO
        // ─────────────────────────────────────────────────────────────────────────
        {
            key: 'status',
            label: 'Estado Visita',
            type: 'select',
            required: false,
            defaultValue: 'scheduled',
            options: [
                { label: 'Agendada', value: 'scheduled' },
                { label: 'En Curso', value: 'in_progress' },
                { label: 'Realizada', value: 'completed' },
                { label: 'Cancelada', value: 'cancelled' },
                { label: 'Incidencia', value: 'incident' }
            ],
            aliases: ['estado', 'estado_visita', 'situacion'],
            validation: visitStatusValidator
        },
        {
            key: 'visit_type',
            label: 'Tipo de Visita',
            type: 'select',
            required: false,
            defaultValue: 'technical',
            options: [
                { label: 'Técnica', value: 'technical' },
                { label: 'Comercial', value: 'commercial' },
                { label: 'Instalación', value: 'installation' },
                { label: 'Revisión', value: 'review' },
                { label: 'Incidencia', value: 'incident' }
            ],
            aliases: ['tipo', 'tipo_visita', 'motivo']
        },

        // ─────────────────────────────────────────────────────────────────────────
        // ASIGNACIÓN
        // ─────────────────────────────────────────────────────────────────────────
        {
            key: 'technician_name',
            label: 'Técnico Asignado',
            type: 'string',
            required: false,
            aliases: ['tecnico', 'instalador', 'asignado', 'responsable']
        },

        // ─────────────────────────────────────────────────────────────────────────
        // OBSERVACIONES
        // ─────────────────────────────────────────────────────────────────────────
        {
            key: 'notes',
            label: 'Notas / Observaciones',
            type: 'string',
            required: false,
            aliases: ['notas', 'observaciones', 'comentarios', 'descripcion']
        },
        {
            key: 'incident_description',
            label: 'Descripción Incidencia',
            type: 'string',
            required: false,
            aliases: ['incidencia', 'problema', 'issue']
        }
    ]
}

// ═══════════════════════════════════════════════════════════════════════════════
// REGISTRO DE CONFIGURACIONES
// ═══════════════════════════════════════════════════════════════════════════════

export const IMPORT_REGISTRY: Record<string, ImportConfigDefinition> = {
    [CustomerImportConfig.id]: CustomerImportConfig,
    [LeadImportConfig.id]: LeadImportConfig,
    [ComponentImportConfig.id]: ComponentImportConfig,
    [VisitImportConfig.id]: VisitImportConfig,
}

// Helper para obtener config por modelo
export function getImportConfigByModel(model: string): ImportConfigDefinition | undefined {
    return Object.values(IMPORT_REGISTRY).find(config => config.targetModel === model)
}


