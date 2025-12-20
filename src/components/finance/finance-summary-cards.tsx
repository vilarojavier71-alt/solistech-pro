import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Euro, TrendingDown, TrendingUp, Wallet } from "lucide-react";

interface FinanceSummaryProps {
    data: {
        totalIncome: number;
        totalExpenses: number;
        balance: number;
    }
}

export function FinanceSummaryCards({ data }: FinanceSummaryProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
    }

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-emerald-500/20 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ingresos Totales (Pagados)</CardTitle>
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-emerald-600">{formatCurrency(data.totalIncome)}</div>
                    <p className="text-xs text-muted-foreground">+20.1% vs mes anterior (Simulado)</p>
                </CardContent>
            </Card>

            <Card className="border-rose-500/20 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Gastos Operativos</CardTitle>
                    <TrendingDown className="h-4 w-4 text-rose-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-rose-600">{formatCurrency(data.totalExpenses)}</div>
                    <p className="text-xs text-muted-foreground">+4% vs mes anterior (Simulado)</p>
                </CardContent>
            </Card>

            <Card className="border-indigo-500/20 shadow-sm bg-indigo-50/5 dark:bg-indigo-900/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Beneficio Neto</CardTitle>
                    <Wallet className="h-4 w-4 text-indigo-500" />
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${data.balance >= 0 ? 'text-indigo-600' : 'text-amber-600'}`}>
                        {formatCurrency(data.balance)}
                    </div>
                    <p className="text-xs text-muted-foreground">Margen Neto: {data.totalIncome > 0 ? ((data.balance / data.totalIncome) * 100).toFixed(1) : 0}%</p>
                </CardContent>
            </Card>
        </div>
    );
}
