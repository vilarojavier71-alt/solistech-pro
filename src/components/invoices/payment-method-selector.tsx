'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Plus, Info } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { createPaymentMethod, getPaymentMethods, PaymentMethod } from '@/lib/actions/payments'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

interface SmartPaymentSelectorProps {
    value: string
    onValueChange: (value: string) => void
    onMethodSelected?: (method: PaymentMethod) => void
    disabled?: boolean
}

export function SmartPaymentSelector({
    value,
    onValueChange,
    onMethodSelected,
    disabled
}: SmartPaymentSelectorProps) {
    const [open, setOpen] = React.useState(false)
    const [dialogOpen, setDialogOpen] = React.useState(false)

    // Data state
    const [methods, setMethods] = React.useState<PaymentMethod[]>([])
    const [searchTerm, setSearchTerm] = React.useState('')
    const [loading, setLoading] = React.useState(false)

    // Creation form state
    const [newMethodName, setNewMethodName] = React.useState('')
    const [newMethodInstructions, setNewMethodInstructions] = React.useState('')

    // Load initial data
    React.useEffect(() => {
        const loadMethods = async () => {
            const data = await getPaymentMethods()
            setMethods(data)
        }
        loadMethods()
    }, [])

    const handleSelect = (method: PaymentMethod) => {
        onValueChange(method.id)
        if (onMethodSelected) {
            onMethodSelected(method)
        }
        setOpen(false)
    }

    const openCreateDialog = () => {
        setNewMethodName(searchTerm)
        setDialogOpen(true)
        setOpen(false) // Close popover
    }

    const handleCreateMethod = async () => {
        if (!newMethodName.trim()) return

        try {
            setLoading(true)
            const { data, error } = await createPaymentMethod({
                name: newMethodName.trim(),
                instructions: newMethodInstructions.trim() || undefined
            })

            if (error || !data) {
                toast.error('Error al crear método de pago')
                return
            }

            // Optimistic update
            const createdMethod = data as PaymentMethod
            setMethods((prev) => [...prev, createdMethod])

            // Auto Select
            onValueChange(createdMethod.id)
            if (onMethodSelected) onMethodSelected(createdMethod)

            setDialogOpen(false)
            setSearchTerm('')
            setNewMethodName('')
            setNewMethodInstructions('')
            toast.success(`Método "${createdMethod.name}" creado correctamente`)
        } catch (e) {
            toast.error('Error inesperado')
        } finally {
            setLoading(false)
        }
    }

    const selectedMethod = methods.find((m) => m.id === value)

    return (
        <>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between h-auto py-3"
                        disabled={disabled}
                    >
                        <div className="flex flex-col items-start gap-1 text-left">
                            <span className="font-medium">
                                {selectedMethod ? selectedMethod.name : "Seleccionar método..."}
                            </span>
                            {selectedMethod?.instructions && (
                                <span className="text-xs text-muted-foreground line-clamp-1">
                                    {selectedMethod.instructions}
                                </span>
                            )}
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                    <Command shouldFilter={false}>
                        <CommandInput
                            placeholder="Buscar o crear método..."
                            value={searchTerm}
                            onValueChange={setSearchTerm}
                        />
                        <CommandList>
                            <CommandEmpty className="py-2 px-2 text-center text-sm">
                                {searchTerm && (
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start text-primary h-auto py-2"
                                        onClick={openCreateDialog}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="bg-primary/10 p-1 rounded-full">
                                                <Plus className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="flex flex-col items-start">
                                                <span>Crear "{searchTerm}"</span>
                                                <span className="text-xs text-muted-foreground">Clic para configurar instrucciones</span>
                                            </div>
                                        </div>
                                    </Button>
                                )}
                                {!searchTerm && "Escribe para buscar o crear."}
                            </CommandEmpty>
                            <CommandGroup>
                                {methods
                                    .filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                    .map((method) => (
                                        <CommandItem
                                            key={method.id}
                                            value={method.id}
                                            keywords={[method.name]}
                                            onSelect={() => handleSelect(method)}
                                            className="cursor-pointer"
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    value === method.id ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            <div className="flex flex-col">
                                                <span>{method.name}</span>
                                                {method.is_default && (
                                                    <Badge variant="secondary" className="w-fit text-[10px] px-1 h-4">Default</Badge>
                                                )}
                                            </div>
                                        </CommandItem>
                                    ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {/* Create Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Crear Método de Pago</DialogTitle>
                        <DialogDescription>
                            Configura los detalles para "{newMethodName}".
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre del Método</Label>
                            <Input
                                id="name"
                                value={newMethodName}
                                onChange={(e) => setNewMethodName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="instructions">Instrucciones de Pago (Opcional)</Label>
                            <Textarea
                                id="instructions"
                                placeholder="Ej: IBAN ES21... o Número de Teléfono para Bizum"
                                value={newMethodInstructions}
                                onChange={(e) => setNewMethodInstructions(e.target.value)}
                                rows={3}
                            />
                            <p className="text-xs text-muted-foreground">
                                <Info className="inline h-3 w-3 mr-1" />
                                Esto se añadirá automáticamente a las notas de la factura cuando se seleccione este método.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreateMethod} disabled={loading}>
                            {loading ? "Guardando..." : "Guardar Método"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
