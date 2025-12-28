import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getSetting } from "@/lib/actions/settings"
import { DashboardLayoutClient } from "@/components/dashboard/dashboard-layout-client"
import { LayoutWrapper } from "@/components/layout-wrapper"

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    let session
    try {
        session = await auth()
        if (!session?.user) {
            return redirect("/auth/login")
        }
    } catch (error) {
        console.error("Auth check failed in DashboardLayout:", error)
        return redirect("/auth/login")
    }

    // Create user object compatible with DashboardLayoutClient
    const user = {
        id: session.user.id,
        email: session.user.email,
        user_metadata: {
            full_name: session.user.name,
            avatar_url: session.user.image,
        },
        plan: (session.user as any).plan || 'basic'
    }

    // Obtener Clave de Google Maps (Server Side)
    const googleApiKey = await getSetting('google_maps_api_key');

    return (
        <LayoutWrapper>
            <DashboardLayoutClient user={user}>
                {children}
            </DashboardLayoutClient>

            {/* Google Maps Platform API (Places Library) */}
            {/* Carga Dinámica: Renderizamos solo si hay clave válida en DB (prioridad sobre .env) */}
            {googleApiKey && googleApiKey.length > 20 && (
                <script
                    async
                    src={`https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&libraries=places`}
                ></script>
            )}
        </LayoutWrapper>
    )
}

