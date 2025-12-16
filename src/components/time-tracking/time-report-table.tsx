'use client'

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Download, MapPin, AlertCircle, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"


export function TimeReportTable({ entries, currentMonth }: { entries: any[], currentMonth: string }) {
    const router = useRouter()

    const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        router.push(`/dashboard/time-tracking/admin?month=${e.target.value}`)
    }

    const exportToExcel = async () => {
        try {
            const XLSX = await import("xlsx")
            const data = entries.map(e => ({
                Usuario: e.users?.full_name || e.users?.email,
                Fecha: format(new Date(e.clock_in), "dd/MM/yyyy"),
                Entrada: format(new Date(e.clock_in), "HH:mm"),
                Salida: e.clock_out ? format(new Date(e.clock_out), "HH:mm") : 'En curso',
                Total_Horas: e.total_minutes ? (e.total_minutes / 60).toFixed(2) : 0,
                Proyecto: e.projects?.name || '-',
                Verificado: e.is_verified ? 'SI' : 'NO',
                Notas: e.verification_notes
            }))

            const ws = XLSX.utils.json_to_sheet(data)
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, "Reporte Horas")
            XLSX.writeFile(wb, `Reporte_Horas_${currentMonth}.xlsx`)
        } catch (error) {
            console.error("Error cargando Excel engine:", error)
        }
    }

    // Calculate totals
    const totalHours = entries.reduce((acc, curr) => acc + (curr.total_minutes || 0), 0) / 60

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
                <div className="flex items-center gap-4">
                    <span className="text-zinc-400">Mes:</span>
                    <Input
                        type="month"
                        value={currentMonth}
                        onChange={handleMonthChange}
                        className="bg-zinc-950 border-zinc-700 w-auto"
                    />
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <span className="text-sm text-zinc-500 block">Total Horas</span>
                        <span className="text-2xl font-bold text-white">{totalHours.toFixed(2)}h</span>
                    </div>
                    <Button onClick={exportToExcel} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                        <Download className="h-4 w-4" />
                        Exportar Excel
                    </Button>
                </div>
            </div>

            <div className="rounded-md border border-zinc-800 bg-zinc-900/50">
                <Table>
                    <TableHeader>
                        <TableRow className="border-zinc-800 hover:bg-zinc-900">
                            <TableHead>Empleado</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Entrada</TableHead>
                            <TableHead>Salida</TableHead>
                            <TableHead>Duración</TableHead>
                            <TableHead>Proyecto</TableHead>
                            <TableHead>Ubicación</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {entries.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-zinc-500">
                                    No hay registros para este periodo.
                                </TableCell>
                            </TableRow>
                        ) : (
                            entries.map((entry) => (
                                <TableRow key={entry.id} className="border-zinc-800 hover:bg-zinc-800/50">
                                    <TableCell className="font-medium text-white">
                                        {entry.users?.full_name || entry.users?.email}
                                    </TableCell>
                                    <TableCell className="text-zinc-400">
                                        {format(new Date(entry.clock_in), "dd MMM", { locale: es })}
                                    </TableCell>
                                    <TableCell>{format(new Date(entry.clock_in), "HH:mm")}</TableCell>
                                    <TableCell>
                                        {entry.clock_out ? format(new Date(entry.clock_out), "HH:mm") : <span className="text-emerald-500 font-medium">Activo</span>}
                                    </TableCell>
                                    <TableCell className="font-mono">
                                        {entry.total_minutes ?
                                            `${Math.floor(entry.total_minutes / 60)}h ${entry.total_minutes % 60}m` :
                                            '-'
                                        }
                                    </TableCell>
                                    <TableCell>{entry.projects?.name || '-'}</TableCell>
                                    <TableCell>
                                        {entry.is_verified ? (
                                            <div className="flex items-center gap-1 text-emerald-500" title={entry.verification_notes}>
                                                <CheckCircle className="h-4 w-4" />
                                                <span className="text-xs">Verificado</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-amber-500" title={entry.verification_notes || 'Ubicación desconocida'}>
                                                <AlertCircle className="h-4 w-4" />
                                                <span className="text-xs">Revisar</span>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
