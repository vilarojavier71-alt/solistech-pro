'use client'

import { useState, useTransition } from 'react'
import { MapPin, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { enrichProjectWithCadastre } from '@/lib/actions/projects'
import { toast } from 'sonner'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface CadastralLocatorProps {
    projectId: string
    lat: number
    lng: number
    onSuccess?: (data: any) => void
    disabled?: boolean
}

export function CadastralLocator({ projectId, lat, lng, onSuccess, disabled }: CadastralLocatorProps) {
    const [isPending, startTransition] = useTransition()
    const [foundRef, setFoundRef] = useState<string | null>(null)

    const handleSearch = () => {
        if (!lat || !lng) {
            toast.error("Se requieren coordenadas válidas")
            return
        }

        startTransition(async () => {
            const result = await enrichProjectWithCadastre(projectId, lat, lng)

            if (result.error) {
                toast.error(result.error)
            } else if (result.data) {
                setFoundRef(result.data.reference)
                toast.success(`Referencia encontrada: ${result.data.reference}`)
                if (onSuccess) onSuccess(result.data)
            }
        })
    }

    if (foundRef) {
        return (
            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                <CheckCircle className="h-4 w-4" />
                <span>RC: {foundRef}</span>
            </div>
        )
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSearch}
                        disabled={disabled || isPending}
                        className="gap-2"
                        type="button"
                    >
                        {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <MapPin className="h-4 w-4 text-blue-500" />
                        )}
                        Buscar Catastro
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Buscar referencia catastral automáticamente por coordenadas</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
