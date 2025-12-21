import { Metadata } from 'next'

export const dynamic = 'force-dynamic'
import { ClientLoginForm } from '@/components/portal/client-login-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
    title: 'Portal Cliente | MotorGap',
    description: 'Accede a tu trámite de instalación solar',
}

export default function ClientPortalPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-blue-100 p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-sky-900 mb-2">
                        MotorGap
                    </h1>
                    <p className="text-sky-700">
                        Portal de Cliente
                    </p>
                </div>

                <Card className="shadow-xl">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">ðŸ” Accede a tu Trámite</CardTitle>
                        <CardDescription>
                            Ingresa tu DNI y código de acceso para ver el estado de tu instalación solar
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ClientLoginForm />
                    </CardContent>
                </Card>

                <div className="mt-6 text-center text-sm text-sky-700">
                    <p>¿No tienes código de acceso?</p>
                    <p className="mt-1">
                        Revisa el email que te enviamos o{' '}
                        <a href="mailto:soporte@motorgap.es" className="font-medium underline hover:text-sky-900">
                            contáctanos
                        </a>
                    </p>
                </div>
            </div>
        </div>
    )
}
