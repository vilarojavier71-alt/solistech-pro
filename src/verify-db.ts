
import { prisma } from './lib/db'

async function verify() {
    console.log('--- DB INTEGRITY CHECK ---')
    console.log('Querying latest organization...')

    try {
        const latestOrg = await prisma.organization.findFirst({
            orderBy: { created_at: 'desc' }
        })

        if (latestOrg) {
            console.log('✅ DATA FOUND in DB:')
            console.log('ID:', latestOrg.id)
            console.log('Name:', latestOrg.name)
            console.log('Slug:', latestOrg.slug)
            console.log('Created:', latestOrg.created_at)
        } else {
            console.log('❌ NO DATA FOUND. Table is empty or query failed.')
        }
    } catch (e) {
        console.error('🚨 CONNECTION ERROR:', e)
    }
}

verify()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
