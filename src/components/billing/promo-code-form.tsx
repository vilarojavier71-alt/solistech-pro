'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Ticket } from 'lucide-react'
import { toast } from 'sonner'
import { applyPromoCode } from '@/lib/actions/admin'

import { useRouter } from 'next/navigation'

export function PromoCodeForm() {
    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!code.trim()) return

        setLoading(true)
        try {
            const result = await applyPromoCode(code.trim())

            if (result.success) {
                toast.success(result.message)
                setCode('')
                router.refresh()
            } else {
                toast.error(result.error || 'Código inválido')
            }
        } catch (error) {
            toast.error('Error al aplicar el código')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <Ticket className="h-5 w-5 text-purple-500" />
                    <CardTitle className="text-base">Código Promocional</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <Input
                        placeholder="Introduce tu código"
                        value={code}
                        disabled={loading}
                        onChange={(e) => setCode(e.target.value)}
                        className="flex-1"
                    />
                    <Button
                        type="submit"
                        disabled={loading || !code.trim()}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        {loading ? 'Aplicando...' : 'Canjear'}
                    </Button>
                </form>
                <p className="text-xs text-muted-foreground mt-2">
                    Si tienes un código de acceso especial, introdúcelo aquí para desbloquear funciones.
                </p>
            </CardContent>
        </Card>
    )
}
