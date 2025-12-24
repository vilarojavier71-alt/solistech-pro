import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, CheckCircle2, FileText, User, MapPin, Phone, Mail } from 'lucide-react'
import { DocumentsManager } from '@/components/sales/documents-manager'
import { SalePaymentControl } from '@/components/sales/payment-control'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function SaleDetailsPage({ params }: PageProps) {
    const { id } = await params

    // STUB: sales table not in Prisma schema
    // TODO: Add sales model to Prisma and fetch with prisma.sale.findUnique({ where: { id } })
    const sale = {
        id,
        customer_name: 'Cliente de ejemplo',
        sale_number: 'SALE-001',
        dni: '12345678A',
        customer_phone: '+34 600 000 000',
        customer_email: 'cliente@ejemplo.com',
        amount: 15000,
        material: 'Sistema solar 5kWp',
        payment_20_status: 'pending',
        documentation_status: 'pending',
        engineering_status: 'pending',
        process_status: 'pending',
        installation_status: 'pending',
        documentation_notes: ''
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header / Resumen Top */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-slate-900">{sale.customer_name}</h1>
                        <Badge variant="outline" className="text-lg px-3 py-1">
                            {sale.sale_number}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-slate-500">
                        <span className="flex items-center gap-1">
                            <User className="h-4 w-4" /> {sale.dni}
                        </span>
                        <span className="flex items-center gap-1">
                            <Phone className="h-4 w-4" /> {sale.customer_phone || 'Sin teléfono'}
                        </span>
                        <span className="flex items-center gap-1">
                            <Mail className="h-4 w-4" /> {sale.customer_email}
                        </span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline">Editar Datos</Button>
                    <Button className="bg-sky-600 hover:bg-sky-700">Acciones Rápidas</Button>
                </div>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-slate-100 p-1 rounded-lg">
                    <TabsTrigger value="overview">Resumen 360</TabsTrigger>
                    <TabsTrigger value="documents">Documentación</TabsTrigger>
                    <TabsTrigger value="financial">Económico</TabsTrigger>
                    <TabsTrigger value="installation">Ingeniería e Instalación</TabsTrigger>
                </TabsList>

                {/* TAB: Resumen */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Estado Actual */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Estado del Proyecto</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <StatusRow label="Pago Inicial (20%)" status={sale.payment_20_status} />
                                <StatusRow label="Documentación" status={sale.documentation_status} />
                                <StatusRow label="Ingeniería" status={sale.engineering_status} />
                                <StatusRow label="Permisos" status={sale.process_status} />
                                <StatusRow label="Instalación" status={sale.installation_status} />
                            </CardContent>
                        </Card>

                        {/* Info Sistema */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Sistema Contratado</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold mb-1">€{sale.amount.toLocaleString()}</p>
                                <p className="text-sm text-muted-foreground mb-4">Total con IVA incl.</p>

                                <div className="space-y-2 rounded-lg bg-slate-50 p-3 text-sm">
                                    <p className="font-semibold">Material:</p>
                                    <p className="whitespace-pre-wrap text-slate-600">{sale.material || 'Pendiente de definir detalle.'}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Notas Rápidas */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Notas Internas</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <textarea
                                    className="w-full h-32 p-3 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                                    placeholder="Escribe notas sobre el cliente aquí..."
                                    defaultValue={sale.documentation_notes || ''}
                                />
                                <Button size="sm" variant="ghost" className="mt-2 w-full">Guardar Nota</Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* TAB: Documentación */}
                <TabsContent value="documents">
                    <Card>
                        <CardHeader>
                            <CardTitle>Expediente Digital</CardTitle>
                            <CardDescription>Documentos subidos por el cliente y generados internamente.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DocumentsManager sale={sale} />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB: Financiero */}
                <TabsContent value="financial">
                    <Card>
                        <CardHeader>
                            <CardTitle>Control de Cobros</CardTitle>
                            <CardDescription>Gestión de hitos de pago y notificaciones.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <SalePaymentControl sale={sale} />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB: Instalación (Placeholder) */}
                <TabsContent value="installation">
                    <Card>
                        <CardHeader>
                            <CardTitle>Ingeniería e Instalación</CardTitle>
                            <CardDescription>Gestión técnica y de obra.</CardDescription>
                        </CardHeader>
                        <CardContent className="min-h-[200px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl m-6">
                            Próximamente: Asignación de instaladores y calendario de obra.
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </div>
    )
}

// Sub-componentes visuales sencillos para este archivo
function StatusRow({ label, status }: { label: string, status: string | undefined }) {
    let color = 'bg-slate-100 text-slate-500'
    let text = 'Pendiente'

    if (status === 'completed' || status === 'approved' || status === 'received') {
        color = 'bg-green-100 text-green-700'
        text = 'Completado'
    } else if (status === 'in_progress' || status === 'uploaded' || status === 'requested') {
        color = 'bg-blue-100 text-blue-700'
        text = 'En Curso'
    } else if (status === 'rejected') {
        color = 'bg-red-100 text-red-700'
        text = 'Rechazado'
    }

    return (
        <div className="flex items-center justify-between p-2 rounded hover:bg-slate-50">
            <span className="font-medium text-slate-700">{label}</span>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${color}`}>
                {text}
            </span>
        </div>
    )
}
