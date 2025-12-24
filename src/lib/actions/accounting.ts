'use server'

import { prisma } from '@/lib/db'
import { getCurrentUserWithRole } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import {
    CreateAccountSchema,
    CreateJournalEntrySchema,
    type CreateAccountData,
    type CreateJournalEntryData
} from '@/lib/schemas/accounting'

// --- ACTIONS ---

export async function createAccount(data: CreateAccountData) {
    const user = await getCurrentUserWithRole()
    if (!user || !user.organizationId) return { error: "No autenticado o sin organización" }

    const validation = CreateAccountSchema.safeParse(data)
    if (!validation.success) return { error: "Datos inválidos", details: validation.error.flatten().fieldErrors }

    const { code, name, type, parentId, isGroup } = validation.data

    try {
        const account = await prisma.accountingAccount.create({
            data: {
                organization_id: user.organizationId,
                code,
                name,
                type,
                parent_id: parentId || null,
                is_group: isGroup || false
            }
        })

        revalidatePath('/dashboard/finance/accounting')
        return { success: true, data: account }
    } catch (error: any) {
        if (error.code === 'P2002') return { error: `La cuenta con código ${code} ya existe` }
        console.error('Create Account Error:', error)
        return { error: `Error al crear cuenta: ${error.message}` }
    }
}

export async function getAccounts() {
    const user = await getCurrentUserWithRole()
    if (!user || !user.organizationId) return { error: "No autenticado" }

    try {
        const accounts = await prisma.accountingAccount.findMany({
            where: { organization_id: user.organizationId },
            orderBy: { code: 'asc' }
        })
        return { success: true, data: accounts }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function createJournalEntry(data: CreateJournalEntryData) {
    const user = await getCurrentUserWithRole()
    if (!user || !user.organizationId) return { error: "No autenticado" }

    const validation = CreateJournalEntrySchema.safeParse(data)
    if (!validation.success) return { error: "Datos inválidos", details: validation.error.flatten().fieldErrors }

    const { date, description, reference, lines } = validation.data

    // Validate Double-Entry Principle
    const totalDebit = lines.reduce((sum, line) => sum + line.debit, 0)
    const totalCredit = lines.reduce((sum, line) => sum + line.credit, 0)

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
        return { error: `El asiento está descuadrado. Débito: ${totalDebit.toFixed(2)}, Crédito: ${totalCredit.toFixed(2)}` }
    }

    if (totalDebit === 0) {
        return { error: "El asiento no puede tener valor cero" }
    }

    try {
        // Transacción ACID con SELECT FOR UPDATE en cuentas afectadas
        const journal = await prisma.$transaction(async (tx) => {
            // Verificar y bloquear cuentas involucradas para prevenir race conditions
            const accountIds = [...new Set(lines.map(line => line.accountId))]
            
            // Bloquear todas las cuentas involucradas
            await tx.$queryRaw`
                SELECT id, code, name, balance
                FROM accounting_accounts
                WHERE id = ANY(${accountIds}::uuid[])
                  AND organization_id = ${user.organizationId}::uuid
                FOR UPDATE
            `

            // Crear journal
            const newJournal = await tx.accounting_journals.create({
                data: {
                    organization_id: user.organizationId,
                    date: new Date(date),
                    description,
                    reference: reference || null,
                    status: 'draft',
                    created_by: user.id
                }
            })

            // Crear transacciones
            await tx.accounting_transactions.createMany({
                data: lines.map(line => ({
                    journal_id: newJournal.id,
                    account_id: line.accountId,
                    debit: line.debit,
                    credit: line.credit,
                    description: line.description || description
                }))
            })

            return newJournal
        }, {
            isolationLevel: 'Serializable'
        })

        // Audit log (ISO 27001 A.8.15)
        const { auditLogAction } = await import('@/lib/audit/audit-logger')
        await auditLogAction(
            'journal_entry.created',
            user.id,
            'journal_entry',
            journal.id,
            `Journal entry created: ${description}`,
            {
                organizationId: user.organizationId || undefined,
                metadata: {
                    date: date,
                    reference: reference || null,
                    lineCount: lines.length,
                    totalDebit: totalDebit,
                    totalCredit: totalCredit
                }
            }
        ).catch(err => {
            console.error('Failed to create audit log:', err)
        })

        revalidatePath('/dashboard/finance/accounting')
        return { success: true, data: journal }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error('Create Journal Error:', errorMessage)
        return { error: `Error al registrar asiento: ${errorMessage}` }
    }
}

export async function getJournals() {
    const user = await getCurrentUserWithRole()
    if (!user || !user.organizationId) return { error: "No autenticado" }

    try {
        const journals = await prisma.accountingJournal.findMany({
            where: { organization_id: user.organizationId },
            include: {
                transactions: {
                    include: {
                        account: { select: { code: true, name: true } }
                    }
                }
            },
            orderBy: { date: 'desc' }
        })
        return { success: true, data: journals }
    } catch (error: any) {
        return { error: error.message }
    }
}

// --- REPORTING ---

export async function getTrialBalance(dateStart?: string, dateEnd?: string) {
    const user = await getCurrentUserWithRole()
    if (!user || !user.organizationId) return { error: "No autenticado" }

    try {
        const accounts = await prisma.accountingAccount.findMany({
            where: { organization_id: user.organizationId, is_active: true },
            orderBy: { code: 'asc' }
        })

        const transactions = await prisma.accountingTransaction.findMany({
            where: {
                journal: {
                    organization_id: user.organizationId,
                    status: 'posted',
                    ...(dateEnd && { date: { lte: new Date(dateEnd) } })
                }
            },
            include: { journal: { select: { date: true, status: true } } }
        })

        const balances = accounts.map(acc => {
            const accTxs = transactions.filter(tx => tx.account_id === acc.id)
            const totalDebit = accTxs.reduce((sum, tx) => sum + Number(tx.debit), 0)
            const totalCredit = accTxs.reduce((sum, tx) => sum + Number(tx.credit), 0)

            let netBalance = 0
            if (['asset', 'expense'].includes(acc.type)) {
                netBalance = totalDebit - totalCredit
            } else {
                netBalance = totalCredit - totalDebit
            }

            return { ...acc, debit: totalDebit, credit: totalCredit, netBalance }
        })

        return { success: true, data: balances }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function getCashFlowReport(startDate?: string, endDate?: string) {
    const user = await getCurrentUserWithRole()
    if (!user || !user.organizationId) return { error: "No autenticado" }

    try {
        const invoices = await prisma.invoice.findMany({
            where: {
                organization_id: user.organizationId,
                payment_status: 'paid',
                ...(startDate && { issue_date: { gte: new Date(startDate) } }),
                ...(endDate && { issue_date: { lte: new Date(endDate) } })
            },
            select: { id: true, total: true, issue_date: true }
        })

        const expenses = await prisma.operatingExpense.findMany({
            where: {
                organization_id: user.organizationId,
                ...(startDate && { date: { gte: new Date(startDate) } }),
                ...(endDate && { date: { lte: new Date(endDate) } })
            },
            select: { id: true, amount: true, date: true, category: true }
        })

        const totalIncome = invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)
        const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0)
        const netCashFlow = totalIncome - totalExpenses

        return {
            success: true,
            data: {
                totalIncome,
                totalExpenses,
                netCashFlow,
                monthlyData: [], // TODO: implement monthly grouping
                invoiceCount: invoices.length,
                expenseCount: expenses.length
            }
        }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function getProfitLossReport(startDate?: string, endDate?: string) {
    const cashFlowResult = await getCashFlowReport(startDate, endDate)
    if ('error' in cashFlowResult) return cashFlowResult

    const { totalIncome, totalExpenses, netCashFlow } = cashFlowResult.data
    const profitMargin = totalIncome > 0 ? (netCashFlow / totalIncome) * 100 : 0

    return {
        success: true,
        data: {
            revenue: totalIncome,
            expenses: totalExpenses,
            netProfit: netCashFlow,
            profitMargin: profitMargin.toFixed(2)
        }
    }
}

export async function getFinancialKPIs() {
    const user = await getCurrentUserWithRole()
    if (!user || !user.organizationId) return { error: "No autenticado" }

    try {
        const invoices = await prisma.invoice.findMany({
            where: { organization_id: user.organizationId },
            select: { id: true, total: true, status: true, payment_status: true, issue_date: true }
        })

        const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)
        const paidInvoices = invoices.filter(inv => inv.payment_status === 'paid')
        const pendingInvoices = invoices.filter(inv => inv.payment_status === 'pending')
        const paidRevenue = paidInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)
        const collectionRate = totalRevenue > 0 ? (paidRevenue / totalRevenue) * 100 : 0

        return {
            success: true,
            data: {
                totalRevenue,
                paidRevenue,
                pendingRevenue: totalRevenue - paidRevenue,
                invoiceCount: invoices.length,
                paidCount: paidInvoices.length,
                pendingCount: pendingInvoices.length,
                collectionRate: collectionRate.toFixed(1)
            }
        }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function getRevenueForecasts(months = 3) {
    const user = await getCurrentUserWithRole()
    if (!user || !user.organizationId) return { error: "No autenticado" }

    try {
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

        const invoices = await prisma.invoice.findMany({
            where: {
                organization_id: user.organizationId,
                issue_date: { gte: sixMonthsAgo }
            },
            select: { total: true, issue_date: true }
        })

        if (!invoices.length) {
            return { success: true, data: { historical: [], forecasts: [], avgMonthly: 0 } }
        }

        // Group by month
        const monthlyData: Record<string, number> = {}
        invoices.forEach(inv => {
            const month = inv.issue_date?.toISOString().substring(0, 7) || 'unknown'
            monthlyData[month] = (monthlyData[month] || 0) + Number(inv.total || 0)
        })

        const historical = Object.entries(monthlyData)
            .map(([month, revenue]) => ({ month, revenue }))
            .sort((a, b) => a.month.localeCompare(b.month))

        const avgMonthly = historical.reduce((sum, m) => sum + m.revenue, 0) / historical.length

        return {
            success: true,
            data: { historical, forecasts: [], avgMonthly: Math.round(avgMonthly * 100) / 100 }
        }
    } catch (error: any) {
        return { error: error.message }
    }
}
