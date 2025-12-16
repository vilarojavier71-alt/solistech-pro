'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"
import { AdvancedMemberWizard } from "./advanced-member-wizard"
import { createAdvancedTeamMember } from "@/lib/actions/advanced-user-management"
import { toast } from "sonner"
// Import type from schema if needed, but inferred is fine
import type { AdvancedUserFormValues } from "@/lib/schemas/user-management"

interface AdvancedMemberModalProps {
    roles: { id: string; name: string }[]
    organizationId: string // Keep for compatibility/context if needed
    // In future we might pass workZones from server here
}

export function AdvancedMemberModal({ roles }: AdvancedMemberModalProps) {
    const [open, setOpen] = useState(false)

    // Mock Work Zones for now (In real app, fetch or pass as prop)
    const workZones = [
        { id: "1", name: "Zona Norte" },
        { id: "2", name: "Zona Centro/Madrid" },
        { id: "3", name: "Zona Sur/Andalucía" },
        { id: "4", name: "Levante" },
    ]

    const handleComplete = async (data: AdvancedUserFormValues) => {
        const result = await createAdvancedTeamMember(data)
        if (result.success) {
            setOpen(false)
            toast.success("Usuario avanzado creado correctamente", {
                description: `Credenciales temporales enviadas a ${data.step1.email}`
            })
        } else {
            toast.error("Error al crear usuario", {
                description: result.error
            })
            throw new Error(result.error) // Re-throw to stop Wizard spinner
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/20">
                    <UserPlus className="w-4 h-4" />
                    Nuevo Miembro (Avanzado)
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl p-0 border-0 bg-transparent shadow-none sm:max-w-4xl">
                <AdvancedMemberWizard
                    roles={roles}
                    workZones={workZones}
                    onComplete={handleComplete}
                    onCancel={() => setOpen(false)}
                />
            </DialogContent>
        </Dialog>
    )
}
