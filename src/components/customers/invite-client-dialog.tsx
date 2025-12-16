'use client'

import { useState } from 'react'
import { generateClientInvitation } from '@/lib/actions/invitations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Copy, Plus, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'

export function InviteClientDialog() {
    const { data: session } = useSession()
    const [token, setToken] = useState<string | null>(null)
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [hasCopied, setHasCopied] = useState(false)

    const handleGenerate = async () => {
        if (!session?.user?.id) return // Should not happen

        setIsLoading(true)
        setToken(null)
        setHasCopied(false)

        try {
            // Retrieve Org ID from session preferably, or let Server Action resolve it from context if possible.
            // But Action needs explicit ID usually if we want to be safe, or uses session.organizationId
            // The action I wrote expects organizationId. 
            // Ideally we get it from session.user.organizationId (need to check if it's there).
            // Fallback: The action actually calls getCurrentUserWithRole which HAS org ID. 
            // So we can arguably simplify the action to just take NO args and use session's org.
            // BUT, let's pass it if available.
            const orgId = (session.user as any).organization_id || (session.user as any).organizationId

            if (!orgId) {
                toast.error('Error de sesión: No se encontró ID de organización')
                return
            }

            const result = await generateClientInvitation(orgId)

            if (result.error) {
                toast.error(result.error)
            } else if (result.token) {
                setToken(result.token)
                toast.success('Código generado correctamente')
            }
        } catch (error) {
            toast.error('Error al conectar con el servidor')
        } finally {
            setIsLoading(false)
        }
    }

    const copyToClipboard = () => {
        if (!token) return
        navigator.clipboard.writeText(token)
        setHasCopied(true)
        toast.success('Copiado al portapapeles')
        setTimeout(() => setHasCopied(false), 2000)
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Cliente
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Invitar Nuevo Cliente</DialogTitle>
                    <DialogDescription>
                        Genera un código único para que el cliente se registre. Este código vinculará su cuenta a esta organización automáticamente.
                    </DialogDescription>
                </DialogHeader>

                {!token ? (
                    <div className="flex justify-center py-6">
                        <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
                            {isLoading ? 'Generando...' : 'Generar Código de Invitación'}
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center space-x-2 py-4">
                        <div className="grid flex-1 gap-2">
                            <Input
                                id="link"
                                defaultValue={token}
                                readOnly
                                className="font-mono text-center text-lg tracking-widest font-bold bg-muted"
                            />
                        </div>
                        <Button type="submit" size="sm" className="px-3" onClick={copyToClipboard}>
                            {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            <span className="sr-only">Copiar</span>
                        </Button>
                    </div>
                )}

                <DialogFooter className="sm:justify-start">
                    <p className="text-[0.8rem] text-muted-foreground w-full text-center">
                        El código expira en 7 días. Envíalo al cliente por WhatsApp o Email.
                    </p>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
