import { Metadata } from 'next'
import { MunicipalBenefitsSearch } from '@/components/benefits/municipal-benefits-search'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Info } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Buscador de Ayudas Municipales | MotorGap',
    description: 'Encuentra las bonificaciones IBI e ICIO disponibles en tu municipio',
}

export default function BenefitsSearchPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Buscador de Ayudas Municipales</h1>
                <p className="text-muted-foreground">
                    Consulta las bonificaciones fiscales (IBI/ICIO) disponibles para instalaciones solares
                </p>
            </div>

            <MunicipalBenefitsSearch />

            {/* Información adicional */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        Sobre las bonificaciones municipales
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h4 className="font-semibold mb-2">¿Qué es el IBI?</h4>
                        <p className="text-sm text-muted-foreground">
                            El Impuesto sobre Bienes Inmuebles (IBI) es un tributo municipal que grava la propiedad de bienes inmuebles.
                            Muchos ayuntamientos ofrecen bonificaciones del 30% al 95% durante 3-10 años para instalaciones de energía solar.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-2">¿Qué es el ICIO?</h4>
                        <p className="text-sm text-muted-foreground">
                            El Impuesto sobre Construcciones, Instalaciones y Obras (ICIO) grava la realización de obras.
                            Las bonificaciones suelen ser del 50% al 95% y se aplican una sola vez durante la instalación.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-2">¿Cómo solicitar las bonificaciones?</h4>
                        <p className="text-sm text-muted-foreground">
                            Generalmente debes presentar una solicitud en tu ayuntamiento junto con la documentación técnica de la instalación.
                            Consulta las ordenanzas fiscales de tu municipio para conocer los requisitos específicos.
                        </p>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg">
                        <p className="text-sm">
                            <strong>Nota importante:</strong> Las bonificaciones mostradas son orientativas.
                            Te recomendamos verificar la información en las ordenanzas fiscales oficiales de tu ayuntamiento.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
