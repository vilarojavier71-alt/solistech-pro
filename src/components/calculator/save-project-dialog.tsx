'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Check, ChevronsUpDown, Loader2, Save } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { createProjectFromCalculation } from '@/lib/actions/calculator'
import { useRouter } from 'next/navigation'

interface Customer {
    id: string
    name: string
    company?: string | null
}

interface SaveProjectDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    calculationData: any
    customers: Customer[]
}

export function SaveProjectDialog({
    open,
    onOpenChange,
    calculationData,
    customers = []
}: SaveProjectDialogProps) {
    const [loading, setLoading] = useState(false)
    const [customerId, setCustomerId] = useState('')
    const [projectName, setProjectName] = useState(`Instalación Solar ${new Date().toLocaleDateString('es-ES')}`)
    const [openCombobox, setOpenCombobox] = useState(false)
    const router = useRouter()

    const handleSave = async () => {
        if (!customerId) {
            toast.error('Debes seleccionar un cliente')
            return
        }
        if (!projectName.trim()) {
            toast.error('El nombre del proyecto es obligatorio')
            return
        }

        setLoading(true)
        try {
            const result = await createProjectFromCalculation(
                calculationData,
                customerId,
                projectName
            )

            if (result.success) {
                toast.success('Proyecto creado correctamente')
                onOpenChange(false)
                router.push(`/dashboard/projects`)
            } else {
                toast.error(result.error || 'Error al guardar el proyecto')
            }
        } catch (error) {
            console.error('Error saving project:', error)
            toast.error('Error inesperado al guardar')
        } finally {
            setLoading(false)
        }
    }

    // Sort customers alphabetically
    const sortedCustomers = [...customers].sort((a, b) => a.name.localeCompare(b.name))

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Guardar como Proyecto</DialogTitle>
                    <DialogDescription>
                        Convierte este cálculo en un proyecto real vinculado a un cliente.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="project-name">Nombre del Proyecto</Label>
                        <Input
                            id="project-name"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            placeholder="Ej: Instalación Solar Residencial"
                        />
                    </div>

                    <div className="space-y-2 flex flex-col">
                        <Label>Cliente</Label>
                        <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openCombobox}
                                    className="w-full justify-between"
                                >
                                    {customerId
                                        ? sortedCustomers.find((customer) => customer.id === customerId)?.name
                                        : "Selecciona un cliente..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0">
                                <Command>
                                    <CommandInput placeholder="Buscar cliente..." />
                                    <CommandList>
                                        <CommandEmpty>No se encontraron clientes.</CommandEmpty>
                                        <CommandGroup>
                                            {sortedCustomers.map((customer) => (
                                                <CommandItem
                                                    key={customer.id}
                                                    value={customer.name}
                                                    onSelect={(currentValue) => {
                                                        const found = sortedCustomers.find(c => c.name.toLowerCase() === currentValue.toLowerCase() || c.name === currentValue)
                                                        if (found) {
                                                            setCustomerId(found.id)
                                                            setOpenCombobox(false)
                                                        }
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            customerId === customer.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    <div className="flex flex-col">
                                                        <span>{customer.name}</span>
                                                        {customer.company && (
                                                            <span className="text-xs text-muted-foreground">{customer.company}</span>
                                                        )}
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        <p className="text-xs text-muted-foreground">
                            El proyecto se vinculará a este cliente.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Guardar Proyecto
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
