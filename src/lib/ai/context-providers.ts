/**
 * AI Context Providers
 * 
 * Funciones que obtienen contexto de Prisma para inyectar en los prompts de IA.
 * Implementa el principio de mínimo privilegio: cada asistente solo ve sus datos.
 */

import { prisma } from '@/lib/db'

// =============================================================================
// CONTEXTO PARA ASISTENTE DE VENTAS
// =============================================================================

export interface SalesContext {
    lead_name: string
    lead_email: string
    lead_phone: string
    lead_company: string
    lead_status: string
    lead_source: string
    last_contact: string
    days_since_contact: number
    notes: string
    // Datos de calculadora (si hay proyecto asociado)
    kWp?: number
    annual_savings?: number
    payback_years?: number
    annual_production?: number
}

export async function getSalesContext(leadId: string, orgId: string): Promise<SalesContext | null> {
    const lead = await prisma.lead.findFirst({
        where: { id: leadId, organization_id: orgId }
    })

    if (!lead) return null

    const daysSince = lead.updated_at
        ? Math.floor((Date.now() - new Date(lead.updated_at).getTime()) / (1000 * 60 * 60 * 24))
        : 0

    return {
        lead_name: lead.name || 'Sin nombre',
        lead_email: lead.email || 'Sin email',
        lead_phone: lead.phone || 'Sin teléfono',
        lead_company: lead.company || 'Particular',
        lead_status: lead.status || 'nuevo',
        lead_source: lead.source || 'Desconocido',
        last_contact: lead.updated_at?.toLocaleDateString('es-ES') || 'Nunca',
        days_since_contact: daysSince,
        notes: lead.notes || 'Sin notas'
    }
}

// =============================================================================
// CONTEXTO PARA ASISTENTE TÉCNICO
// =============================================================================

export interface TechnicalContext {
    project_name: string
    customer_name: string
    location: string
    project_status: string
    solar_phase: string
    lat: number
    lng: number
    kWp: number
    num_panels: number
    annual_production: number
    irradiation: number
    orientation: number
    optimal_tilt: number
}

export async function getTechnicalContext(projectId: string, orgId: string): Promise<TechnicalContext | null> {
    const project = await prisma.project.findFirst({
        where: { id: projectId, organization_id: orgId },
        include: {
            customer: { select: { name: true } },
            calculations: {
                orderBy: { created_at: 'desc' },
                take: 1
            }
        }
    })

    if (!project) return null

    const calc = project.calculations[0]
    const calcData = calc?.calculation_data as any || {}

    return {
        project_name: project.name || 'Sin nombre',
        customer_name: project.customer?.name || 'Cliente',
        location: project.location || 'Sin ubicación',
        project_status: project.status || 'draft',
        solar_phase: project.solar_phase || 'DRAFT',
        lat: calcData.lat || 40.4168,
        lng: calcData.lng || -3.7038,
        kWp: calcData.totalKWp || 0,
        num_panels: calcData.numPanels || 0,
        annual_production: calcData.annualProduction || 0,
        irradiation: calcData.irradiation || 1600,
        orientation: calcData.orientation || 180,
        optimal_tilt: calcData.optimalTilt || 35
    }
}

// =============================================================================
// CONTEXTO PARA ASISTENTE ADMINISTRATIVO
// =============================================================================

export interface AdminContext {
    customer_name: string
    customer_nif: string
    pending_invoices: number
    pending_amount: number
    last_invoice_date: string
    payment_status: string
    subsidy_name: string
    subsidy_status: string
    subsidy_amount: number
    subsidy_deadline: string
    pending_documents: string
}

export async function getAdminContext(customerId: string, orgId: string): Promise<AdminContext | null> {
    const customer = await prisma.customer.findFirst({
        where: { id: customerId, organization_id: orgId },
        include: {
            invoices: {
                where: { status: { in: ['pending', 'sent', 'draft'] } },
                orderBy: { date: 'desc' }
            }
        }
    })

    if (!customer) return null

    const pendingAmount = customer.invoices.reduce(
        (sum, inv) => sum + (inv.total?.toNumber() || 0), 0
    )

    const lastInvoice = customer.invoices[0]

    return {
        customer_name: customer.name || 'Cliente',
        customer_nif: customer.nif || 'Sin NIF',
        pending_invoices: customer.invoices.length,
        pending_amount: pendingAmount,
        last_invoice_date: lastInvoice?.date?.toLocaleDateString('es-ES') || 'Sin facturas',
        payment_status: lastInvoice?.status || 'N/A',
        // Subvenciones - placeholder hasta implementar módulo
        subsidy_name: 'Subvención Autoconsumo 2024',
        subsidy_status: 'pendiente',
        subsidy_amount: 0,
        subsidy_deadline: '31/12/2024',
        pending_documents: 'DNI, Factura de luz, Contrato'
    }
}

// =============================================================================
// CONTEXTO PARA ASISTENTE DE SOPORTE
// =============================================================================

export interface SupportContext {
    user_name: string
    user_role: string
    subscription_plan: string
    current_page: string
}

export async function getSupportContext(userId: string, currentPage: string): Promise<SupportContext | null> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            organization: { select: { subscription_plan: true } }
        }
    })

    if (!user) return null

    return {
        user_name: user.full_name || 'Usuario',
        user_role: user.role || 'user',
        subscription_plan: user.organization?.subscription_plan || 'basic',
        current_page: currentPage
    }
}

// =============================================================================
// MAPEO DE CAMPOS POR ASISTENTE (Documentación)
// =============================================================================

export const CONTEXT_FIELD_MAPPING = {
    sales: {
        table: 'leads',
        fields: ['name', 'email', 'phone', 'company', 'status', 'source', 'notes', 'updated_at'],
        joins: ['calculations (opcional)'],
        restriction: 'Solo leads de su organización'
    },
    technical: {
        table: 'projects',
        fields: ['name', 'location', 'status', 'solar_phase'],
        joins: ['customers', 'calculations'],
        restriction: 'Solo proyectos de su organización'
    },
    admin: {
        table: 'customers',
        fields: ['name', 'nif'],
        joins: ['invoices (filtered by status)'],
        restriction: 'Sin acceso a datos técnicos de proyectos'
    },
    support: {
        table: 'users',
        fields: ['full_name', 'role'],
        joins: ['organizations (plan only)'],
        restriction: 'Datos mínimos del usuario'
    }
} as const

