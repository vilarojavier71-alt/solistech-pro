"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

export type ExpenseCategory = 'Office' | 'Equipment' | 'Marketing' | 'Software' | 'Personnel' | 'Vehicles' | 'Other'

export interface Expense {
    id: string
    description: string
    amount: number
    category: ExpenseCategory
    date: string
    receipt_url?: string
    created_at: string
}

export async function createExpense(data: { description: string; amount: number; category: ExpenseCategory; date: string }) {
    const session = await auth()
    if (!session?.user) return { success: false, message: "No autorizado" }

    try {
        // Get User's org
        const user = await prisma.users.findUnique({
            where: { id: session.user.id },
            select: { organization_id: true }
        })

        if (!user?.organization_id) {
            return { success: false, message: "Usuario sin organización asignada" }
        }

        await prisma.operating_expenses.create({
            data: {
                organization_id: user.organization_id,
                description: data.description,
                amount: data.amount,
                category: data.category,
                date: new Date(data.date),
            }
        })

        revalidatePath("/dashboard/finance")
        return { success: true }
    } catch (error) {
        console.error("Error creating expense:", error)
        return { success: false, message: "Error al registrar el gasto" }
    }
}

export async function deleteExpense(id: string) {
    const session = await auth()
    if (!session?.user) return { success: false, message: "No autorizado" }

    try {
        await prisma.operating_expenses.delete({
            where: { id }
        })

        revalidatePath("/dashboard/finance")
        return { success: true }
    } catch (error) {
        return { success: false, message: "Error al eliminar el gasto" }
    }
}

export async function getFinancialSummary(startDate?: string, endDate?: string) {
    const session = await auth()
    if (!session?.user) return { totalIncome: 0, totalExpenses: 0, balance: 0, expenseCount: 0, recentExpenses: [] }

    try {
        const user = await prisma.users.findUnique({
            where: { id: session.user.id },
            select: { organization_id: true }
        })

        if (!user?.organization_id) {
            return { totalIncome: 0, totalExpenses: 0, balance: 0, expenseCount: 0, recentExpenses: [] }
        }

        // 1. Income (Paid Invoices)
        const invoices = await prisma.invoices.findMany({
            where: {
                organization_id: user.organization_id,
                status: 'paid',
                ...(startDate && { issue_date: { gte: new Date(startDate) } }),
                ...(endDate && { issue_date: { lte: new Date(endDate) } })
            },
            select: { total: true }
        })
        const totalIncome = invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)

        // 2. Expenses (Operating Expenses)
        const expenses = await prisma.operating_expenses.findMany({
            where: {
                organization_id: user.organization_id,
                ...(startDate && { date: { gte: new Date(startDate) } }),
                ...(endDate && { date: { lte: new Date(endDate) } })
            },
            orderBy: { date: 'desc' }
        })
        const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0)

        return {
            totalIncome,
            totalExpenses,
            balance: totalIncome - totalExpenses,
            expenseCount: expenses.length,
            recentExpenses: expenses.slice(0, 5) // Return top 5 recent for summary
        }

    } catch (err) {
        console.error("Error in getFinancialSummary:", err)
        return { totalIncome: 0, totalExpenses: 0, balance: 0, expenseCount: 0, recentExpenses: [] }
    }
}

export async function getExpenseList() {
    const session = await auth()
    if (!session?.user) return []

    const user = await prisma.users.findUnique({
        where: { id: session.user.id },
        select: { organization_id: true }
    })

    if (!user?.organization_id) return []

    const expenses = await prisma.operating_expenses.findMany({
        where: { organization_id: user.organization_id },
        orderBy: { date: 'desc' },
        take: 50
    })

    return expenses.map(e => ({
        ...e,
        amount: Number(e.amount),
        date: e.date.toISOString(),
        created_at: e.created_at.toISOString()
    })) as Expense[]
}
