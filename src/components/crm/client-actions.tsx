'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Upload } from 'lucide-react'
import { ClientEditSheet } from '@/components/customers/client-edit-sheet'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export function ClientActions() {
    const [open, setOpen] = useState(false)
    const router = useRouter()

    return (
        <div className="flex gap-2">
            <Link href="/dashboard/import">
                <Button
                    variant="outline"
                    className="gap-2"
                >
                    <Upload className="h-4 w-4" />
                    Importar
                </Button>
            </Link>

            <Button
                onClick={() => setOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
                <Plus className="h-4 w-4" />
                Nuevo Cliente
            </Button>

            <ClientEditSheet
                open={open}
                onOpenChange={setOpen}
                onSuccess={(newClient) => {
                    setOpen(false)
                    router.refresh()
                }}
            />
        </div>
    )
}
