import { redirect } from 'next/navigation'
export const dynamic = 'force-dynamic'
import { ClientDashboard } from '@/components/portal/client-dashboard'

export default async function ClientDashboardPage() {
    // TODO: Replace with NextAuth session check
    // const supabase = await createClient()

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100">
            <ClientDashboard />
        </div>
    )
}
