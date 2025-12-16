/**
 * @BACKEND_ESPECIALISTA - Interfaces estrictas para funciones de importación
 * Reemplaza el uso de `any` en import.ts
 */

export interface CustomerImportRow {
    name?: string
    Nombre?: string
    nombre?: string
    email?: string
    Email?: string
    phone?: string
    telefono?: string
    Teléfono?: string
    Telefono?: string
    company?: string
    empresa?: string
    Empresa?: string
    tax_id?: string
    cif?: string
    CIF?: string
    nif?: string
    NIF?: string
    street?: string
    calle?: string
    Calle?: string
    city?: string
    ciudad?: string
    Ciudad?: string
    postal_code?: string
    cp?: string
    CP?: string
    state?: string
    provincia?: string
    Provincia?: string
    country?: string
    pais?: string
    País?: string
}

export interface LeadImportRow {
    name?: string
    Nombre?: string
    nombre?: string
    email?: string
    Email?: string
    phone?: string
    telefono?: string
    Teléfono?: string
    Telefono?: string
    company?: string
    empresa?: string
    Empresa?: string
    source?: string
    origen?: string
    Origen?: string
    status?: string
    estado?: string
    Estado?: string
    estimated_value?: string | number
    valor?: string | number
    Valor?: string | number
    notes?: string
    notas?: string
    Notas?: string
}

export interface VisitImportRow {
    customer_name?: string
    Cliente_Nombre?: string
    cliente_nombre?: string
    Nombre?: string
    name?: string
    customer_phone?: string
    Cliente_Telefono?: string
    cliente_telefono?: string
    Telefono?: string
    phone?: string
    start_time?: string
    Hora_Visita_Programada?: string
    hora_visita?: string
    Hora?: string
    status?: string
    Estado_Visita?: string
    estado?: string
    description?: string
    Detalle_Lead?: string
    notas?: string
    Timestamp_Envio_WA?: string
    [key: string]: unknown // Para metadata flexible
}

export interface SaleImportRow {
    customer_name?: string
    Cliente_Nombre?: string
    cliente_nombre?: string
    Nombre?: string
    name?: string
    customer_phone?: string
    Cliente_Telefono?: string
    Telefono?: string
    phone?: string
    customer_email?: string
    Email?: string
    Correo?: string
    dni?: string
    DNI?: string
    NIF?: string
    sale_date?: string
    Fecha_Venta?: string
    Fecha?: string
    date?: string
    created_at?: string
    amount?: string | number
    Importe?: string | number
    Total?: string | number
    Precio?: string | number
    payment_status?: string
    Estado_Venta?: string
    Estado?: string
    status?: string
    Expediente?: string
    sale_number?: string
    [key: string]: unknown // Para metadata flexible
}

export interface StockImportRow {
    manufacturer?: string
    Fabricante?: string
    fabricante?: string
    Marca?: string
    model?: string
    Modelo?: string
    modelo?: string
    Nombre?: string
    name?: string
    type?: string
    Tipo?: string
    Categoria?: string
    category?: string
    price?: string | number
    Precio?: string | number
    Coste?: string | number
    cost_price?: string | number
    stock_quantity?: string | number
    Stock?: string | number
    Cantidad?: string | number
    quantity?: string | number
    [key: string]: unknown // Para metadata flexible
}

export interface InvoiceHashInput {
    invoice_number: string
    issue_date: string
    customer_nif: string
    total: number
    verifactu_previous_hash?: string | null
}

export interface SupplierData {
    name: string
    contact_name?: string
    email?: string
    phone?: string
    address?: string
}

export interface ComponentData {
    manufacturer: string
    model: string
    type: 'panel' | 'inverter' | 'battery' | 'mounting' | 'optimizer' | 'other'
    price: number
    stock_quantity?: number
    specifications?: Record<string, unknown>
    is_active?: boolean
}
