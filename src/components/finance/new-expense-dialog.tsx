"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createExpense, ExpenseCategory } from "@/lib/actions/expenses";
import { toast } from "sonner";
import { PlusCircle, Loader2 } from "lucide-react";

export function NewExpenseDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        description: "",
        amount: "",
        category: "Other" as ExpenseCategory,
        date: new Date().toISOString().split('T')[0]
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const res = await createExpense({
            ...formData,
            amount: parseFloat(formData.amount)
        });

        if (res.success) {
            toast.success("Gasto registrado");
            setOpen(false);
            setFormData({ ...formData, description: "", amount: "" }); // Reset partial
        } else {
            toast.error(res.message);
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-rose-600 hover:bg-rose-700 text-white">
                    <PlusCircle className="mr-2 h-4 w-4" /> Registrar Gasto
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Nuevo Gasto Operativo</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label>Descripción</Label>
                        <Input
                            required
                            placeholder="Ej: Licencia de Software"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Importe (€)</Label>
                            <Input
                                required
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Fecha</Label>
                            <Input
                                required
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Categoría</Label>
                        <Select
                            value={formData.category}
                            onValueChange={(val) => setFormData({ ...formData, category: val as ExpenseCategory })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Office">Oficina</SelectItem>
                                <SelectItem value="Equipment">Equipamiento</SelectItem>
                                <SelectItem value="Marketing">Marketing</SelectItem>
                                <SelectItem value="Software">Software</SelectItem>
                                <SelectItem value="Personnel">Personal</SelectItem>
                                <SelectItem value="Vehicles">Vehículos</SelectItem>
                                <SelectItem value="Other">Otro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Guardar Gasto"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
