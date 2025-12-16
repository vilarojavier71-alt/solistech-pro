'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSaleAction, createCustomerAction, getCustomersForSelect, getTeamForSelect } from '@/lib/actions/sales-actions'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserPlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { notifyNewSale } from '@/lib/actions/notifications'

export function NewSaleForm() {
    const router = useRouter()
    // const supabase = createClient()
    const [loading, setLoading] = useState(false)

    // Data Sources
    const [customers, setCustomers] = useState<any[]>([])
    const [team, setTeam] = useState<any[]>([])

    // Form States
    const [mode, setMode] = useState<'existing' | 'new'>('existing')
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')

    // New Customer Fields
    const [newCustomer, setNewCustomer] = useState({
        full_name: '',
        email: '', // Optional for basic parsing
        dni: '',
        phone: '',
        address: ''
    })

    // Sale Fields
    const [saleData, setSaleData] = useState({
        sale_number: `EXP-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
        amount: 0,
        material: '',
        canvasser_id: 'none',
        payment_terms: 'fractioned' // Default
    })

    useEffect(() => {
        const loadData = async () => {
            // Load Customers
            const { data: custData } = await getCustomersForSelect()
            if (custData) setCustomers(custData)

            // Load Team (Canvassers and Commercials)
            const { data: teamData } = await getTeamForSelect(['canvasser', 'commercial'])
            if (teamData) setTeam(teamData)
        }
        loadData()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            let customerId = selectedCustomerId
            let customerName = ''
            let customerDni = ''
            let customerEmail = ''
            let customerPhone = ''

            // 1. Create Customer if new
            if (mode === 'new') {
                if (!newCustomer.full_name || !newCustomer.dni) {
                    toast.error('Nombre y DNI son obligatorios para cliente nuevo')
                    setLoading(false)
                    return
                }

                const result = await createCustomerAction(newCustomer)

                if (!result.success || !result.data) {
                    throw new Error(result.error || 'Error al crear cliente')
                }

                const newCust = result.data
                customerId = newCust.id
                customerName = newCust.full_name
                customerDni = newCust.dni || ''
                customerEmail = newCust.email || ''
                customerPhone = newCust.phone || ''
            } else {
                // Get existing customer details
                const cust = customers.find(c => c.id === selectedCustomerId)
                if (cust) {
                    customerName = cust.full_name || ''
                    customerDni = cust.dni || ''
                    customerEmail = '' // Select fetcher doesn't return email
                    customerPhone = '' // Select fetcher doesn't return phone
                }
            }

            if (!customerId) {
                toast.error('Debes seleccionar un cliente')
                return
            }

            // 2. Create Sale
            const salePayload = {
                customer_id: customerId,
                customer_name: customerName,
                dni: customerDni,
                customer_email: customerEmail,
                customer_phone: customerPhone,
                sale_number: saleData.sale_number,
                amount: saleData.amount,
                material: saleData.material,
                payment_terms: saleData.payment_terms,
                canvasser_id: saleData.canvasser_id,
                documentation_notes: saleData.canvasser_id !== 'none'
                    ? `Captado por: ${team.find(t => t.id === saleData.canvasser_id)?.full_name}`
                    : null
            }

            const { success, error } = await createSaleAction(salePayload)

            if (!success) throw new Error(error)

            // Email sent in server action
            toast.success('Venta creada correctamente')
            router.push('/dashboard/sales')

            toast.success('Venta creada correctamente')
            router.push('/dashboard/sales')

        } catch (error: any) {
            console.error('Error creating sale:', error)
            toast.error(error.message || 'Error al crear la venta')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                {/* 1. SECCIÓN CLIENTE */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5" />
                            Datos del Cliente
                        </CardTitle>
                        <CardDescription>
                            ¿Es un cliente recurrente o uno nuevo?
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                            <Button
                                type="button"
                                variant={mode === 'existing' ? 'default' : 'ghost'}
                                className="w-1/2"
                                onClick={() => setMode('existing')}
                            >
                                Cliente Existente
                            </Button>
                            <Button
                                type="button"
                                variant={mode === 'new' ? 'default' : 'ghost'}
                                className="w-1/2"
                                onClick={() => setMode('new')}
                            >
                                Cliente Nuevo
                            </Button>
                        </div>

                        {mode === 'existing' ? (
                            <div className="space-y-2">
                                <Label>Buscar Cliente</Label>
                                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona un cliente..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {customers.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.full_name} ({c.dni})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Nombre Completo *</Label>
                                        <Input
                                            placeholder="Ej. Juan Pérez"
                                            value={newCustomer.full_name}
                                            onChange={(e) => setNewCustomer({ ...newCustomer, full_name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>DNI / NIE *</Label>
                                        <Input
                                            placeholder="12345678X"
                                            value={newCustomer.dni}
                                            onChange={(e) => setNewCustomer({ ...newCustomer, dni: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Teléfono</Label>
                                    <Input
                                        placeholder="600 000 000"
                                        value={newCustomer.phone}
                                        onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input
                                        type="email"
                                        placeholder="cliente@email.com"
                                        value={newCustomer.email}
                                        onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 2. SECCIÓN VENTA */}
                <Card>
                    <CardHeader>
                        <CardTitle>Detalles de Venta</CardTitle>
                        <CardDescription>Información económica y técnica básica.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Nº Expediente</Label>
                                <Input
                                    value={saleData.sale_number}
                                    onChange={(e) => setSaleData({ ...saleData, sale_number: e.target.value })}
                                    placeholder="EXP-2024-001"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Importe Total (€)</Label>
                                <Input
                                    type="number"
                                    value={saleData.amount}
                                    onChange={(e) => setSaleData({ ...saleData, amount: parseFloat(e.target.value) })}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Modalidad de Pago</Label>
                            <Select
                                value={saleData.payment_terms}
                                onValueChange={(val) => setSaleData({ ...saleData, payment_terms: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar modalidad..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="fractioned">Fraccionado (20% - 60% - 20%)</SelectItem>
                                    <SelectItem value="cash">Al Contado (100%)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Material / Descripción Sistema</Label>
                            <Textarea
                                placeholder="Ej. 10 Paneles Jinko 440W + Inversor Huawei 5K..."
                                className="h-24"
                                value={saleData.material}
                                onChange={(e) => setSaleData({ ...saleData, material: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-pink-600 font-medium">Captador / Pica (Opcional)</Label>
                            <Select
                                value={saleData.canvasser_id}
                                onValueChange={(val) => setSaleData({ ...saleData, canvasser_id: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar captador..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">-- Ninguno --</SelectItem>
                                    {team.map((t) => (
                                        <SelectItem key={t.id} value={t.id}>
                                            {t.full_name} ({t.role === 'canvasser' ? 'Pica' : 'Comercial'})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end gap-4">
                <Button type="button" variant="ghost" onClick={() => router.back()}>Cancelar</Button>
                <Button type="submit" className="bg-sky-600 hover:bg-sky-700 min-w-[150px]" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Crear Venta
                </Button>
            </div>
        </form>
    )
}
