import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Package } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Componentes | SolisTech PRO',
    description: 'Catálogo de componentes solares',
}

export default function ComponentsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Componentes</h1>
                <p className="text-muted-foreground">
                    Catálogo de paneles, inversores, baterías y más
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Catálogo de Componentes</CardTitle>
                    <CardDescription>
                        Gestiona el catálogo de productos para tus instalaciones
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center p-12 text-center border border-dashed rounded-lg">
                        <div>
                            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold">Catálogo en desarrollo</h3>
                            <p className="text-sm text-muted-foreground mt-2">
                                Esta funcionalidad estará disponible próximamente
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
