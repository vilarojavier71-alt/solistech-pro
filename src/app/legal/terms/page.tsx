import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TermsPage() {
    return (
        <div className="container mx-auto py-12 px-4 max-w-4xl">
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold text-center">Términos y Condiciones</CardTitle>
                    <p className="text-center text-muted-foreground mt-2">Última actualización: 16 de Diciembre de 2025</p>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none space-y-6">

                    <section>
                        <h2 className="text-xl font-semibold mb-2">1. Introducción</h2>
                        <p>
                            Bienvenido a MotorGap (https://motorgap.es). Al acceder y utilizar nuestra plataforma, usted acepta cumplir con estos Términos y Condiciones.
                            Si no está de acuerdo con alguna parte de los términos, no podrá acceder al servicio.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-2">2. Uso del Servicio</h2>
                        <p>MotorGap es una herramienta SaaS para la gestión integral de talleres de automoción. Usted se compromete a:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Utilizar el servicio únicamente con fines legales.</li>
                            <li>No intentar vulnerar la seguridad de la plataforma.</li>
                            <li>Proporcionar información veraz y actualizada.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-2">3. Suscripciones y Pagos</h2>
                        <p>
                            El servicio se ofrece bajo modelos de suscripción mensual o anual. Los pagos son procesados por Stripe.
                            Usted puede cancelar su suscripción en cualquier momento, y el servicio continuará activo hasta el final del periodo de facturación actual.
                            No se realizan reembolsos parciales.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-2">4. Propiedad Intelectual</h2>
                        <p>
                            El Servicio y su contenido original (excluyendo el contenido proporcionado por los usuarios), características y funcionalidad
                            son y seguirán siendo propiedad exclusiva de MotorGap y sus licenciantes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-2">5. Limitación de Responsabilidad</h2>
                        <p>
                            En ningún caso MotorGap, ni sus directores, empleados, socios, agentes, proveedores o afiliados, serán responsables de daños indirectos,
                            incidentales, especiales, consecuentes o punitivos, incluyendo sin limitación, pérdida de beneficios, datos, uso, fondo de comercio u otras pérdidas intangibles.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-2">6. Contacto</h2>
                        <p>
                            Para cualquier consulta relacionada con estos términos, puede contactarnos en: motorgapvilaro@gmail.com
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-2">7. Ley Aplicable</h2>
                        <p>
                            Estos Términos se regirán e interpretarán de acuerdo con las leyes de España, sin tener en cuenta sus disposiciones sobre conflictos de leyes.
                        </p>
                    </section>

                </CardContent>
            </Card>
        </div>
    )
}
