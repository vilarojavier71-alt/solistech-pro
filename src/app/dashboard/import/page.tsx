import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { UnifiedImportPage } from '@/components/import/unified-import-page'

export const metadata: Metadata = {
    title: 'Importar Datos | SolisTech PRO',
    description: 'Importa clientes, proyectos y cálculos desde Excel o CSV',
}

export default async function ImportPage() {
    const session = await auth()

    if (!session?.user) redirect('/auth/login')

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-display-md font-bold text-slate-900 dark:text-slate-100">
                    Importador Universal
                </h1>
                <p className="text-body-lg text-slate-600 dark:text-slate-400 mt-2">
                    Importa clientes, proyectos o cálculos desde archivos Excel o CSV con detección inteligente en todos los módulos.
                </p>
            </div>

            <UnifiedImportPage />
        </div>
    )
}
