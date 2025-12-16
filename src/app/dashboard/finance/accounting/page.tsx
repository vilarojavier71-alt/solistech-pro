import { JournalList } from "@/components/finance/ledger/journal-list";
import { AccountsTree } from "@/components/finance/accounts/accounts-tree";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrialBalanceReport } from "@/components/finance/reports/trial-balance";
import { NewJournalEntryForm } from "@/components/finance/ledger/new-entry-form";
import { getJournals, getTrialBalance, getAccounts } from "@/lib/actions/accounting";

export default async function AccountingPage() {
    // Fetch data in parallel
    const [journalsRes, trialBalanceRes, accountsRes] = await Promise.all([
        getJournals(),
        getTrialBalance(),
        getAccounts()
    ])

    const journals = journalsRes.success ? journalsRes.data : []
    const trialBalance = trialBalanceRes.success ? trialBalanceRes.data : []
    const accounts = accountsRes.success ? accountsRes.data : []

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Contabilidad</h2>
            </div>
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Libro Diario</TabsTrigger>
                    <TabsTrigger value="accounts">Plan de Cuentas</TabsTrigger>
                    <TabsTrigger value="reports">Reportes</TabsTrigger>
                    <TabsTrigger value="new-entry">Nuevo Asiento</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4">
                    <JournalList initialJournals={journals} />
                </TabsContent>
                <TabsContent value="accounts" className="space-y-4">
                    <AccountsTree initialAccounts={accounts} />
                </TabsContent>
                <TabsContent value="reports" className="space-y-4">
                    <TrialBalanceReport initialData={trialBalance} />
                </TabsContent>
                <TabsContent value="new-entry" className="space-y-4">
                    <NewJournalEntryForm />
                </TabsContent>
            </Tabs>
        </div>
    );
}
