import { PageShell } from "@/components/ui/page-shell";
import { getFinancialSummary, getExpenseList } from "@/lib/actions/expenses";
import { FinanceSummaryCards } from "@/components/finance/finance-summary-cards";
import { ExpensesTable } from "@/components/finance/expenses-table";
import { NewExpenseDialog } from "@/components/finance/new-expense-dialog";
import { Button } from "@/components/ui/button";
import { FileText, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default async function FinancePage() {
    // Parallel data fetching
    const summaryDataPromise = getFinancialSummary(); // Fetches income & expenses
    const expensesListPromise = getExpenseList();

    // Fallback in case of DB errors (e.g. migration not run)
    let summaryData = { totalIncome: 0, totalExpenses: 0, balance: 0 };
    let expensesList: any[] = [];
    let dbError = false;

    try {
        [summaryData, expensesList] = await Promise.all([summaryDataPromise, expensesListPromise]);
    } catch (e) {
        console.error("Finance DB Error:", e);
        dbError = true;
    }

    return (
        <PageShell title="Finanzas y Tesorería" description="Visión global del estado económico de la empresa.">
            <div className="space-y-8">

                {/* 1. TOP ACTIONS */}
                <div className="flex flex-col sm:flex-row gap-4 justify-end">
                    <Link href="/dashboard/invoices/new">
                        <Button variant="outline">
                            <ArrowUpRight className="mr-2 h-4 w-4" /> Nueva Factura (Ingreso)
                        </Button>
                    </Link>
                    <NewExpenseDialog />
                </div>

                {/* 2. KPI CARDS */}
                <FinanceSummaryCards data={summaryData} />

                {/* 3. MAIN CONTENT AREA */}
                <div className="grid md:grid-cols-3 gap-8">

                    {/* LEFT: EXPENSES LIST */}
                    <div className="md:col-span-2 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Últimos Gastos Operativos</h3>
                            {dbError && <span className="text-xs text-red-500 bg-red-100 px-2 py-1 rounded">Error de DB: Ejecuta la migración SQL</span>}
                        </div>
                        <ExpensesTable expenses={expensesList} />
                    </div>

                    {/* RIGHT: QUICK LINKS / MINI WIDGETS */}
                    <div className="space-y-6">
                        <div className="p-6 rounded-lg border bg-card shadow-sm space-y-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <FileText className="h-4 w-4" /> Accesos Directos
                            </h3>
                            <div className="grid gap-2">
                                <Link href="/dashboard/invoices">
                                    <Button variant="ghost" className="w-full justify-start">Ver Todas las Facturas</Button>
                                </Link>
                                <Link href="/dashboard/quotes">
                                    <Button variant="ghost" className="w-full justify-start">Ver Presupuestos</Button>
                                </Link>
                                <Link href="/dashboard/settings">
                                    <Button variant="ghost" className="w-full justify-start">Configuración Fiscal</Button>
                                </Link>
                            </div>
                        </div>

                        {/* Tip Widget */}
                        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-sm text-blue-800 dark:text-blue-300">
                            <p className="font-semibold mb-1">?? Consejo Financiero</p>
                            Registra todos los gastos menores (tickets, parkings) para maximizar tus deducciones fiscales a final de trimestre.
                        </div>
                    </div>
                </div>
            </div>
        </PageShell>
    );
}
