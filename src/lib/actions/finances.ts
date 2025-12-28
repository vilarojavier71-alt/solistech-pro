
'use server'

import { prisma } from '@/lib/db'
import { getCurrentUserWithRole } from '@/lib/session'
import { getFinancialSummary as getExpensesSummary } from '@/lib/actions/expenses'
import { getInvoiceStats, listInvoices } from '@/lib/actions/invoices'

export interface FinancialStats {
    income: number
    expenses: number
    netProfit: number
    pendingInvoicesCound: number
    overdueInvoicesCount: number
    recentTransactions: TransactionItem[]
}

export interface TransactionItem {
    id: string
    type: 'income' | 'expense'
    description: string
    amount: number
    date: Date
    status: string
}

export async function getFinancialDashboardData(): Promise<FinancialStats> {
    const user = await getCurrentUserWithRole()
    if (!user?.organizationId) {
        return {
            income: 0,
            expenses: 0,
            netProfit: 0,
            pendingInvoicesCound: 0,
            overdueInvoicesCount: 0,
            recentTransactions: []
        }
    }

    // 1. Get Base Financials (Income vs Expenses) via existing logic or aggregation
    // We can reuse logic or query directly. Querying directly allows us to merge "Transactions" list easily.

    const orgId = user.organizationId

    // Parallel fetch for efficiency
    const [
        paidInvoices,
        expenses,
        invoiceStats
    ] = await Promise.all([
        // Income: Paid Invoices
        prisma.invoice.findMany({
            where: { organization_id: orgId, status: 'paid' },
            select: { id: true, invoice_number: true, total: true, issue_date: true, customer: { select: { name: true } } },
            orderBy: { issue_date: 'desc' },
            take: 10
        }),
        // Expenses
        prisma.operatingExpense.findMany({
            where: { organization_id: orgId },
            select: { id: true, description: true, amount: true, date: true, category: true },
            orderBy: { date: 'desc' },
            take: 10
        }),
        // Invoice Counts
        getInvoiceStats()
    ])

    // Calculate Totals
    // Note: invoiceStats from 'getInvoiceStats' might already sum up PAID invoices if we check its logic, 
    // but looking at 'getInvoiceStats' in invoices.ts, it sums 'monthlyInvoices' (total billed) and 'unpaid'.
    // We want Total Collected vs Total Spent for the "Net Profit" generally.
    // Let's calculate grand totals.

    const totalIncome = await prisma.invoice.aggregate({
        where: { organization_id: orgId, status: 'paid' },
        _sum: { total: true }
    })

    const totalExpenses = await prisma.operatingExpense.aggregate({
        where: { organization_id: orgId },
        _sum: { amount: true }
    })

    const incomeVal = totalIncome._sum.total?.toNumber() || 0
    const expensesVal = totalExpenses._sum.amount?.toNumber() || 0

    // Merge for Recent Transactions
    const incomeTrans: TransactionItem[] = paidInvoices.map(inv => ({
        id: inv.id,
        type: 'income',
        description: `Factura ${inv.invoice_number} - ${inv.customer?.name || 'Cliente Desconocido'}`,
        amount: Number(inv.total),
        date: inv.issue_date,
        status: 'paid'
    }))

    const expenseTrans: TransactionItem[] = expenses.map(exp => ({
        id: exp.id,
        type: 'expense',
        description: `${exp.category}: ${exp.description}`,
        amount: Number(exp.amount),
        date: exp.date,
        status: 'paid'
    }))

    const recentTransactions = [...incomeTrans, ...expenseTrans]
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 10)

    return {
        income: incomeVal,
        expenses: expensesVal,
        netProfit: incomeVal - expensesVal,
        pendingInvoicesCound: invoiceStats.data?.unpaidCount || 0,
        overdueInvoicesCount: invoiceStats.data?.overdueCount || 0,
        recentTransactions
    }
}
