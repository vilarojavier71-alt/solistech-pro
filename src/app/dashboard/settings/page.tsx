import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, Building2, Users, Box, CreditCard, Laptop } from 'lucide-react'
import { ProfileForm } from '@/components/settings/profile-form'
import { OrganizationForm } from '@/components/settings/organization-form'
import { IntegrationsForm } from '@/components/settings/integrations-form' // Renamed
import { AppearanceForm } from '@/components/settings/appearance-form' // New
import { BillingView } from '@/components/billing/billing-view'
import { AddEmployeeDialog } from '@/components/admin/add-employee-dialog'
import { UsersTable } from '@/components/admin/users-table'
import { getEmployees } from '@/lib/actions/employees'
import { Separator } from '@/components/ui/separator'

export const metadata: Metadata = {
    title: 'Configuración | MotorGap',
    description: 'Configuración de tu cuenta y organización',
}

export default async function SettingsPage() {
    const session = await auth()

    if (!session?.user) return null

    // Get user profile
    const profile = await prisma.User.findUnique({
        where: { id: session.user.id },
    })

    if (!profile) return null

    // Get organization details
    const organization = profile.organization_id
        ? await prisma.organizations.findUnique({
            where: { id: profile.organization_id },
        })
        : null

    // Create user object for ProfileForm compatibility
    const user = {
        id: session.user.id,
        email: session.user.email,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        user_metadata: { full_name: profile.full_name }
    } as any

    // ✅ Permission Masking: Usar permisos booleanos en lugar de roles
    const { getUserPermissions } = await import('@/lib/actions/permissions')
    const permissions = await getUserPermissions()
    const isAdmin = permissions.manage_users || permissions.edit_settings || !profile.organization_id
    const { data: employees } = (permissions.manage_users || permissions.manage_team) ? await getEmployees() : { data: null }

    // Get subscription for billing tab
    const { getOrganizationSubscription } = await import('@/lib/actions/subscriptions')
    const subscription = organization ? await getOrganizationSubscription() : null

    return (
        <div className="space-y-6 pb-20">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
                <p className="text-muted-foreground">
                    Gestiona tu perfil y las preferencias de tu espacio de trabajo.
                </p>
            </div>
            <Separator />

            <Tabs defaultValue="profile" orientation="vertical" className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                <aside className="lg:w-1/5">
                    <TabsList className="flex w-full overflow-x-auto pb-2 lg:pb-0 lg:flex-col justify-start items-start gap-2 bg-transparent p-0 lg:sticky lg:top-24 h-auto scrollbar-hide">
                        <div className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground mb-1 mt-2 hidden lg:block">Cuenta</div>
                        <TabsTrigger
                            value="profile"
                            className="w-full justify-start text-left font-normal data-[state=active]:bg-muted data-[state=active]:text-foreground"
                        >
                            <User className="mr-2 h-4 w-4" />
                            Perfil
                        </TabsTrigger>
                        <TabsTrigger
                            value="appearance"
                            className="w-full justify-start text-left font-normal data-[state=active]:bg-muted data-[state=active]:text-foreground"
                        >
                            <Laptop className="mr-2 h-4 w-4" />
                            Apariencia
                        </TabsTrigger>

                        {/* WORKSPACE SECTION */}
                        <div className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground mb-1 mt-4 hidden lg:block">Espacio de Trabajo</div>
                        <TabsTrigger
                            value="organization"
                            className="w-full justify-start text-left font-normal data-[state=active]:bg-muted data-[state=active]:text-foreground"
                        >
                            <Building2 className="mr-2 h-4 w-4" />
                            General
                        </TabsTrigger>
                        {isAdmin && (
                            <>
                                <TabsTrigger
                                    value="team"
                                    className="w-full justify-start text-left font-normal data-[state=active]:bg-muted data-[state=active]:text-foreground"
                                >
                                    <Users className="mr-2 h-4 w-4" />
                                    Equipo
                                </TabsTrigger>
                                <TabsTrigger
                                    value="billing"
                                    className="w-full justify-start text-left font-normal data-[state=active]:bg-muted data-[state=active]:text-foreground"
                                >
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    Facturación
                                </TabsTrigger>
                            </>
                        )}

                        {/* ADVANCED SECTION */}
                        {isAdmin && (
                            <>
                                <div className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground mb-1 mt-4 hidden lg:block">Avanzado</div>
                                <TabsTrigger
                                    value="integrations"
                                    className="w-full justify-start text-left font-normal data-[state=active]:bg-muted data-[state=active]:text-foreground"
                                >
                                    <Box className="mr-2 h-4 w-4" />
                                    Integraciones
                                </TabsTrigger>
                            </>
                        )}
                    </TabsList>
                </aside>

                <div className="flex-1 lg:max-w-2xl">
                    <TabsContent value="profile" className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium">Perfil Personal</h3>
                            <p className="text-sm text-muted-foreground">
                                Actualiza tu información personal y cómo te ven los demás.
                            </p>
                        </div>
                        <Separator />
                        <ProfileForm user={user} profile={profile} />
                    </TabsContent>

                    <TabsContent value="appearance" className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium">Apariencia</h3>
                            <p className="text-sm text-muted-foreground">
                                Personaliza la estética de la aplicación.
                            </p>
                        </div>
                        <Separator />
                        <AppearanceForm />
                    </TabsContent>

                    <TabsContent value="organization" className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium">Organización</h3>
                            <p className="text-sm text-muted-foreground">
                                Gestiona los detalles de tu empresa.
                            </p>
                        </div>
                        <Separator />
                        <OrganizationForm organization={organization} />
                    </TabsContent>

                    {isAdmin && (
                        <TabsContent value="team" className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-medium">Equipo</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Gestiona el acceso y roles de tus empleados.
                                    </p>
                                </div>
                                <AddEmployeeDialog />
                            </div>
                            <Separator />
                            <Card>
                                <CardContent className="p-0">
                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                    {employees && employees.length > 0 ? (
                                        <UsersTable users={employees as any} />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-12 text-center">
                                            <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                                            <h3 className="text-lg font-semibold">Tu equipo está vacío</h3>
                                            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                                                Comienza agregando miembros para colaborar en proyectos.
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}

                    {isAdmin && (
                        <TabsContent value="billing" className="space-y-6">
                            <BillingView subscription={subscription} orgId={organization?.id} />
                        </TabsContent>
                    )}

                    {isAdmin && (
                        <TabsContent value="integrations" className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium">Integraciones</h3>
                                <p className="text-sm text-muted-foreground">
                                    Conecta servicios externos para potenciar MotorGap.
                                </p>
                            </div>
                            <Separator />
                            <IntegrationsForm />
                        </TabsContent>
                    )}
                </div>
            </Tabs>
        </div>
    )
}
