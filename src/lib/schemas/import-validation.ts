import { z } from "zod"
import { validateSpanishNIF } from "@/lib/security/import-security"

// Basic reusable schemas
const phoneSchema = z.string().transform(val => {
    return val.replace(/[\s\-\(\)]/g, '')
}).refine(val => /^[\+]?[\d]{9,15}$/.test(val), {
    message: "Teléfono inválido (mín. 9 dígitos)"
})

const nifSchema = z.string().transform(val => {
    return val.toUpperCase().trim()
}).refine(validateSpanishNIF, {
    message: "NIF/CIF/NIE inválido"
})

const emailSchema = z.string().email("Email inválido").transform(val => val.toLowerCase().trim())

const dateSchema = z.preprocess((arg) => {
    if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
    return arg;
}, z.date({ invalid_type_error: "Fecha inválida" }));

const currencySchema = z.preprocess((val) => {
    if (typeof val === 'string') return parseFloat(val.replace(',', '.'));
    return Number(val);
}, z.number().safe("Debe ser un número válido"));


// ENTITY SCHEMAS

export const CustomerImportSchema = z.object({
    full_name: z.string().min(2, "Nombre requerido"),
    email: emailSchema.optional().or(z.literal("")),
    phone: phoneSchema.optional().or(z.literal("")),
    vat_number: nifSchema.optional().or(z.literal("")), // cif/nif
    address: z.string().optional(),
    city: z.string().optional(),
    postal_code: z.string().regex(/^\d{5}$/, "CP debe ser 5 dígitos").optional().or(z.literal("")),
})

export const ProjectImportSchema = z.object({
    name: z.string().min(3, "Nombre de proyecto requerido"),
    address: z.string().optional(),
    status: z.enum(['draft', 'in_progress', 'completed', 'cancelled']).default('draft'),
    start_date: dateSchema.optional(),
})

export const StockImportSchema = z.object({
    sku: z.string().min(3, "SKU requerido"),
    product_name: z.string().min(3, "Nombre producto requerido"),
    quantity: z.number().int().min(0),
    min_stock: z.number().int().min(0).default(5),
    cost_price: currencySchema.optional(),
    selling_price: currencySchema.optional(),
    category: z.string().optional(),
    location: z.string().optional()
})

export const SaleImportSchema = z.object({
    customer_email: emailSchema.optional(), // To link with customer
    customer_name: z.string().optional(),
    sale_date: dateSchema.default(() => new Date()),
    amount: currencySchema,
    status: z.enum(['pending', 'completed', 'cancelled']).default('completed'),
    concept: z.string().optional()
})

// MAPPING FOR DYNAMIC SELECTION
export const SCHEMA_MAP = {
    customers: CustomerImportSchema,
    projects: ProjectImportSchema,
    stock: StockImportSchema,
    sales: SaleImportSchema,
    calculations: z.any(), // TODO: Define strict schema
    visits: z.any() // TODO: Define strict schema
}
