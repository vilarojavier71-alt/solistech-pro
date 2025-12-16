import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PrivacyPage() {
    return (
        <div className="container mx-auto py-12 px-4 max-w-4xl">
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold text-center">Política de Privacidad</CardTitle>
                    <p className="text-center text-muted-foreground mt-2">Última actualización: 16 de Diciembre de 2025</p>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none space-y-6">
                    <section>
                        <h2 className="text-xl font-semibold mb-2">1. Responsable del Tratamiento</h2>
                        <p>
                            El responsable del tratamiento de sus datos personales es <strong>MotorGap</strong>,
                            accesible en https://motorgap.es. Puede contactarnos en: motorgapvilaro@gmail.com
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-2">2. Finalidad del Tratamiento</h2>
                        <p>Tratamos sus datos personales para las siguientes finalidades:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li><strong>Prestación del Servicio:</strong> Gestión de usuarios, talleres, clientes, vehículos y facturación dentro de la plataforma MotorGap.</li>
                            <li><strong>Facturación:</strong> Emisión de facturas y gestión de cobros (a través de Stripe).</li>
                            <li><strong>Soporte y Contacto:</strong> Resolución de incidencias y comunicaciones relacionadas con el servicio.</li>
                            <li><strong>Mejora del Servicio:</strong> Análisis de uso (si ha dado su consentimiento para cookies analíticas).</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-2">3. Legitimación</h2>
                        <p>La base legal para el tratamiento de sus datos es:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li><strong>Ejecución de un contrato:</strong> Para la prestación de los servicios solicitados (registro y suscripción).</li>
                            <li><strong>Obligación Legal:</strong> Para la facturación y retención de datos fiscales según normativa de Hacienda (España).</li>
                            <li><strong>Consentimiento:</strong> Para el uso de cookies no esenciales o comunicaciones comerciales.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-2">4. Destinatarios de los Datos</h2>
                        <p>Sus datos pueden ser compartidos con proveedores de servicios necesarios para la operativa:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li><strong>Stripe:</strong> Pasarela de pagos (EE.UU., con garantías adecuadas - Decisión de Adecuación marco UE-EEUU).</li>
                            <li><strong>Google Cloud/Vercel:</strong> Alojamiento e infraestructura.</li>
                            <li><strong>Administración Tributaria (AEAT):</strong> Cuando sea requerido por ley para facturas electrónicas.</li>
                        </ul>
                        <p className="mt-2">No vendemos sus datos a terceros.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-2">5. Derechos ARCO (Acceso, Rectificación, Cancelación, Oposición)</h2>
                        <p>De acuerdo con el <strong>RGPD (Reglamento General de Protección de Datos)</strong> y la <strong>LOPD-GDD (Ley Orgánica de Protección de Datos y Garantía de Derechos Digitales)</strong>, usted tiene derecho a:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li><strong>Acceso:</strong> Obtener confirmación de si tratamos sus datos y acceder a ellos.</li>
                            <li><strong>Rectificación:</strong> Solicitar la corrección de datos inexactos o incompletos.</li>
                            <li><strong>Supresión (Cancelación):</strong> Solicitar la eliminación de sus datos cuando ya no sean necesarios ("Derecho al olvido").</li>
                            <li><strong>Oposición:</strong> Oponerse al tratamiento de sus datos por motivos legítimos.</li>
                            <li><strong>Limitación:</strong> Solicitar la limitación del tratamiento en determinadas circunstancias.</li>
                            <li><strong>Portabilidad:</strong> Recibir sus datos en formato estructurado y transmitirlos a otro responsable.</li>
                        </ul>
                        <p className="mt-4">
                            <strong>Para ejercer sus derechos:</strong> Envíe un correo a <a href="mailto:motorgapvilaro@gmail.com" className="text-primary hover:underline">motorgapvilaro@gmail.com</a> indicando
                            el derecho que desea ejercer y adjuntando copia de su DNI/NIE. Responderemos en un plazo máximo de 30 días.
                        </p>
                        <p className="mt-2">
                            También puede presentar una reclamación ante la <strong>Agencia Española de Protección de Datos (AEPD)</strong>: <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.aepd.es</a>
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-2">6. Conservación de los Datos</h2>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li><strong>Datos de cuenta:</strong> Mientras mantenga su cuenta activa.</li>
                            <li><strong>Datos fiscales/facturas:</strong> 5 años (obligación legal según Ley General Tributaria).</li>
                            <li><strong>Logs de seguridad:</strong> 12 meses.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-2">7. Medidas de Seguridad</h2>
                        <p>
                            Aplicamos medidas técnicas y organizativas para proteger sus datos: cifrado TLS en tránsito,
                            cifrado en reposo, control de acceso basado en roles (RBAC), y auditorías periódicas.
                        </p>
                    </section>
                </CardContent>
            </Card>
        </div>
    )
}
