import { Metadata } from 'next'
import { ExcelImporter } from '@/components/import/excel-importer'
import { importStock } from '@/lib/actions/import'

export const metadata: Metadata = {
    title: 'Importar Inventario | MotorGap',
    description: 'Importa tus productos y stock masivamente'
}

const STOCK_FIELDS = [
    { name: 'manufacturer', label: 'Fabricante / Marca', required: false },
    { name: 'model', label: 'Modelo / Nombre', required: true },
    { name: 'type', label: 'Categoría (Panel, Inversor...)', required: false },
    { name: 'price', label: 'Coste Unitario', required: false },
    { name: 'stock_quantity', label: 'Stock Inicial', required: false },
    { name: 'supplier', label: 'Proveedor', required: false },
]

export default function ImportStockPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Importar Inventario</h1>
                <p className="text-muted-foreground">
                    Sube tu listado de productos y stock.
                    El sistema creará nuevos productos o actualizará el stock de los existentes basándose en el "Modelo".
                </p>
            </div>

            <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg text-sm text-orange-800">
                <p className="font-semibold mb-2">Instrucciones:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Modelo / Nombre</strong>: Campo clave para identificar el producto (Requerido).</li>
                    <li><strong>Stock Inicial</strong>: Cantidad actual en almacén.</li>
                    <li><strong>Categoría</strong>: Panel, Inversor, Batería, Estructura...</li>
                    <li>Si el producto ya existe (mismo Modelo), se actualizará su stock.</li>
                </ul>
            </div>

            <ExcelImporter
                fields={STOCK_FIELDS}
                onImport={importStock}
                entityName="producto"
                preserveUnmappedColumns={true}
            />
        </div>
    )
}
