"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { deleteExpense, Expense } from "@/lib/actions/expenses";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ExpensesTableProps {
    expenses: Expense[];
}

export function ExpensesTable({ expenses }: ExpensesTableProps) {

    const handleDelete = async (id: string) => {
        if (!confirm("Â¿Seguro que quieres borrar este gasto?")) return;
        const res = await deleteExpense(id);
        if (res.success) toast.success("Gasto eliminado");
        else toast.error(res.message);
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Concepto</TableHead>
                        <TableHead>CategorÃ­a</TableHead>
                        <TableHead className="text-right">Importe</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {expenses.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                <EmptyState
                                    title="No hay gastos"
                                    description="No hay gastos registrados en este momento."
                                    className="border-none py-12"
                                />
                            </TableCell>
                        </TableRow>
                    ) : (
                        expenses.map((expense) => (
                            <TableRow key={expense.id}>
                                <TableCell>{format(new Date(expense.date), "d MMM yyyy", { locale: es })}</TableCell>
                                <TableCell className="font-medium">{expense.description}</TableCell>
                                <TableCell>
                                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                        {expense.category}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                    {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(Number(expense.amount))}
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(expense.id)} className="h-8 w-8 text-muted-foreground hover:text-red-600">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
