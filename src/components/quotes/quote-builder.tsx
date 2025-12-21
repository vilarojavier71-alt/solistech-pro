'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Trash2, Plus, Download, Save, Loader2, FileText, Send } from 'lucide-react'
import { toast } from 'sonner'
import { PDFDownloadLink, pdf } from '@react-pdf/renderer'
import { QuotePDF, QuoteData, QuoteItem } from './quote-pdf'
import { sendQuoteEmail } from '@/lib/actions/notifications'

export function QuoteBuilder() {
    const { data: session } = useSession()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [generatingPDF, setGeneratingPDF] = useState(false)

    // Data Sources - TODO: Load from server actions
    const [leads, setLeads] = useState<any[]>([])
    const [customers, setCustomers] = useState<any[]>([])
    const [orgProfile, setOrgProfile] = useState<any>(null)

    // Form State
    const [targetType, setTargetType] = useState<'lead' | 'customer'>('lead')
    const [selectedId, setSelectedId] = useState<string>('')
    const [quoteNumber, setQuoteNumber] = useState('')
    const [validUntil, setValidUntil] = useState(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])

    // Items
    const [items, setItems] = useState<QuoteItem[]>([
        { description: 'Instalación Fotovoltaica Llave en Mano', quantity: 1, unit_price: 3500, total: 3500 }
    ])

    // Meta
    const [notes, setNotes] = useState('')
    const [terms, setTerms] = useState('Forma de pago: 50% a la aceptación, 50% al finalizar.')

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        if (!session?.user) return

        // TODO: Replace with server actions
        // For now, generate a temp quote number
        setQuoteNumber(`PRE-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`)

        // Mock data - replace with actual server action calls
        setOrgProfile({ name: 'MotorGap', email: '', phone: '' })
        console.log('[QuoteBuilder] TODO: Load leads and customers from server actions')
    }

    // Calculations
    const subtotal = items.reduce((sum, item) => sum + item.total, 0)
    const taxRate = 21
    const taxAmount = subtotal * (taxRate / 100)
    const total = subtotal + taxAmount

    const handleItemChange = (index: number, field: keyof QuoteItem, value: string | number) => {
        const newItems = [...items]
        const item = { ...newItems[index] }

        if (field === 'description') {
            item.description = value as string
        } else {
            const val = parseFloat(value as string) || 0
            if (field === 'quantity') item.quantity = val
            if (field === 'unit_price') item.unit_price = val
            item.total = item.quantity * item.unit_price
        }

        newItems[index] = item
        setItems(newItems)
    }

    const addItem = () => {
        setItems([...items, { description: '', quantity: 1, unit_price: 0, total: 0 }])
    }

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index))
    }

    // Prepare Data for PDF
    const getQuoteData = (): QuoteData => {
        let clientName = 'Cliente General'
        let clientDni = ''

        if (targetType === 'lead') {
            const l = leads.find(x => x.id === selectedId)
            if (l) clientName = l.name
        } else {
            const c = customers.find(x => x.id === selectedId)
            if (c) {
                clientName = c.full_name
                clientDni = c.dni
            }
        }

        return {
            quote_number: quoteNumber,
            created_at: new Date().toLocaleDateString('es-ES'),
            valid_until: new Date(validUntil).toLocaleDateString('es-ES'),
            org_name: orgProfile?.name || 'MotorGap',
            org_email: orgProfile?.email,
            org_phone: orgProfile?.phone,
            customer_name: clientName,
            customer_dni: clientDni,
            line_items: items,
            subtotal,
            tax_rate: taxRate,
            tax_amount: taxAmount,
            total,
            notes,
            terms
        }
    }

    const handleSave = async () => {
        if (!selectedId) {
            toast.error('Selecciona un Lead o Cliente')
            return
        }

        setLoading(true)
        try {
            // TODO: Replace with server action
            console.log('[QuoteBuilder] TODO: Save quote via server action', {
                quoteNumber,
                items,
                subtotal,
                total,
                selectedId,
                targetType
            })

            toast.success('Presupuesto guardado (TODO: implementar server action)')
            router.push('/dashboard/quotes')

        } catch (error: any) {
            console.error(error)
            toast.error('Error al guardar presupuesto')
        } finally {
            setLoading(false)
        }
    }

    const handleSendEmail = async () => {
        if (!selectedId) {
            toast.error('Selecciona un Lead o Cliente')
            return
        }

        setLoading(true)
        try {
            // 1. Generate PDF Blob
            const blob = await pdf(<QuotePDF data={getQuoteData()} />).toBlob()

            // TODO: Upload to storage via server action
            console.log('[QuoteBuilder] TODO: Upload PDF to storage', { quoteNumber, blobSize: blob.size })

            // 2. Get email from selected
            let email = ''
            let name = ''

            if (targetType === 'lead') {
                const l = leads.find(x => x.id === selectedId)
                if (l) { email = l.email; name = l.name }
            } else {
                const c = customers.find(x => x.id === selectedId)
                if (c) { email = c.email; name = c.full_name }
            }

            if (!email) {
                toast.error('El destinatario no tiene email')
                setLoading(false)
                return
            }

            // TODO: Implement storage upload and get URL
            const publicUrl = `https://storage.example.com/${quoteNumber}.pdf` // Placeholder

            await sendQuoteEmail(email, name, quoteNumber, publicUrl, total)

            toast.success(`Presupuesto enviado correctamente a ${email}`)

        } catch (error: any) {
            console.error(error)
            toast.error('Error al enviar email')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="grid gap-6 md:grid-cols-[1fr_350px]">
            {/* Main Form */}
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Datos del Presupuesto</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-4">
                            <div className="w-1/3 space-y-2">
                                <Label>Tipo de Receptor</Label>
                                <Select value={targetType} onValueChange={(v: any) => setTargetType(v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="lead">Lead (Potencial)</SelectItem>
                                        <SelectItem value="customer">Cliente (Cartera)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="w-2/3 space-y-2">
                                <Label>Seleccionar {targetType === 'lead' ? 'Lead' : 'Cliente'}</Label>
                                <Select value={selectedId} onValueChange={setSelectedId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Buscar..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(targetType === 'lead' ? leads : customers).map((item) => (
                                            <SelectItem key={item.id} value={item.id}>
                                                {item.name || item.full_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Número de Presupuesto</Label>
                                <Input value={quoteNumber} onChange={e => setQuoteNumber(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Válido hasta</Label>
                                <Input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Conceptos</CardTitle>
                        <Button size="sm" variant="outline" onClick={addItem}>
                            <Plus className="h-4 w-4 mr-2" /> Añadir Ítem
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {items.map((item, index) => (
                            <div key={index} className="flex gap-2 items-start">
                                <div className="flex-1">
                                    <Input
                                        placeholder="Descripción"
                                        value={item.description}
                                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                    />
                                </div>
                                <div className="w-20">
                                    <Input
                                        type="number"
                                        placeholder="Cant."
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                    />
                                </div>
                                <div className="w-28">
                                    <Input
                                        type="number"
                                        placeholder="Precio"
                                        value={item.unit_price}
                                        onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                                    />
                                </div>
                                <div className="w-28 pt-2 text-right font-medium text-slate-600">
                                    {item.total.toLocaleString()}€
                                </div>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => removeItem(index)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}

                        <div className="flex justify-end pt-4 border-t">
                            <div className="w-64 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Subtotal:</span>
                                    <span>{subtotal.toLocaleString()} €</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>IVA (21%):</span>
                                    <span>{taxAmount.toLocaleString()} €</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg pt-2 border-t text-sky-600">
                                    <span>Total:</span>
                                    <span>{total.toLocaleString()} €</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Notas y Términos</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Notas (Visibles en PDF)</Label>
                            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ej. Instalación sujeta a subvenciones..." />
                        </div>
                        <div className="space-y-2">
                            <Label>Términos y Condiciones</Label>
                            <Textarea value={terms} onChange={e => setTerms(e.target.value)} className="h-24" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Sidebar Actions */}
            <div className="space-y-4">
                <Card className="sticky top-6">
                    <CardHeader>
                        <CardTitle>Acciones</CardTitle>
                        <CardDescription>Generar y guardar</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="p-3 bg-slate-50 rounded-lg border text-center mb-4">
                            <p className="text-xs text-slate-500 mb-1">Total Presupuesto</p>
                            <p className="text-2xl font-bold text-sky-700">{total.toLocaleString()} €</p>
                        </div>

                        <Button className="w-full bg-slate-900 hover:bg-slate-800" onClick={handleSave} disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Guardar Borrador
                        </Button>

                        <PDFDownloadLink document={<QuotePDF data={getQuoteData()} />} fileName={`Presupuesto-${quoteNumber}.pdf`}>
                            {({ blob, url, loading: pdfLoading, error }) => (
                                <Button variant="outline" className="w-full mt-2" disabled={pdfLoading || !selectedId}>
                                    {pdfLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                    {pdfLoading ? "Generando..." : "Descargar PDF"}
                                </Button>
                            )}
                        </PDFDownloadLink>

                        <Button
                            variant="ghost"
                            className="w-full text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                            onClick={handleSendEmail}
                            disabled={loading || !selectedId}
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Enviar por Email
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
