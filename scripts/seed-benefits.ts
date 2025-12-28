
import { PrismaClient } from '@prisma/client'
import { MUNICIPAL_BENEFITS } from '../src/lib/data/municipal-benefits'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting seeding of Municipal Benefits...')

    // Limpiar tabla existente (opcional, para desarrollo)
    // await prisma.municipalBenefit.deleteMany()

    let count = 0
    for (const benefit of MUNICIPAL_BENEFITS) {
        // Usar upsert para evitar duplicados si se corre varias veces
        // Generamos un ID determinista o buscamos por municipio+provincia si es posible
        // Dado que no hay unique constraints simples, usaremos create si no existe lógica compleja,
        // pero para este script inicial, borrón y cuenta nueva es más seguro o createMany.
        // Sin embargo, MUNICIPAL_BENEFITS tiene 'id' string que podemos usar.

        // Si la estructura del ID en data.ts es compatible con UUID, lo usamos.
        // Los IDs en data.ts son "madrid-ciudad", no UUIDs.
        // Prisma espera UUID para el campo ID por defecto @default(dbgenerated("gen_random_uuid()")) @db.Uuid
        // PERO definimos id como String @id @default...
        // Si pasamos un ID que no es UUID a un campo UUID fallará.
        // El modelo define id @db.Uuid. Los datos estáticos tienen "madrid-ciudad".
        // SOLUCIÓN: Dejaremos que Postgres genere el UUID y mapearemos los datos.

        await prisma.municipalBenefit.create({
            data: {
                municipality: benefit.municipality,
                province: benefit.province,
                autonomous_community: benefit.autonomous_community,
                scope_level: benefit.scope_level,
                ibi_percentage: benefit.ibi_percentage,
                ibi_years: benefit.ibi_years,
                icio_percentage: benefit.icio_percentage,
                requirements: benefit.requirements,
                source_url: benefit.source_url,
                // last_updated se pone auto a now()
            }
        })
        count++
    }

    console.log(`✅ Seeded ${count} municipal benefits`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
