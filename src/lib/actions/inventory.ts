"use server"

import { getCurrentUserWithRole } from "@/lib/session"
import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"

export interface InventoryItem {
    id: string
    name: string
    sku: string | null
    category: string | null
    quantity: number
    min_quantity: number | null
    unit_price: number | null
    location: string | null
    updated_at: string
}

// Helper to get organization ID reliably
async function getOrganizationId(): Promise<string | null> {
    const user = await getCurrentUserWithRole()
    if (!user) return null

    // 1. Try Session
    let orgId = user.organizationId

    // 2. If missing, Try DB (Re-hydration)
    if (!orgId) {
        const dbUser = await prisma.users.findUnique({
            where: { id: user.id },
            select: { organization_id: true }
        })
        if (dbUser?.organization_id) orgId = dbUser.organization_id
    }

    return orgId || null
}

export async function getInventoryItems(): Promise<InventoryItem[]> {
    try {
        const orgId = await getOrganizationId()
        if (!orgId) return []

        // Use Prisma directly (Admin Context)
        const items = await prisma.inventory_items.findMany({
            where: { organization_id: orgId },
            orderBy: { name: 'asc' }
        })

        return items.map(item => ({
            ...item,
            sku: item.sku,
            category: item.category,
            min_quantity: item.min_quantity,
            unit_price: item.unit_price ? Number(item.unit_price) : 0,
            updated_at: item.updated_at.toISOString()
        }))
    } catch (error) {
        console.error("Error fetching inventory:", error)
        return []
    }
}

export async function createInventoryItem(data: { name: string; quantity: number; category: string; sku?: string, unit_price?: number }) {
    try {
        const orgId = await getOrganizationId()
        if (!orgId) return { success: false, message: "Organización no válida o usuario no autenticado." }

        await prisma.inventory_items.create({
            data: {
                organization_id: orgId,
                name: data.name,
                quantity: data.quantity,
                category: data.category,
                sku: data.sku,
                unit_price: data.unit_price
            }
        })

        revalidatePath("/dashboard/inventory")
        return { success: true }
    } catch (error) {
        console.error("Error creating inventory item:", error)
        return { success: false, message: "Error al crear item de inventario." }
    }
}

// Stub function to prevent errors in UI calls
export async function updateStock(itemId: string, quantity: number, type: 'in' | 'out', reason: string) {
    try {
        const orgId = await getOrganizationId()
        if (!orgId) return { success: false, message: "No autorizado" }

        const item = await prisma.inventory_items.findUnique({ where: { id: itemId } })
        if (!item) return { success: false, message: "Item no encontrado" }

        const newQuantity = type === 'in' ? item.quantity + quantity : item.quantity - quantity

        await prisma.inventory_items.update({
            where: { id: itemId },
            data: { quantity: newQuantity }
        })
        revalidatePath("/dashboard/inventory")
        return { success: true }
    } catch (error) {
        return { success: false, message: "Error al actualizar stock" }
    }
}

export async function createSupplier(data: any) {
    return { success: false, message: "Funcionalidad en desarrollo" }
}

export async function createComponent(data: any) {
    return { success: false, message: "Funcionalidad en desarrollo" }
}
