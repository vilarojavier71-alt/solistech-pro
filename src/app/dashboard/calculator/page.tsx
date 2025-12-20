import { Metadata } from 'next'
import { SolarCalculatorPremium } from '@/components/calculator/solar-calculator-premium'

export const metadata: Metadata = {
    title: 'Calculadora Solar Premium | SolisTech PRO',
    description: 'Calcula y dimensiona instalaciones fotovoltaicas con diseño premium',
}

import { getCurrentUserWithRole } from '@/lib/session'
import { prisma } from '@/lib/db'

export default async function CalculatorPage() {
    const user = await getCurrentUserWithRole()
    let isPro = false

    if (user?.organizationId) {
        const org = await prisma.organizations.findUnique({
            where: { id: user.organizationId },
            select: { subscription_plan: true, is_god_mode: true }
        })
        isPro = org?.subscription_plan === 'pro' || !!org?.is_god_mode
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

            <SolarCalculatorPremium isPro={isPro} />
        </div>
    )
}
