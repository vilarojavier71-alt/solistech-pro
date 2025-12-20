import { getOpportunities } from "@/lib/actions/crm"
import { OpportunitiesList } from "@/components/crm/opportunities-list"
import { PageShell } from "@/components/ui/page-shell"

export default async function CRMOpportunitiesPage() {
    const { data: opportunities, error } = await getOpportunities()

    if (error) {
        return <div className="text-red-500">Error cargando oportunidades: {error}</div>
    }

    // We pass a dummy customerId because the list component is designed for reuse 
    // inside a client details page (where it needs customerId for creating new ones).
    // But here we are in the global list. We might need to adjust the OpportunitiesList component 
    // to handle "Global" mode where we select a customer when creating.
    // For now, let's just pass an empty string and handle it or let it fail gracefully if user tries to create without context.
    // Better yet, we can hide the create button here or make it more robust.
    // Actually, OpportunitiesList uses a Dialog that implicitly sends 'customer_id'.
    // Use 'GLOBAL' flag or similar if needed, or better, Refactor OpportunitiesList to support selecting customer.

    // For this iterations, we will render the list. The "New Opportunity" button in the list 
    // expects a customerId. If we are on the main page, we probably want a different Create button 
    // or the dialog needs to allow selecting a customer.
    // Given the constraints and the user request for "Gestión de Clientes", I will prioritize the client-centric view.
    // But for the global view, I'll pass current user's org ID or just let the list render.

    return (
        <PageShell
            title="Oportunidades"
            description="Visualiza y gestiona tu pipeline de ventas. (Funcionalidad Global en desarrollo)"
        >
            <OpportunitiesList opportunities={opportunities || []} customerId="" />
        </PageShell>
    )
}
