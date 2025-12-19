'use server'

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

export type ImportResult = {
    success: boolean;
    count?: number;
    errors?: string[];
    message?: string;
}

/**
 * Generic function to import data from parsed CSV.
 * NOTE: Prisma doesn't support dynamic table names like Supabase.
 * This is a stub that needs specific implementations per table.
 * 
 * @param tableName The name of the table to insert into
 * @param dataArray Array of objects with data to import
 */
export async function importDataFromCsv<T = any>(
    tableName: string,
    dataArray: Record<string, any>[]
): Promise<ImportResult> {
    const session = await auth()

    if (!session?.user) {
        return { success: false, message: "No autorizado. Inicia sesión." }
    }

    try {
        // Get User's Organization
        const userDetails = await prisma.User.findUnique({
            where: { id: session.user.id },
            select: { organization_id: true }
        })

        if (!userDetails?.organization_id) {
            return { success: false, message: "No se encontró la organización del usuario." }
        }

        const orgId = userDetails.organization_id

        // Prepare Data - inject org_id
        const rowsToInsert = dataArray.map(row => {
            const cleanRow: Record<string, any> = { ...row }

            // Remove empty keys/values
            Object.keys(cleanRow).forEach(key => {
                if (cleanRow[key] === '' || cleanRow[key] === undefined || cleanRow[key] === null) {
                    delete cleanRow[key]
                }
            })

            cleanRow['organization_id'] = orgId
            return cleanRow
        })

        if (rowsToInsert.length === 0) {
            return { success: false, message: "No hay datos válidos para importar." }
        }

        // Prisma requires specific model access - using switch for supported tables
        switch (tableName) {
            case 'customers':
                await prisma.customers.createMany({
                    data: rowsToInsert.map(r => ({
                        name: r.name || r.full_name || 'Sin nombre',
                        email: r.email,
                        phone: r.phone,
                        nif: r.nif,
                        address: r.address,
                        city: r.city,
                        postal_code: r.postal_code,
                        province: r.province,
                        organization_id: orgId
                    })),
                    skipDuplicates: true
                })
                break

            case 'projects':
                await prisma.projects.createMany({
                    data: rowsToInsert.map(r => ({
                        name: r.name || 'Proyecto Importado',
                        description: r.description,
                        status: r.status || 'quote',
                        organization_id: orgId
                    })),
                    skipDuplicates: true
                })
                break

            default:
                // Table not yet supported in Prisma import
                return {
                    success: false,
                    message: `Importación para tabla '${tableName}' no soportada aún. Tablas disponibles: customers, projects.`
                }
        }

        revalidatePath(`/dashboard/${tableName}`)
        revalidatePath('/dashboard')

        return { success: true, count: rowsToInsert.length, message: `Importación exitosa de ${rowsToInsert.length} registros.` }

    } catch (err: any) {
        console.error("Unexpected Import Error:", err)
        return { success: false, message: "Error inesperado durante la importación: " + err.message }
    }
}

