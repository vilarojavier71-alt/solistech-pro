import { getCustomer } from "@/lib/actions/customers"
import { getContacts, getOpportunities, getActivities } from "@/lib/actions/crm"
import { ClientEditSheet } from "@/components/customers/client-edit-sheet"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Phone, MapPin, Building2, User, Pencil, FileText } from 'lucide-react'
import { ClientDetailsHeader } from "@/components/crm/client-details-header"
import { ContactsList } from "@/components/crm/contacts-list"
import { OpportunitiesList } from "@/components/crm/opportunities-list"
import { ActivitiesFeed } from "@/components/crm/activities-feed"
import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"

async function getClient(id: string) {
    // Migrated to Prisma
    const data = await prisma.customers.findUnique({
        where: { id }
    })
    return data
}

export default async function ClientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    // Parallel fetching
    const [client, contactsRes, oppsRes, activitiesRes] = await Promise.all([
        getClient(id),
        getContacts(id),
        getOpportunities({ customerId: id }),
        getActivities({ customerId: id, limit: 10 })
    ])

    if (!client) {
        notFound()
    }

    return (
        <div className="space-y-6">
            <ClientDetailsHeader client={client} />

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="bg-zinc-800 text-zinc-400 border-zinc-700">
                    <TabsTrigger value="overview">Visión General</TabsTrigger>
                    <TabsTrigger value="contacts">Contactos ({contactsRes.data?.length || 0})</TabsTrigger>
                    <TabsTrigger value="opportunities">Oportunidades ({oppsRes.data?.length || 0})</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6 mt-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="bg-zinc-900 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-white text-base">Información de Contacto</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3 text-zinc-300">
                                    <Mail className="h-4 w-4 text-zinc-500" />
                                    <span>{client.email || 'No email'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-zinc-300">
                                    <Phone className="h-4 w-4 text-zinc-500" />
                                    <span>{client.phone || 'No phone'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-zinc-300">
                                    <MapPin className="h-4 w-4 text-zinc-500" />
                                    <span>
                                        {[client.address?.city, client.address?.province, client.address?.country].filter(Boolean).join(', ') || 'No address'}
                                    </span>
                                </div>
                                {client.nif && (
                                    <div className="flex items-center gap-3 text-zinc-300">
                                        <FileText className="h-4 w-4 text-zinc-500" />
                                        <span>{client.nif}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="bg-zinc-900 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-white text-base">Actividad Reciente</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ActivitiesFeed activities={activitiesRes.data || []} />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="contacts" className="mt-6">
                    <ContactsList contacts={contactsRes.data || []} customerId={client.id} />
                </TabsContent>

                <TabsContent value="opportunities" className="mt-6">
                    <OpportunitiesList opportunities={oppsRes.data || []} customerId={client.id} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
