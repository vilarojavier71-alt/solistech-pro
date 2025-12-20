'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Save, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { GlowCard } from '@/components/ui/glow-card'
import { PageShell } from '@/components/ui/page-shell'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
    getPaymentMethods,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    PaymentMethod
} from '@/lib/actions/payment-settings'

export default function PaymentSettingsPage() {
    const [methods, setMethods] = useState<PaymentMethod[]>([])
    const [loading, setLoading] = useState(true)

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null)
    const [formData, setFormData] = useState({ name: '', instructions: '', is_default: false })
    const [saving, setSaving] = useState(false)

    // Delete State
    const [deleteId, setDeleteId] = useState<string | null>(null)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        const data = await getPaymentMethods()
        setMethods(data)
        setLoading(false)
    }

    const handleOpenCreate = () => {
        setEditingMethod(null)
        setFormData({ name: '', instructions: '', is_default: false })
        setIsDialogOpen(true)
    }

    const handleOpenEdit = (method: PaymentMethod) => {
        setEditingMethod(method)
        setFormData({
            name: method.name,
            instructions: method.instructions || '',
            is_default: method.is_default
        })
        setIsDialogOpen(true)
    }

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error("El nombre es obligatorio")
            return
        }

        setSaving(true)
        try {
            if (editingMethod) {
                // Update
                const { data, error } = await updatePaymentMethod(editingMethod.id, formData)
                if (error) throw new Error(error)

                toast.success("Método actualizado")
                // Optimistic Update
                setMethods(methods.map(m => m.id === editingMethod.id ? { ...m, ...data } : m))
            } else {
                // Create
                const { data, error } = await createPaymentMethod(formData)
                if (error) throw new Error(error)

                toast.success("Método creado")
                setMethods([...methods, data as PaymentMethod])
            }
            setIsDialogOpen(false)
        } catch (error: any) {
            toast.error(error.message || "Error al guardar")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteId) return

        try {
            const { error } = await deletePaymentMethod(deleteId)
            if (error) throw new Error(error)

            toast.success("Método eliminado")
            setMethods(methods.filter(m => m.id !== deleteId))
            setDeleteId(null)
        } catch (error: any) {
            toast.error(error.message || "Error al eliminar")
        }
    }

    return (
        <PageShell title="Métodos de Pago" description="Gestiona las opciones de cobro para tus facturas.">
            <div className="flex justify-end mb-6">
                <Button onClick={handleOpenCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Método
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                    <p>Cargando...</p>
                ) : methods.map(method => (
                    <GlowCard key={method.id} className="flex flex-col h-full">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg">{method.name}</h3>
                                {method.is_default && (
                                    <Badge variant="secondary" className="mt-1">Por defecto</Badge>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(method)}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(method.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 bg-muted/50 p-3 rounded-md text-sm text-muted-foreground whitespace-pre-wrap font-mono">
                            {method.instructions || "(Sin instrucciones adicionales)"}
                        </div>
                    </GlowCard>
                ))}
            </div>

            {/* Dialog Create/Edit */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingMethod ? "Editar Método" : "Crear Método"}</DialogTitle>
                        <DialogDescription>
                            Configura los detalles que se mostrarán en la factura.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nombre</Label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ej: Bizum, Transferencia..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Instrucciones de Pago</Label>
                            <Textarea
                                value={formData.instructions}
                                onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                                placeholder="Ej: IBAN: ES21..., Teléfono: 600..."
                                rows={4}
                            />
                            <p className="text-xs text-muted-foreground">
                                <Info className="h-3 w-3 inline mr-1" />
                                Estas instrucciones se añadirán automáticamente a las notas de la factura.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? "Guardando..." : "Guardar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog Delete Confirmation */}
            <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>¿Eliminar método?</DialogTitle>
                        <DialogDescription>
                            Esta acción no se puede deshacer. (Soft delete: no afectará a facturas antiguas)
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleDelete}>Confirmar Eliminación</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </PageShell>
    )
}
