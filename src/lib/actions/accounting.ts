'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUserWithRole } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import {
    CreateAccountSchema,
    CreateJournalEntrySchema,
    type CreateAccountData,
    type CreateJournalEntryData
} from '@/lib/schemas/accounting'

// NOTE: Schemas are NOT re-exported from here. Import directly from '@/lib/schemas/accounting'

// --- ACTIONS ---

export async function createAccount(data: CreateAccountData) {
    const user = await getCurrentUserWithRole()
    if (!user || !user.organizationId) return { error: "No autenticado o sin organización" }

    const validation = CreateAccountSchema.safeParse(data)
    if (!validation.success) return { error: "Datos inválidos", details: validation.error.flatten().fieldErrors }

    const supabase = createAdminClient()
    const { code, name, type, parentId, isGroup } = validation.data

    try {
        const { data: account, error } = await supabase
            .from('accounting_accounts')
            .insert({
                organization_id: user.organizationId,
                code,
                name,
                type,
                parent_id: parentId || null,
                is_group: isGroup
            })
            .select()
            .single()

        if (error) {
            if (error.code === '23505') return { error: `La cuenta con código ${code} ya existe` }
            throw error
        }

        revalidatePath('/dashboard/finance/accounting')
        return { success: true, data: account }
    } catch (error: any) {
        console.error('Create Account Error:', error)
        return { error: `Error al crear cuenta: ${error.message}` }
    }
}

export async function getAccounts() {
    const user = await getCurrentUserWithRole()
    if (!user || !user.organizationId) return { error: "No autenticado" }

    const supabase = createAdminClient()

    const { data: accounts, error } = await supabase
        .from('accounting_accounts')
        .select('*')
        .eq('organization_id', user.organizationId)
        .order('code', { ascending: true })

    if (error) return { error: error.message }
    return { success: true, data: accounts }
}

export async function createJournalEntry(data: CreateJournalEntryData) {
    const user = await getCurrentUserWithRole()
    if (!user || !user.organizationId) return { error: "No autenticado" }

    // 1. Validate Input
    const validation = CreateJournalEntrySchema.safeParse(data)
    if (!validation.success) return { error: "Datos inválidos", details: validation.error.flatten().fieldErrors }

    const { date, description, reference, lines } = validation.data

    // 2. Validate Double-Entry Principle (Debit == Credit)
    const totalDebit = lines.reduce((sum, line) => sum + line.debit, 0)
    const totalCredit = lines.reduce((sum, line) => sum + line.credit, 0)

    // Allow small floating point diff
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
        return {
            error: `El asiento está descuadrado. Débito: ${totalDebit.toFixed(2)}, Crédito: ${totalCredit.toFixed(2)}`
        }
    }

    if (totalDebit === 0) {
        return { error: "El asiento no puede tener valor cero" }
    }

    const supabase = createAdminClient()

    try {
        // 3. Create Journal Header
        const { data: journal, error: journalError } = await supabase
            .from('accounting_journals')
            .insert({
                organization_id: user.organizationId,
                date,
                description,
                reference: reference || null,
                status: 'draft', // Always draft first
                created_by: user.id
            })
            .select()
            .single()

        if (journalError) throw journalError

        // 4. Create Transactions (Lines)
        const transactions = lines.map(line => ({
            journal_id: journal.id,
            account_id: line.accountId,
            debit: line.debit,
            credit: line.credit,
            description: line.description || description // Inherit desc if empty? Or null. Using passed desc.
        }))

        const { error: linesError } = await supabase
            .from('accounting_transactions')
            .insert(transactions)

        if (linesError) {
            // Rollback header (Best effort)
            await supabase.from('accounting_journals').delete().eq('id', journal.id)
            throw linesError
        }

        revalidatePath('/dashboard/finance/accounting')
        return { success: true, data: journal }

    } catch (error: any) {
        console.error('Create Journal Error:', error)
        return { error: `Error al registrar asiento: ${error.message}` }
    }
}

export async function getJournals() {
    const user = await getCurrentUserWithRole()
    if (!user || !user.organizationId) return { error: "No autenticado" }

    const supabase = createAdminClient()

    const { data: journals, error } = await supabase
        .from('accounting_journals')
        .select(`
            *,
            accounting_transactions (
                id, account_id, debit, credit, description,
                account:accounting_accounts(code, name)
            )
        `)
        .eq('organization_id', user.organizationId)
        .order('date', { ascending: false })

    if (error) return { error: error.message }
    return { success: true, data: journals }
}

// --- REPORTING ---

export async function getTrialBalance(dateStart?: string, dateEnd?: string) {
    const user = await getCurrentUserWithRole()
    if (!user || !user.organizationId) return { error: "No autenticado" }

    const supabase = createAdminClient()

    // 1. Get all active accounts
    const { data: accounts, error: accountsError } = await supabase
        .from('accounting_accounts')
        .select('id, code, name, type')
        .eq('organization_id', user.organizationId)
        .eq('is_active', true)
        .order('code')

    if (accountsError) return { error: accountsError.message }

    // 2. Aggregate Transactions
    // Note: Supabase JS doesn't support complex aggregations/Group By easily without internal RPC.
    // For MVP, we will fetch transactions and compute in JS. 
    // Optimization: Create a Postgres View or RPC function for real production usage.

    let query = supabase
        .from('accounting_transactions')
        .select(`
            account_id,
            debit,
            credit,
            journal:accounting_journals!inner(date, status, organization_id)
        `)
        .eq('journal.organization_id', user.organizationId)
        .eq('journal.status', 'posted') // Only posted entries count

    if (dateEnd) {
        query = query.lte('journal.date', dateEnd)
    }
    // Note: For Balance Sheet we usually want ALL history up to dateEnd. 
    // For P&L we want range dateStart to dateEnd.
    // Here we implement "Cumulative Balance" (Balance Sheet style).

    const { data: transactions, error: txError } = await query

    if (txError) return { error: txError.message }

    // 3. Compute Balances
    const balances = accounts.map(acc => {
        const accTxs = transactions.filter(tx => tx.account_id === acc.id)

        const totalDebit = accTxs.reduce((sum, tx) => sum + Number(tx.debit), 0)
        const totalCredit = accTxs.reduce((sum, tx) => sum + Number(tx.credit), 0)

        let netBalance = 0
        // Normal balance rules:
        // Asset/Expense: Debit - Credit
        // Liability/Equity/Revenue: Credit - Debit
        if (['asset', 'expense'].includes(acc.type)) {
            netBalance = totalDebit - totalCredit
        } else {
            netBalance = totalCredit - totalDebit
        }

        return {
            ...acc,
            debit: totalDebit,
            credit: totalCredit,
            netBalance
        }
    })

    // Filter out zero balance accounts if needed, or keep all
    return { success: true, data: balances }
}

// ============================================================================
// FUNCIONES AVANZADAS - Vista Avanzada Finanzas
// ============================================================================

/**
 * Reporte de Flujo de Caja basado en facturas pagadas y gastos
 */
export async function getCashFlowReport(startDate?: string, endDate?: string) {
    const user = await getCurrentUserWithRole()
    if (!user || !user.organizationId) return { error: "No autenticado" }

    const supabase = createAdminClient()

    // Obtener ingresos (facturas pagadas)
    let incomeQuery = supabase
        .from('invoices')
        .select('id, total, issue_date, payment_status')
        .eq('organization_id', user.organizationId)
        .eq('payment_status', 'paid')

    if (startDate) incomeQuery = incomeQuery.gte('issue_date', startDate)
    if (endDate) incomeQuery = incomeQuery.lte('issue_date', endDate)

    // Obtener gastos operativos
    let expenseQuery = supabase
        .from('operating_expenses')
        .select('id, amount, date, category')
        .eq('organization_id', user.organizationId)

    if (startDate) expenseQuery = expenseQuery.gte('date', startDate)
    if (endDate) expenseQuery = expenseQuery.lte('date', endDate)

    const [incomeRes, expenseRes] = await Promise.all([incomeQuery, expenseQuery])

    if (incomeRes.error) return { error: incomeRes.error.message }
    if (expenseRes.error) return { error: expenseRes.error.message }

    const invoices = incomeRes.data || []
    const expenses = expenseRes.data || []

    // Calcular totales
    const totalIncome = invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)
    const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0)
    const netCashFlow = totalIncome - totalExpenses

    // Agrupar por mes para gráficos
    const monthlyData: Record<string, { income: number; expenses: number; net: number }> = {}

    invoices.forEach(inv => {
        const month = inv.issue_date?.substring(0, 7) || 'unknown'
        if (!monthlyData[month]) monthlyData[month] = { income: 0, expenses: 0, net: 0 }
        monthlyData[month].income += Number(inv.total || 0)
    })

    expenses.forEach(exp => {
        const month = exp.date?.substring(0, 7) || 'unknown'
        if (!monthlyData[month]) monthlyData[month] = { income: 0, expenses: 0, net: 0 }
        monthlyData[month].expenses += Number(exp.amount || 0)
    })

    // Calcular neto por mes
    Object.keys(monthlyData).forEach(month => {
        monthlyData[month].net = monthlyData[month].income - monthlyData[month].expenses
    })

    const monthlyArray = Object.entries(monthlyData)
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month))

    return {
        success: true,
        data: {
            totalIncome,
            totalExpenses,
            netCashFlow,
            invoiceCount: invoices.length,
            expenseCount: expenses.length,
            monthlyData: monthlyArray
        }
    }
}

/**
 * Reporte de Pérdidas y Ganancias (P&L)
 */
export async function getProfitLossReport(startDate?: string, endDate?: string) {
    const user = await getCurrentUserWithRole()
    if (!user || !user.organizationId) return { error: "No autenticado" }

    // Reutilizar flujo de caja para datos básicos
    const cashFlowResult = await getCashFlowReport(startDate, endDate)
    if ('error' in cashFlowResult) return cashFlowResult

    const { totalIncome, totalExpenses, netCashFlow } = cashFlowResult.data

    // Agregar categorización de gastos
    const supabase = createAdminClient()

    let expenseQuery = supabase
        .from('operating_expenses')
        .select('amount, category')
        .eq('organization_id', user.organizationId)

    if (startDate) expenseQuery = expenseQuery.gte('date', startDate)
    if (endDate) expenseQuery = expenseQuery.lte('date', endDate)

    const { data: expenses } = await expenseQuery

    // Agrupar gastos por categoría
    const expensesByCategory: Record<string, number> = {}
    expenses?.forEach(exp => {
        const cat = exp.category || 'Otros'
        expensesByCategory[cat] = (expensesByCategory[cat] || 0) + Number(exp.amount || 0)
    })

    const expenseCategoryArray = Object.entries(expensesByCategory)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount)

    // Calcular margen
    const profitMargin = totalIncome > 0 ? (netCashFlow / totalIncome) * 100 : 0

    return {
        success: true,
        data: {
            revenue: totalIncome,
            expenses: totalExpenses,
            netProfit: netCashFlow,
            profitMargin: profitMargin.toFixed(2),
            expensesByCategory: expenseCategoryArray
        }
    }
}

/**
 * KPIs Financieros principales
 */
export async function getFinancialKPIs() {
    const user = await getCurrentUserWithRole()
    if (!user || !user.organizationId) return { error: "No autenticado" }

    const supabase = createAdminClient()

    // Obtener datos de este mes y mes anterior para comparación
    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]

    // Facturas totales
    const { data: allInvoices } = await supabase
        .from('invoices')
        .select('id, total, status, payment_status, issue_date')
        .eq('organization_id', user.organizationId)

    const invoices = allInvoices || []

    // Cálculos
    const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)
    const paidInvoices = invoices.filter(inv => inv.payment_status === 'paid')
    const pendingInvoices = invoices.filter(inv => inv.payment_status === 'pending')
    const overdueInvoices = invoices.filter(inv => inv.status === 'overdue')

    const paidRevenue = paidInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)
    const pendingRevenue = pendingInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)

    // Facturas de este mes vs mes anterior
    const thisMonthInvoices = invoices.filter(inv => inv.issue_date >= thisMonthStart)
    const lastMonthInvoices = invoices.filter(inv => inv.issue_date >= lastMonthStart && inv.issue_date <= lastMonthEnd)

    const thisMonthRevenue = thisMonthInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)
    const lastMonthRevenue = lastMonthInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)

    // Growth
    const monthOverMonthGrowth = lastMonthRevenue > 0
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : 0

    // Collection rate
    const collectionRate = totalRevenue > 0 ? (paidRevenue / totalRevenue) * 100 : 0

    // Average invoice value
    const avgInvoiceValue = invoices.length > 0 ? totalRevenue / invoices.length : 0

    return {
        success: true,
        data: {
            totalRevenue,
            paidRevenue,
            pendingRevenue,
            invoiceCount: invoices.length,
            paidCount: paidInvoices.length,
            pendingCount: pendingInvoices.length,
            overdueCount: overdueInvoices.length,
            thisMonthRevenue,
            lastMonthRevenue,
            monthOverMonthGrowth: monthOverMonthGrowth.toFixed(1),
            collectionRate: collectionRate.toFixed(1),
            avgInvoiceValue: avgInvoiceValue.toFixed(2)
        }
    }
}

/**
 * Previsión de ingresos basada en tendencia histórica
 */
export async function getRevenueForecasts(months = 3) {
    const user = await getCurrentUserWithRole()
    if (!user || !user.organizationId) return { error: "No autenticado" }

    const supabase = createAdminClient()

    // Obtener facturas de los últimos 6 meses
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const startDate = sixMonthsAgo.toISOString().split('T')[0]

    const { data: invoices } = await supabase
        .from('invoices')
        .select('total, issue_date')
        .eq('organization_id', user.organizationId)
        .gte('issue_date', startDate)

    if (!invoices || invoices.length === 0) {
        return {
            success: true,
            data: { historical: [], forecasts: [], avgMonthly: 0 }
        }
    }

    // Agrupar por mes
    const monthlyData: Record<string, number> = {}
    invoices.forEach(inv => {
        const month = inv.issue_date?.substring(0, 7) || 'unknown'
        monthlyData[month] = (monthlyData[month] || 0) + Number(inv.total || 0)
    })

    const historical = Object.entries(monthlyData)
        .map(([month, revenue]) => ({ month, revenue }))
        .sort((a, b) => a.month.localeCompare(b.month))

    // Calcular promedio mensual
    const avgMonthly = historical.length > 0
        ? historical.reduce((sum, m) => sum + m.revenue, 0) / historical.length
        : 0

    // Calcular tendencia simple (crecimiento promedio)
    let trend = 0
    if (historical.length >= 2) {
        const changes = []
        for (let i = 1; i < historical.length; i++) {
            const prev = historical[i - 1].revenue
            if (prev > 0) {
                changes.push((historical[i].revenue - prev) / prev)
            }
        }
        trend = changes.length > 0 ? changes.reduce((a, b) => a + b, 0) / changes.length : 0
    }

    // Generar previsiones
    const forecasts = []
    const now = new Date()
    let lastRevenue = historical.length > 0 ? historical[historical.length - 1].revenue : avgMonthly

    for (let i = 1; i <= months; i++) {
        const forecastDate = new Date(now.getFullYear(), now.getMonth() + i, 1)
        const forecastMonth = forecastDate.toISOString().substring(0, 7)
        lastRevenue = lastRevenue * (1 + trend)
        forecasts.push({
            month: forecastMonth,
            revenue: Math.round(lastRevenue * 100) / 100,
            isForecast: true
        })
    }

    return {
        success: true,
        data: {
            historical,
            forecasts,
            avgMonthly: Math.round(avgMonthly * 100) / 100,
            trendPercentage: (trend * 100).toFixed(1)
        }
    }
}
