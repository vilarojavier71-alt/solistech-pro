import { redirect } from 'next/navigation'
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { ClientDashboard } from '@/components/portal/client-dashboard'

export default async function ClientDashboardPage() {
    const supabase = await createClient()

    // Note: In a real app, we'd use proper auth with cookies
    // For now, we'll fetch based on a query parameter or session
    // This is a simplified version for demonstration

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100">
            <ClientDashboard />
        </div>
    )
}
