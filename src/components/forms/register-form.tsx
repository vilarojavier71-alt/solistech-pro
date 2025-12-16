'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { registerUser } from '@/lib/actions/auth-actions'

export function RegisterForm() {
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [organizationName, setOrganizationName] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const result = await registerUser({
                email,
                password,
                fullName,
                organizationName,
            })

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Â¡Cuenta creada! Redirigiendo al login...')
                router.push('/auth/login')
            }
        } catch (error: any) {
            console.error('Registration error:', error)
            toast.error(error.message || 'Error al crear la cuenta')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="fullName">Nombre completo</Label>
                <Input
                    id="fullName"
                    type="text"
                    placeholder="Juan Pérez"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={loading}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="organizationName">Nombre de la empresa</Label>
                <Input
                    id="organizationName"
                    type="text"
                    placeholder="Solar Instalaciones S.L."
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    required
                    disabled={loading}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                    Mínimo 6 caracteres
                </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
                Al registrarte, aceptas nuestros términos de servicio y política de privacidad.
                <br />
                <strong>14 días de prueba gratis</strong> - No se requiere tarjeta de crédito.
            </p>
        </form>
    )
}
