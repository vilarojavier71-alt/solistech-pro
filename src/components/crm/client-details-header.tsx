'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'
import { ClientEditSheet } from '@/components/customers/client-edit-sheet'
import { useRouter } from 'next/navigation'

export function ClientDetailsHeader({ client }: { client: any }) {
    const [open, setOpen] = useState(false)
    const router = useRouter()

    return (
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">{client.name || client.full_name}</h2>
                <p className="text-zinc-400">{client.company || 'Cliente Particular'}</p>
            </div>

            <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:text-white" onClick={() => setOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar Cliente
            </Button>

            <ClientEditSheet
                client={client}
                open={open}
                onOpenChange={setOpen}
                onSuccess={(updated) => {
                    setOpen(false)
                    router.refresh()
                }}
            />
        </div>
    )
}
