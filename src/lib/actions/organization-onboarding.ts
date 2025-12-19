'use server'

import { prisma } from '@/lib/db'
import { getCurrentUserWithRole } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const CreateOrgSchema = z.object({
    name: z.string().min(3, "El nombre de la organización debe tener al menos 3 caracteres."),
    tax_id: z.string().optional(),
})

export async function createOrganization(formData: FormData) {
    // 1. Auth check using standardized session
    const user = await getCurrentUserWithRole()
    if (!user || !user.id) {
        return { error: "No estás autenticado." }
    }

    const userId = user.id

    // 2. Validate Input
    const rawData = {
        name: formData.get('name'),
        tax_id: formData.get('tax_id'),
    }

    const validation = CreateOrgSchema.safeParse(rawData)

    if (!validation.success) {
        return { error: validation.error.errors[0].message }
    }

    const { name, tax_id } = validation.data

    try {
        // 3. Double Check if user already has an org (DB check via Prisma)
        const userData = await prisma.User.findUnique({
            where: { id: userId },
            select: { organization_id: true }
        })

        if (userData?.organization_id) {
            return { error: "Ya tienes una organización asignada." }
        }

        // 4. Generate Slug
        const baseSlug = name.toLowerCase()
            .replace(/ñ/g, 'n')
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')

        let slug = baseSlug
        let counter = 1
        let isUnique = false

        // Loop to check uniqueness via Prisma
        while (!isUnique) {
            const checkSlug = counter === 1 ? slug : `${baseSlug}-${counter}`

            const existing = await prisma.organizations.findUnique({
                where: { slug: checkSlug },
                select: { id: true }
            })

            if (!existing) {
                slug = checkSlug
                isUnique = true
            } else {
                counter++
            }
        }

        // 5. Transaction: Create Org + Link User + Create Settings
        // Using Prisma Transaction for ACID guarantees against Local Docker Postgres
        const result = await prisma.$transaction(async (tx) => {
            // A. Create Organization
            console.log('[CreateOrg] Inserting organization via Prisma...')
            const newOrg = await tx.organizations.create({
                data: {
                    name,
                    slug,
                    tax_id: tax_id || null,
                    subscription_plan: 'basic',
                    subscription_status: 'active'
                }
            })

            // B. Update User
            console.log('[CreateOrg] Linking user via Prisma...')
            await tx.users.update({
                where: { id: userId },
                data: {
                    organization_id: newOrg.id,
                    role: 'owner'
                }
            })

            // C. Initialize Settings
            console.log('[CreateOrg] Creating settings via Prisma...')
            await tx.organization_settings.create({
                data: {
                    organization_id: newOrg.id,
                    presentation_template: 'ebro-solar',
                    default_fiscal_deduction: '40'
                }
            })

            return newOrg
        })

        console.log('[CreateOrg] Organization created successfully:', result.id)

        // 6. Revalidate
        revalidatePath('/dashboard', 'layout') // Aggressive purge of dashboard layout
        revalidatePath('/', 'layout')
        return { success: true, organizationId: result.id, slug: result.slug }

    } catch (error: any) {
        console.error("[CreateOrg Error]", error)
        return { error: `Error interno: ${error.message || JSON.stringify(error)}` }
    }
}
