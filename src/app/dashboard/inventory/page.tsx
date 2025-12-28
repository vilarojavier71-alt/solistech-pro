
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Package, Truck, History, Plus, Minus, AlertTriangle, Search } from 'lucide-react'
import { toast } from 'sonner'
import { updateStock, getInventoryItems, getSuppliers, getRecentMovements } from '@/lib/actions/inventory'
import { formatCurrency } from '@/lib/utils'

export default function InventoryPage() {
    const [components, setComponents] = useState<any[]>([])
    const [suppliers, setSuppliers] = useState<any[]>([])
    const [movements, setMovements] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Modal States
    const [stockModal, setStockModal] = useState<{ open: boolean, type: 'in' | 'out', item: any | null }>({ open: false, type: 'in', item: null })
    const [qty, setQty] = useState(1)
    const [reason, setReason] = useState('')

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const [itemsData, suppliersData, movementsData] = await Promise.all([
                getInventoryItems(),
                getSuppliers(),
                getRecentMovements()
            ])
            setComponents(itemsData)
            setSuppliers(suppliersData)
            setMovements(movementsData)
        } catch (error) {
            toast.error('Error cargando inventario')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateStock = async () => {
        if (!stockModal.item) return

        try {
            const res = await updateStock(stockModal.item.id, stockModal.type, qty, reason)
            if (res.success) {
                toast.success('Movimiento registrado')
                setStockModal(prev => ({ ...prev, open: false }))
                loadData() // Reload to show new stock
            } else {
                toast.error(res.message)
            }
        } catch (error) {
            toast.error('Error al actualizar stock')
        }
    }

    if (loading) return <div className="p-8 text-center text-muted-foreground">Cargando inventario...</div>

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Inventario & Logística</h1>
                    <p className="text-muted-foreground">Control de stock, aprovisionamiento y almacén (Dinámico)</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Artículo
                </Button>
            </div>

            <Tabs defaultValue="stock" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="stock"><Package className="mr-2 h-4 w-4" /> Stock Actual</TabsTrigger>
                    <TabsTrigger value="suppliers"><Truck className="mr-2 h-4 w-4" /> Proveedores</TabsTrigger>
                    <TabsTrigger value="movements"><History className="mr-2 h-4 w-4" /> Movimientos</TabsTrigger>
                </TabsList>

                <TabsContent value="stock" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Artículos en Almacén</CardTitle>
                            <div className="flex gap-2">
                                <Input placeholder="Buscar por modelo..." className="max-w-sm" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Desc.</TableHead>
                                        <TableHead>Proveedor</TableHead>
                                        <TableHead className="text-right">Stock</TableHead>
                                        <TableHead className="text-right">Coste</TableHead>
                                        <TableHead className="text-right">Valor</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {components.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8">No hay artículos registrados</TableCell>
                                        </TableRow>
                                    ) : (
                                        components.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="capitalize badge bg-muted rounded-md px-2 py-1 text-xs">{item.type}</TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{item.manufacturer}</div>
                                                    <div className="text-sm text-slate-500">{item.model}</div>
                                                </TableCell>
                                                <TableCell>{item.supplier?.name || '-'}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {(item.stock_quantity || 0) <= (item.min_stock_alert || 5) && (
                                                            <AlertTriangle className="h-4 w-4 text-red-500" />
                                                        )}
                                                        <span className={`font-bold ${(item.stock_quantity || 0) <= (item.min_stock_alert || 5) ? 'text-red-600' : 'text-green-600'}`}>
                                                            {item.stock_quantity || 0}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">{formatCurrency(item.cost_price)}</TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatCurrency((item.stock_quantity || 0) * (item.cost_price || 0))}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            size="sm" variant="outline"
                                                            onClick={() => { setStockModal({ open: true, type: 'in', item }); setQty(1); setReason('') }}
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            size="sm" variant="outline"
                                                            onClick={() => { setStockModal({ open: true, type: 'out', item }); setQty(1); setReason('') }}
                                                        >
                                                            <Minus className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="suppliers">
                    <Card>
                        <CardHeader>
                            <CardTitle>Directorio de Proveedores</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nombre</TableHead>
                                        <TableHead>Contacto</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Teléfono</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {suppliers.length === 0 ? (
                                        <TableRow><TableCell colSpan={4} className="text-center">No hay proveedores</TableCell></TableRow>
                                    ) : (
                                        suppliers.map((s) => (
                                            <TableRow key={s.id}>
                                                <TableCell className="font-medium">{s.name}</TableCell>
                                                <TableCell>{s.contact_name || '-'}</TableCell>
                                                <TableCell>{s.email || '-'}</TableCell>
                                                <TableCell>{s.phone || '-'}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="movements">
                    <Card>
                        <CardHeader><CardTitle>Historial de Movimientos</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Material</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Cant.</TableHead>
                                        <TableHead>Motivo</TableHead>
                                        <TableHead>Usuario</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {movements.length === 0 ? (
                                        <TableRow><TableCell colSpan={6} className="text-center">No hay movimientos</TableCell></TableRow>
                                    ) : (
                                        movements.map((m) => (
                                            <TableRow key={m.id}>
                                                <TableCell>{new Date(m.date).toLocaleDateString()} {new Date(m.date).toLocaleTimeString()}</TableCell>
                                                <TableCell>{m.item_name}</TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${m.type === 'in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {m.type === 'in' ? 'ENTRADA' : 'SALIDA'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="font-bold">{m.quantity}</TableCell>
                                                <TableCell>{m.reason}</TableCell>
                                                <TableCell className="text-xs text-slate-500">{m.user_name}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Stock Movement Dialog */}
            <Dialog open={stockModal.open} onOpenChange={(v) => setStockModal(prev => ({ ...prev, open: v }))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {stockModal.type === 'in' ? 'Añadir Stock (Entrada)' : 'Retirar Stock (Salida)'}
                        </DialogTitle>
                        <CardDescription>{stockModal.item?.manufacturer} {stockModal.item?.model}</CardDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Cantidad</Label>
                            <Input type="number" min="1" value={qty} onChange={e => setQty(parseInt(e.target.value))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Motivo / Referencia</Label>
                            <Input
                                placeholder={stockModal.type === 'in' ? 'Nº Albarán / Factura' : 'Nº Proyecto / Merma'}
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                            />
                        </div>
                        <Button className="w-full" onClick={handleUpdateStock}>Confirmar Movimiento</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
