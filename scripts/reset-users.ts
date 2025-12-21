import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🧹 Starting User Cleanup Protocol...')

    try {
        // 1. Delete dependent auth tables first
        console.log('Deleting Sessions...')
        await prisma.session.deleteMany({})

        console.log('Deleting Accounts...')
        await prisma.account.deleteMany({})

        // 2. Delete Users (This might fail if they have linked business data like Projects)
        // We attempt to delete users who are NOT 'admin' owner if possible, or all if it's a hard reset.
        // Protocol says "Limpieza de Usuarios" for "nuevo ciclo de pruebas".
        // We will delete ALL users to allow fresh registration of e.g. the same email.

        console.log('Deleting Users...')
        const { count } = await prisma.user.deleteMany({})

        console.log(`✅ Successfully deleted ${count} users.`)
        console.log('🛡️  System clean and ready for registration testing.')

    } catch (error) {
        console.error('❌ Error during cleanup:', error)
        // If FK violation matches projects/invoices, we might need a more aggressive approach or manual update
        // But for now, we assume standard auth reset.
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
