
'use server'

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { logAudit, AuditAction, AuditSeverity } from "@/lib/security/audit"

export async function getQuotes() {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) return []

    return await prisma.quote.findMany({
        where: {
            organization_id: session.user.organizationId
        },
        include: {
            crm_account: {
                select: { name: true, email: true }
            },
            created_by_user: {
                select: { full_name: true }
            }
        },
        orderBy: { updated_at: 'desc' }
    })
}

export async function getQuote(id: string) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) return null

    return await prisma.quote.findUnique({
        where: {
            id,
            organization_id: session.user.organizationId
        },
        include: {
            lines: {
                orderBy: { line_order: 'asc' }
            },
            crm_account: true,
            organization: true // for PDF generation details (logo, etc)
        }
    })
}


export interface QuoteLineInput {
    description: string
    quantity: number
    unit_price: number
    total: number
}

export interface CreateQuoteInput {
    title: string
    crmAccountId: string
    validUntil: string
    notes?: string
    items: QuoteLineInput[]
    subtotal: number
    total: number
    taxAmount: number
}

export async function createFullQuote(input: CreateQuoteInput) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) throw new Error("Unauthorized")

    // Generate Quote Number
    const count = await prisma.quote.count({ where: { organization_id: session.user.organizationId } })
    const quoteNumber = `Q-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`

    // Create Header and Lines
    const quote = await prisma.quote.create({
        data: {
            organization_id: session.user.organizationId,
            quote_number: quoteNumber,
            title: input.title || `Presupuesto ${quoteNumber}`,
            crm_account_id: input.crmAccountId,
            valid_until: input.validUntil ? new Date(input.validUntil) : null,
            status: 'draft',
            notes: input.notes,
            subtotal: input.subtotal,
            tax_amount: input.taxAmount,
            total: input.total,
            created_by: session.user.id,
            lines: {
                create: input.items.map((line, idx) => ({
                    line_order: idx + 1,
                    description: line.description,
                    quantity: line.quantity,
                    unit_price: line.unit_price,
                    total: line.total
                }))
            }
        }
    })

    await logAudit({
        action: AuditAction.CREATE,
        resource: 'Quote',
        resourceId: quote.id,
        userId: session.user.id,
        organizationId: session.user.organizationId,
        details: { quoteNumber, amount: input.total },
        severity: AuditSeverity.INFO
    })

    revalidatePath('/dashboard/quotes')
    return quote
}

export async function getQuoteTargets() {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) return { leads: [], customers: [] }

    const orgId = session.user.organizationId

    const leads = await prisma.lead.findMany({
        where: { organization_id: orgId },
        select: { id: true, name: true, email: true },
        orderBy: { created_at: 'desc' }
    })

    // Prefer CrmAccount if migrated, fallback to Customer table if needed or CrmAccount type=customer
    const customers = await prisma.crmAccount.findMany({
        where: { organization_id: orgId, type: 'customer' },
        select: { id: true, name: true, email: true, tax_id: true } // mapped to QuoteBuilder expectations
    })

    return { leads, customers }
}

