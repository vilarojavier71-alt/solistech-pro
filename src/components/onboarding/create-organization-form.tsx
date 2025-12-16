'use client'

import { useState, useTransition } from 'react'
import { createOrganization } from '@/lib/actions/organization-onboarding'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Building2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useSession } from "next-auth/react"

export function CreateOrganizationForm() {
    const [isPending, startTransition] = useTransition()
    const [isRedirecting, setIsRedirecting] = useState(false)
    const router = useRouter()
    const { update } = useSession()

    async function handleSubmit(formData: FormData) {
        startTransition(async () => {
            const result = await createOrganization(formData)

            if (result.error) {
                toast.error(result.error)
            } else {
                setIsRedirecting(true)
                toast.success("Organización creada. Sincronizando sesión...")

                // 1. Force Session Update (Hydrate new Org into Token)
                await update()

                // 2. Force router refresh to update server components with new session context
                router.refresh()

                // 3. Navigate to dashboard immediately via HARD RELOAD to prevent soft-locks
                setTimeout(() => {
                    // NUCLEAR OPTION: Force browser reload to regenerate session token.
                    // TARGET: /dashboard (Root). [slug] routing is confirmed to NOT exist (404).
                    // The hard reload ensures the new session (with org_id) is picked up by the layout.
                    const target = '/dashboard'
                    console.log('NUCLEAR RELOAD -> Target:', target, '| (Slug ignored for routing:', result.slug, ')')

                    if (!result.slug) {
                        console.warn('Warning: No slug returned, falling back to root')
                    }

                    window.location.assign(target)
                }, 1000)
            }
        })
    }

    const isLoading = isPending || isRedirecting

    return (
        <div className="flex min-h-[60vh] items-center justify-center p-4 animate-in zoom-in-95 duration-500">
            <Card className="w-full max-w-md shadow-2xl border-primary/20 bg-card/60 backdrop-blur-xl">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                        <Building2 className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Bienvenido</CardTitle>
                    <CardDescription>
                        Para comenzar, necesitamos configurar tu espacio de trabajo.
                        Crea una organización para gestionar tus proyectos.
                    </CardDescription>
                </CardHeader>
                <form action={handleSubmit}>
                    <CardContent className="space-y-4 pt-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre de la Empresa / Organización</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="Ej: Soluciones Solares SL"
                                required
                                minLength={3}
                                className="bg-background/50"
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tax_id">CIF / NIF (Opcional)</Label>
                            <Input
                                id="tax_id"
                                name="tax_id"
                                placeholder="B-12345678"
                                className="bg-background/50"
                                disabled={isLoading}
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    {isRedirecting ? "Entrando..." : "Creando entorno..."}
                                </>
                            ) : (
                                <>
                                    Crear Espacio de Trabajo
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
