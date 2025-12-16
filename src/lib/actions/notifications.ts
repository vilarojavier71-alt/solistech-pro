'use server'

import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

// STUB: Notifications require full Prisma migration
// These stubs allow the app to run while migration is in progress

export async function getUnreadCount() {
    const session = await auth()
    if (!session?.user) return 0

    // TODO: Implement with Prisma when notifications table is migrated
    return 0
}

export async function getNotifications(limit = 10) {
    const session = await auth()
    if (!session?.user) return []

    // TODO: Implement with Prisma when notifications table is migrated
    return []
}

export async function markAsRead(id: string) {
    // TODO: Implement with Prisma
    revalidatePath('/dashboard')
    return { success: true }
}

export async function markAllAsRead() {
    const session = await auth()
    if (!session?.user) return { success: false }

    // TODO: Implement with Prisma
    revalidatePath('/dashboard')
    return { success: true }
}

export async function createNotification(
    userId: string,
    orgId: string,
    title: string,
    message: string,
    type = 'info',
    link?: string
) {
    // TODO: Implement with Prisma
    console.log(`[NOTIFICATION STUB] ${title}: ${message}`)
}

// EMAIL STUBS (To be implemented with Resend/SendGrid)
export async function notifyNewSale(email: string, name: string, saleNumber: string) {
    console.log(`[MOCK EMAIL] To: ${email}, Subject: Welcome! Sale ${saleNumber}`)
    return { success: true }
}

export async function sendQuoteEmail(email: string, name: string, quoteNumber: string, url: string, total: number) {
    console.log(`[MOCK EMAIL] To: ${email}, Subject: Presupuesto ${quoteNumber}, Total: ${total}€, Link: ${url}`)
    return { success: true }
}

export async function notifyPaymentReceived(email: string, amount: number, saleNumber: string) {
    console.log(`[MOCK EMAIL] To: ${email}, Subject: Pago Recibido ${amount}€ - ${saleNumber}`)
    return { success: true }
}
