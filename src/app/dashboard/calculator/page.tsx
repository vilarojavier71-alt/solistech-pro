import { Metadata } from 'next'
import { SolarCalculatorPremium } from '@/components/calculator/solar-calculator-premium'

export const metadata: Metadata = {
    title: 'Calculadora Solar Premium | MotorGap',
    description: 'Calcula y dimensiona instalaciones fotovoltaicas con diseño premium',
}

import { getCurrentUserWithRole } from '@/lib/session'
import { prisma } from '@/lib/db'

// ... existing imports
// NOTE: prisma is imported from '@/lib/db' which has type aliases for User/users. Typescript might complain but runtime is fine.


export default async function CalculatorPage() {
    const user = await getCurrentUserWithRole()
    let isPro = false
    let customers: any[] = []

    if (user?.organizationId) {
        const org = await prisma.organizations.findUnique({
            where: { id: user.organizationId },
            select: { subscription_plan: true, is_god_mode: true }
        })
        isPro = org?.subscription_plan === 'pro' || !!org?.is_god_mode

        // Fetch customers for the save dialog
        customers = await prisma.customers.findMany({
            where: { organization_id: user.organizationId },
            select: { id: true, name: true },
            orderBy: { name: 'asc' }
        })
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
}
