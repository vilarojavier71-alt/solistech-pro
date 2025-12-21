import { getCustomers } from "@/lib/actions/customers"
import { ClientsTable } from "@/components/crm/clients-table"
import { Button } from "@/components/ui/button"
import { ClientActions } from "@/components/crm/client-actions"
import { PageShell } from "@/components/ui/page-shell"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default async function CRMClientsPage() {
    const { data: customers, error } = await getCustomers()

    if (error) {
        return (
            <PageShell
                title="Clientes y Leads"
                description="Gestiona tu cartera de clientes y oportunidades de venta."
                action={<ClientActions />}
            >
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        No se pudieron cargar los clientes: {error}
                    </AlertDescription>
                </Alert>
            </PageShell>
        )
    }

    // Map backend legacy customer shape to new ClientData shape if needed
    const mapClients = (data: any[]) => (data || []).map((c: any) => ({
        id: c.id,
        name: c.name || c.full_name,
        email: c.email,
        phone: c.phone,
        company: c.company,
        tax_id: c.tax_id || c.nif,
        address: c.address || {},
        status: c.status || 'customer' as 'lead' | 'customer'
    }))

    const allClients = mapClients(customers || [])
    const clientsOnly = allClients.filter(c => c.status === 'customer')
    const leadsOnly = allClients.filter(c => c.status === 'lead')

    return (
        <PageShell
            title="Clientes y Leads"
            description="Gestiona tu cartera de clientes y oportunidades de venta."
            action={<ClientActions />}
        >
            <Tabs defaultValue="all" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="all">
                        Todos ({allClients.length})
                    </TabsTrigger>
                    <TabsTrigger value="customers">
                        Clientes ({clientsOnly.length})
                    </TabsTrigger>
                    <TabsTrigger value="leads">
                        Leads ({leadsOnly.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-0">
                    <ClientsTable clients={allClients} />
                </TabsContent>

                <TabsContent value="customers" className="mt-0">
                    <ClientsTable clients={clientsOnly} />
                </TabsContent>

                <TabsContent value="leads" className="mt-0">
                    <ClientsTable clients={leadsOnly} />
                </TabsContent>
            </Tabs>
        </PageShell>
    )
}
