'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { resetUserPassword } from '@/lib/actions/admin-users'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ResetPasswordDialogProps {
    userId: string
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ResetPasswordDialog({ userId, open, onOpenChange }: ResetPasswordDialogProps) {
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        formData.append('userId', userId)

        const result = await resetUserPassword(null, formData)
        setIsLoading(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Contraseña restablecida correctamente')
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Cambiar Contraseña</DialogTitle>
                    <DialogDescription>
                        Establece una nueva contraseña para este usuario.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="password" className="text-right">
                                Nueva
                            </Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                className="col-span-3"
                                minLength={6}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar contraseña
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
