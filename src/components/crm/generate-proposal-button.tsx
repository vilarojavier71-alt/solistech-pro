'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createPresentation } from '@/lib/actions/presentation-generator' // Ensure this path is correct

export function GenerateProposalButton({ opportunityId, customerId }: { opportunityId: string, customerId: string }) {
    const [loading, setLoading] = useState(false)

    const handleGenerate = async () => {
        setLoading(true)
        try {
            // NOTE: Currently createPresentation requires calculationId and projectId.
            // Since we are in CRM context, we might not have them yet.
            // For now, we will simulate or handle the error gracefully.
            // In a real scenario, we would check if this opportunity is linked to a project/calculation.

            // Temporary: Notify user that calculation is needed
            // OR attempt to call it with dummy IDs if allowed (unlikely)

            toast.info('Para generar una propuesta técnica, primero debes crear un Estudio Solar.', {
                action: {
                    label: 'Crear Estudio',
                    onClick: () => console.log('Redirect to study creation')
                }
            })

            // Uncomment when linked properly:
            /*
            const res = await createPresentation(customerId, projectId, calculationId)
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success('Presentación generada exitosamente!')
            }
            */
        } catch (error) {
            toast.error('Error al iniciar generación')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button onClick={handleGenerate} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
            Generar Propuesta PPTX
        </Button>
    )
}
