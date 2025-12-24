import { Metadata } from 'next'
import { SolarCalculatorPremium } from '@/components/calculator/solar-calculator-premium'
import { getCurrentUserWithRole } from '@/lib/session'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

export const metadata: Metadata = {
    title: 'Calculadora Solar Premium | MotorGap',
    description: 'Calcula y dimensiona instalaciones fotovoltaicas con diseño premium',
}

interface Customer {
    id: string
    name: string
}

/**
 * Server Component con manejo robusto de errores
 * ISO 27001: Error handling estructurado
 */
export default async function CalculatorPage() {
    try {
        const user = await getCurrentUserWithRole()
        let isPro = false
        let customers: Customer[] = []

        if (user?.organizationId) {
            try {
                const org = await prisma.organization.findUnique({
                    where: { id: user.organizationId },
                    select: { subscription_plan: true, is_god_mode: true }
                })
                isPro = org?.subscription_plan === 'pro' || !!org?.is_god_mode

                // Fetch customers for the save dialog
                customers = await prisma.customer.findMany({
                    where: { organization_id: user.organizationId },
                    select: { id: true, name: true },
                    orderBy: { name: 'asc' }
                })
            } catch (dbError) {
                // Log error but don't crash - allow page to render with defaults
                logger.error('Database error in CalculatorPage', {
                    source: 'calculator',
                    action: 'db_query_error',
                    userId: user?.id,
                    organizationId: user?.organizationId,
                    error: dbError instanceof Error ? dbError.message : 'Unknown error'
                })
                // Continue with defaults (isPro = false, customers = [])
            }
        }

        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-display-md font-bold text-slate-900 dark:text-slate-100">
                        Calculadora Solar Premium
                    </h1>
                    <p className="text-body-lg text-slate-600 dark:text-slate-400 mt-2">
                        Dimensiona instalaciones fotovoltaicas con datos reales y diseño de clase mundial
                    </p>
                </div>

                <SolarCalculatorPremium
                    isPro={isPro}
                    customers={customers}
                />
            </div>
        )
    } catch (error) {
        // Catch-all para errores no esperados
        logger.error('Critical error in CalculatorPage', {
            source: 'calculator',
            action: 'page_render_error',
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        })

        // Return error UI instead of crashing
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-display-md font-bold text-slate-900 dark:text-slate-100">
                        Calculadora Solar Premium
                    </h1>
                    <p className="text-body-lg text-slate-600 dark:text-slate-400 mt-2">
                        Dimensiona instalaciones fotovoltaicas con datos reales y diseño de clase mundial
                    </p>
                </div>
                <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-6">
                    <h2 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
                        Error al cargar la calculadora
                    </h2>
                    <p className="text-red-700 dark:text-red-300">
                        Por favor, recarga la página o contacta con soporte si el problema persiste.
                    </p>
                </div>
            </div>
        )
    }
}
