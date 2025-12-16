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
import { deactivateSystemUser } from '@/lib/actions/admin-users'
import { Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface DeactivateUserDialogProps {
    userId: string
    userName: string
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function DeactivateUserDialog({ userId, userName, open, onOpenChange }: DeactivateUserDialogProps) {
    const [isLoading, setIsLoading] = useState(false)

    async function handleDeactivate() {
        setIsLoading(true)
        const result = await deactivateSystemUser(userId)
        setIsLoading(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Usuario desactivado correctamente')
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        Desactivar cuenta
                    </DialogTitle>
                    <DialogDescription>
                        ¿Estás seguro que deseas desactivar la cuenta de <strong>{userName}</strong>?
                        El usuario perderá el acceso al sistema inmediatamente.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button variant="destructive" onClick={handleDeactivate} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Desactivar cuenta
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
