import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, FileText, Download } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
    title: 'Presentaciones | SolisTech PRO',
    description: 'Gestión de presentaciones PowerPoint',
}

export default async function PresentationsPage() {
    const session = await auth()

    if (!session?.user) redirect('/auth/login')

    const userData = await prisma.User.findUnique({
        where: { id: session.user.id },
        select: { organization_id: true }
    })

    if (!userData?.organization_id) redirect('/dashboard')

    // STUB: presentations table doesn't exist in Prisma schema
    // TODO: Add presentations model to schema
    const presentations: any[] = []

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Presentaciones</h1>
                    <p className="text-muted-foreground">
                        Gestiona tus presentaciones PowerPoint generadas con IA
                    </p>
                </div>
                <Link href="/dashboard/presentations/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva Presentación
                    </Button>
                </Link>
            </div>

            <div className="grid gap-4">
                {presentations && presentations.length > 0 ? (
                    presentations.map((presentation: any) => (
                        <Card key={presentation.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle>{presentation.title}</CardTitle>
                                        <CardDescription>
                                            Cliente: {presentation.customers?.full_name || 'N/A'}
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        {presentation.pptx_file_url && (
                                            <a href={presentation.pptx_file_url} download>
                                                <Button size="sm">
                                                    <Download className="mr-2 h-4 w-4" />
                                                    Descargar
                                                </Button>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span>Estado: {presentation.status}</span>
                                    <span>Deducción: {presentation.fiscal_deduction_type}%</span>
                                    <span>Creado: {new Date(presentation.created_at).toLocaleDateString()}</span>
                                    {presentation.simulated_photo_url && (
                                        <span className="text-green-600">✓ Con IA</span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No hay presentaciones</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Crea tu primera presentación PowerPoint con IA
                            </p>
                            <Link href="/dashboard/presentations/new">
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nueva Presentación
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
