'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Crown, Users, Check, Loader2 } from 'lucide-react'
import { createProUpgradeCheckout } from '@/lib/actions/subscriptions'
import { toast } from 'sonner'

interface UpgradePromptProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    currentEmployees: number
}

export function UpgradePrompt({ open, onOpenChange, currentEmployees }: UpgradePromptProps) {
    const [loading, setLoading] = useState(false)

    const handleUpgrade = async () => {
        setLoading(true)
        try {
            const result = await createProUpgradeCheckout()
            if (result.url) {
                window.location.href = result.url
            } else {
                toast.error(result.error || 'Error al crear la sesión de pago')
                setLoading(false)
            }
        } catch (error) {
            toast.error('Error al procesar la solicitud')
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="text-center">
                    <div className="mx-auto mb-4 p-3 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 w-fit">
                        <Crown className="h-8 w-8 text-white" />
                    </div>
                    <DialogTitle className="text-2xl">
                        Actualiza a Plan Pro
                    </DialogTitle>
                    <DialogDescription className="text-base">
                        Tu plan básico no incluye empleados. Actualiza a Pro para añadir miembros a tu equipo.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 space-y-4">
                    {/* Price */}
                    <div className="text-center">
                        <span className="text-4xl font-bold">€150</span>
                        <span className="text-muted-foreground">/mes</span>
                    </div>

                    {/* Features */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="p-1 rounded-full bg-emerald-100 dark:bg-emerald-900">
                                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <span className="text-sm">Empleados ilimitados</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-1 rounded-full bg-emerald-100 dark:bg-emerald-900">
                                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <span className="text-sm">Control de tiempo del equipo</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-1 rounded-full bg-emerald-100 dark:bg-emerald-900">
                                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <span className="text-sm">Roles y permisos avanzados</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-1 rounded-full bg-emerald-100 dark:bg-emerald-900">
                                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <span className="text-sm">Soporte prioritario</span>
                        </div>
                    </div>

                    {/* Current status */}
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>
                                Actualmente tienes <strong className="text-foreground">{currentEmployees}</strong> empleado(s) pendientes
                            </span>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                        className="sm:flex-1"
                    >
                        Ahora no
                    </Button>
                    <Button
                        onClick={handleUpgrade}
                        disabled={loading}
                        className="sm:flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Procesando...
                            </>
                        ) : (
                            <>
                                <Crown className="mr-2 h-4 w-4" />
                                Actualizar Ahora
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
