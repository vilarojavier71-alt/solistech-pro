'use client'

import { Button } from '@/components/ui/button'
import { initializeRoles } from '@/lib/actions/team-management'
import { toast } from 'sonner'
import { useState } from 'react'
import { ServerCrash } from 'lucide-react'

export function InitializeRolesButton({ organizationId }: { organizationId: string }) {
    const [loading, setLoading] = useState(false)

    async function handleInit() {
        setLoading(true)
        try {
            const res = await initializeRoles(organizationId)
            if (!res.success) {
                toast.error(res.message)
            } else {
                toast.success('Roles inicializados correctamente')
            }
        } catch (e) {
            toast.error('Error de conexión')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-6 border border-yellow-200 bg-yellow-50 rounded-lg flex flex-col items-center gap-4 text-center">
            <ServerCrash className="w-10 h-10 text-yellow-600" />
            <div>
                <h3 className="text-lg font-medium text-yellow-900">Configuración Incompleta</h3>
                <p className="text-sm text-yellow-700 max-w-md">
                    Tu organización no tiene roles definidos (Admin, Comercial, Instalador).
                    Es necesario inicializarlos para gestionar el equipo.
                </p>
            </div>
            <Button onClick={handleInit} disabled={loading} variant="default" className="bg-yellow-600 hover:bg-yellow-700 text-white">
                {loading ? 'Inicializando...' : 'Inicializar Roles y Permisos'}
            </Button>
        </div>
    )
}
