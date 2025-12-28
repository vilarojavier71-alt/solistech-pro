
'use server'

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// -- TYPES --
export interface InventoryItem {
    id: string
    manufacturer: string
    model: string
    type: string
    stock_quantity: number
    min_stock_alert: number
    cost_price: number
    sale_price: number
    supplier?: { name: string }
}

export interface Supplier {
    id: string
    name: string
    contact_name?: string
    email?: string
    phone?: string
}

export interface StockMovement {
    id: string
    date: Date
    type: 'in' | 'out'
    quantity: number
    reason: string
    item_name: string
    user_name: string
}

// -- ACTIONS --

export async function getInventoryItems() {
    const session = await auth()
    if (!session?.user) return []

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { organization_id: true }
    })

    if (!user?.organization_id) return []

    const items = await prisma.inventoryItem.findMany({
        where: { organization_id: user.organization_id },
        include: { supplier: { select: { name: true } } },
        orderBy: { manufacturer: 'asc' }
    })

    return items.map(i => ({
        ...i,
        cost_price: Number(i.cost_price || 0),
        sale_price: Number(i.sale_price || 0)
    }))
}

export async function getSuppliers() {
    const session = await auth()
    if (!session?.user) return []

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { organization_id: true }
    })

    if (!user?.organization_id) return []

    return await prisma.supplier.findMany({
        where: { organization_id: user.organization_id },
        orderBy: { name: 'asc' }
    })
}

export async function getRecentMovements() {
    const session = await auth()
    if (!session?.user) return []

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { organization_id: true }
    })

    if (!user?.organization_id) return []

    const movements = await prisma.stockMovement.findMany({
        where: { organization_id: user.organization_id },
        include: {
            item: { select: { manufacturer: true, model: true } },
            user: { select: { full_name: true } }
        },
        orderBy: { created_at: 'desc' },
        take: 20
    })

    return movements.map(m => ({
        id: m.id,
        date: m.created_at,
        type: m.type as 'in' | 'out',
        quantity: m.quantity,
        reason: m.reason || '-',
        item_name: `${m.item.manufacturer} ${m.item.model}`,
        user_name: m.user.full_name || 'Desconocido'
    }))
}

// -- MUTATIONS --

export async function updateStock(itemId: string, type: 'in' | 'out', quantity: number, reason: string) {
    const session = await auth()
    if (!session?.user) return { success: false, message: 'No autorizado' }

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { organization_id: true }
        })

        if (!user?.organization_id) return { success: false, message: 'Org no encontrada' }

        // UPDATE Transaction
        await prisma.$transaction(async (tx) => {
            // Update item stock
            const item = await tx.inventoryItem.findUnique({ where: { id: itemId } })
            if (!item) throw new Error('Artículo no encontrado')

            const newStock = type === 'in'
                ? item.stock_quantity + quantity
                : item.stock_quantity - quantity

            if (newStock < 0) throw new Error('Stock insuficiente')

            await tx.inventoryItem.update({
                where: { id: itemId },
                data: { stock_quantity: newStock }
            })

            // Log movement
            await tx.stockMovement.create({
                data: {
                    organization_id: user.organization_id!,
                    item_id: itemId,
                    user_id: session.user.id,
                    type,
                    quantity,
                    reason
                }
            })
        })

        revalidatePath('/dashboard/inventory')
        return { success: true }
    } catch (error) {
        return { success: false, message: error instanceof Error ? error.message : 'Error de inventario' }
    }
}
