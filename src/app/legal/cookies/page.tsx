'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function CookiesPage() {
    return (
        <div className="container mx-auto py-12 px-4 max-w-4xl">
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold text-center">Política de Cookies</CardTitle>
                    <p className="text-center text-muted-foreground mt-2">Última actualización: 15 de Diciembre de 2025</p>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none space-y-6">

                    <section>
                        <h2 className="text-xl font-semibold mb-2">1. ¿Qué son las Cookies?</h2>
                        <p>
                            Una cookie es un pequeño archivo de texto que se almacena en su navegador cuando visita casi cualquier página web.
                            Su utilidad es que la web sea capaz de recordar su visita cuando vuelva a navegar por esa página.
                            Las cookies suelen almacenar información de carácter técnico, preferencias personales, personalización de contenidos,
                            estadísticas de uso, enlaces a redes sociales, acceso a cuentas de usuario, etc.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-2">2. Cookies que utilizamos en este sitio</h2>

                        <div className="mt-4">
                            <h3 className="font-semibold text-lg">Cookies Técnicas (Necesarias)</h3>
                            <p>Son aquellas que permiten al usuario la navegación a través de la página web y la utilización de las diferentes opciones o servicios que en ella existen. Por ejemplo:</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li><strong>Autenticación:</strong> Para mantener la sesión del usuario activa (`next-auth`, `session-token`).</li>
                                <li><strong>Seguridad:</strong> Para detectar intentos de acceso fraudulento.</li>
                                <li><strong>Pagos:</strong> Cookies de Stripe para procesar pagos seguros y prevenir fraude.</li>
                                <li><strong>Preferencias:</strong> Recordar si ha aceptado o rechazado las cookies (`cookie-consent`).</li>
                            </ul>
                        </div>

                        <div className="mt-4">
                            <h3 className="font-semibold text-lg">Cookies de Análisis (Opcionales)</h3>
                            <p>Son aquellas que nos permiten cuantificar el número de usuarios y así realizar la medición y análisis estadístico de la utilización que hacen los usuarios del servicio.</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li><strong>Google Analytics:</strong> Utilizamos Google Analytics para entender cómo interactúan los visitantes con el sitio. Esta información es anónima.</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-2">3. Gestión de Cookies</h2>
                        <p>
                            Puede permitir, bloquear o eliminar las cookies instaladas en su equipo mediante el panel de configuración que ponemos a su disposición,
                            o mediante la configuración de las opciones del navegador instalado en su ordenador.
                        </p>
                        <div className="flex justify-center mt-6">
                            <Button variant="outline" className="mr-4" onClick={() => {
                                // Trigger cookie banner open logic if implemented via event or context
                                localStorage.removeItem('cookie-consent');
                                window.location.reload();
                            }}>
                                Restablecer Preferencias
                            </Button>
                        </div>
                    </section>

                </CardContent>
            </Card>
        </div>
    )
}
