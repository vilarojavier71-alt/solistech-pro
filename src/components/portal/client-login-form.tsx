'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
// import { createClient } from '@/lib/supabase/client'


export function ClientLoginForm() {
    const [dni, setDni] = useState('')
    const [accessCode, setAccessCode] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    // const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Server Action Login
            const { loginClientAction } = await import('@/lib/actions/portal-auth')
            const result = await loginClientAction(dni, accessCode)

            if (!result.success || !result.data) {
                toast.error(result.error || 'DNI o código de acceso incorrecto')
                setLoading(false)
                return
            }

            const sale = result.data

            // Guardar en sessionStorage
            sessionStorage.setItem('client_sale_id', sale.id)
            sessionStorage.setItem('client_dni', sale.dni)

            toast.success('¡Bienvenido!')
            router.push('/portal/dashboard')
        } catch (error: any) {
            console.error('Login error:', error)
            toast.error('Error al iniciar sesión')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="dni">DNI / NIE</Label>
                <Input
                    id="dni"
                    placeholder="12345678A"
                    value={dni}
                    onChange={(e) => setDni(e.target.value.toUpperCase())}
                    required
                    disabled={loading}
                    className="text-lg"
                    maxLength={9}
                />
                <p className="text-xs text-muted-foreground">
                    Sin espacios ni guiones
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="code">Código de Acceso</Label>
                <Input
                    id="code"
                    placeholder="ABC123"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                    required
                    disabled={loading}
                    className="text-lg font-mono tracking-wider"
                    maxLength={6}
                />
                <p className="text-xs text-muted-foreground">
                    Revisa el email que te enviamos
                </p>
            </div>

            <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading || dni.length < 8 || accessCode.length < 6}
            >
                {loading ? 'Verificando...' : 'Entrar'}
            </Button>
        </form>
    )
}
