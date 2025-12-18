import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

const prismaClientSingleton = () => {
    const client = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    })

    // [MILITARY PROTOCOL] POLYFILL INJECTION FOR NEXTAUTH ADAPTER
    // Maps standard Auth.js models (singular) to existing Schema (plural)
    const p = client as any
    if (!p.user) {
        Object.defineProperty(p, 'user', { get: () => client.users })
        Object.defineProperty(p, 'account', { get: () => client.accounts })
        Object.defineProperty(p, 'session', { get: () => client.sessions })
        Object.defineProperty(p, 'verificationToken', { get: () => client.verification_tokens })
    }

    return client
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
}

export default prisma
