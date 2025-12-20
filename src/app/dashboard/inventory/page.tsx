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
import { updateStock, createSupplier, createComponent } from '@/lib/actions/inventory'

export default function InventoryPage() {
    // STUB: components/suppliers/stock_movements tables don't exist in Prisma
    const [components, setComponents] = useState<any[]>([])
    const [suppliers, setSuppliers] = useState<any[]>([])
    const [movements, setMovements] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    // Modal States
    const [stockModal, setStockModal] = useState<{ open: boolean, type: 'in' | 'out', item: any | null }>({ open: false, type: 'in', item: null })
    const [qty, setQty] = useState(1)
    const [reason, setReason] = useState('')

    // Stubs - no data fetching
    const loadData = async () => {
        // TODO: Implement when inventory tables exist in Prisma
    }

    const handleUpdateStock = async () => {
        toast.error('Inventario no disponible - tablas pendientes de migración')
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Inventario & Logística</h1>
                    <p className="text-muted-foreground">Control de stock, aprovisionamiento y almacén</p>
                </div>
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
                                {/* New Item Button logic would go here */}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Fabricante / Modelo</TableHead>
                                        <TableHead>Proveedor</TableHead>
                                        <TableHead className="text-right">Stock</TableHead>
                                        <TableHead className="text-right">Coste</TableHead>
                                        <TableHead className="text-right">Valor Total</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {components.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="capitalize">{item.type}</TableCell>
                                            <TableCell>
                                                <div className="font-medium">{item.manufacturer}</div>
                                                <div className="text-sm text-slate-500">{item.model}</div>
                                            </TableCell>
                                            <TableCell>{item.suppliers?.name || '-'}</TableCell>
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
                                            <TableCell className="text-right">{item.cost_price || 0} €</TableCell>
                                            <TableCell className="text-right font-medium">
                                                {((item.stock_quantity || 0) * (item.cost_price || 0)).toLocaleString()} €
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
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="suppliers">
                    <Card>
                        <CardHeader>
                            <CardTitle>Directorio de Proveedores</CardTitle>
                            {/* Create Supplier Dialog logic here */}
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
                                    {suppliers.map((s) => (
                                        <TableRow key={s.id}>
                                            <TableCell className="font-medium">{s.name}</TableCell>
                                            <TableCell>{s.contact_name}</TableCell>
                                            <TableCell>{s.email}</TableCell>
                                            <TableCell>{s.phone}</TableCell>
                                        </TableRow>
                                    ))}
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
                                    {movements.map((m) => (
                                        <TableRow key={m.id}>
                                            <TableCell>{new Date(m.created_at).toLocaleDateString()} {new Date(m.created_at).toLocaleTimeString()}</TableCell>
                                            <TableCell>{m.components?.manufacturer} {m.components?.model}</TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${m.type === 'in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {m.type === 'in' ? 'ENTRADA' : 'SALIDA'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="font-bold">{m.quantity}</TableCell>
                                            <TableCell>{m.reason}</TableCell>
                                            <TableCell className="text-xs text-slate-500">{m.users?.full_name}</TableCell>
                                        </TableRow>
                                    ))}
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
