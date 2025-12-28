
'use client'

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import { useState } from "react"
import { createQuote } from "@/lib/actions/quotes"
import { toast } from "sonner" // Fixed import
import { useRouter } from "next/navigation"

export function CreateQuoteDialog() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    // const { toast } = useToast() // Removed hook
    const router = useRouter()

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)
        const formData = new FormData(event.currentTarget)

        try {
            const quote = await createQuote(formData)
            toast.success("Presupuesto creado", {
                description: `Se ha generado el presupuesto ${quote.quote_number}`
            })
            setOpen(false)
            router.push(`/dashboard/quotes/${quote.id}`) // Redirect to editor
        } catch (error) {
            toast.error("Error", {
                description: "No se pudo crear el presupuesto."
            })
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg">
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Presupuesto
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Nuevo Presupuesto</DialogTitle>
                    <DialogDescription>
                        Inicia un nuevo propuesto comercial.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="title" className="text-right">
                                Título
                            </Label>
                            <Input id="title" name="title" placeholder="Ej. Instalación Residencial 5kW" className="col-span-3" required />
                        </div>
                        {/* TODO: Add Customer Selector here (Combobox) mapped to crm_account_id */}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Creando..." : "Crear y Editar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
