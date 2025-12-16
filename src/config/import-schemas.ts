import { z } from "zod"
import { ImportConfigDefinition } from "../lib/import-engine/types"

// Reusable Validators
const phoneValidator = z.string().transform(val => val.replace(/[\s\-\(\)]/g, '')).refine(val => /^[\+]?[\d]{9,15}$/.test(val), "Teléfono inválido")
const nifValidator = z.string().transform(val => val.toUpperCase().trim()) // Add strict NIF algorithm if needed

/**
 * CONFIG: CUSTOMER IMPORT
 */
export const CustomerImportConfig: ImportConfigDefinition = {
    id: 'import_customers_v1',
    targetModel: 'customers',
    label: 'Importación de Clientes',
    identityFields: ['email'], // Primary key for duplicates
    defaultDuplicateStrategy: 'skip',
    fields: [
        {
            key: 'full_name',
            label: 'Nombre Completo',
            type: 'string',
            required: true,
            aliases: ['nombre', 'name', 'cliente', 'razon_social'],
            validation: z.string().min(2, "El nombre es muy corto")
        },
        {
            key: 'email',
            label: 'Correo Electrónico',
            type: 'email',
            required: false,
            aliases: ['correo', 'mail', 'e-mail'],
            validation: z.string().email("Email inválido").or(z.literal(''))
        },
        {
            key: 'phone',
            label: 'Teléfono',
            type: 'phone',
            required: false,
            aliases: ['telefono', 'celular', 'movil'],
            validation: phoneValidator.optional().or(z.literal(''))
        },
        {
            key: 'vat_number',
            label: 'NIF/CIF',
            type: 'string',
            required: false,
            aliases: ['nif', 'cif', 'dni', 'identificacion'],
            validation: nifValidator.optional()
        },
        {
            key: 'address',
            label: 'Dirección',
            type: 'string',
            required: false,
            aliases: ['direccion', 'domicilio', 'calle']
        },
        {
            key: 'type',
            label: 'Tipo de Cliente',
            type: 'select',
            required: true,
            defaultValue: 'residential',
            options: [
                { label: 'Residencial', value: 'residential' },
                { label: 'Empresa', value: 'business' },
                { label: 'Industrial', value: 'industrial' }
            ],
            validation: z.enum(['residential', 'business', 'industrial'])
        }
    ]
}

/**
 * REGISTRY OF ALL CONFIGS
 */
export const IMPORT_REGISTRY: Record<string, ImportConfigDefinition> = {
    [CustomerImportConfig.id]: CustomerImportConfig,
    // Add more configs here...
}
