'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { updateBillingDetails } from '@/lib/actions/billing'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export function BillingDetailsForm() {
    const [loading, setLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        const data = {
            taxId: formData.get('taxId') as string,
            billingEmail: formData.get('billingEmail') as string,
            address: formData.get('address') as string,
            city: formData.get('city') as string,
            postalCode: formData.get('postalCode') as string,
            country: 'ES' // Default for now
        }

        try {
            const result = await updateBillingDetails(data)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Datos de facturación actualizados')
            }
        } catch (error) {
            toast.error('Error inesperado')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Datos Fiscales</CardTitle>
                <CardDescription>
                    Información que aparecerá en tus facturas
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="taxId">CIF / NIF / VAT ID</Label>
                            <Input id="taxId" name="taxId" placeholder="B12345678" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="billingEmail">Email de Facturación</Label>
                            <Input id="billingEmail" name="billingEmail" type="email" placeholder="facturacion@empresa.com" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Dirección Fiscal</Label>
                        <Input id="address" name="address" placeholder="Calle Principal, 123" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="city">Ciudad</Label>
                            <Input id="city" name="city" placeholder="Madrid" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="postalCode">Código Postal</Label>
                            <Input id="postalCode" name="postalCode" placeholder="28001" />
                        </div>
                    </div>

                    <Button type="submit" disabled={loading} className="w-full md:w-auto">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar Datos Fiscales
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
