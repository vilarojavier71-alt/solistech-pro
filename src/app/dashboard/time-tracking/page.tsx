import { PageShell } from "@/components/ui/page-shell"
import { TimeTracker } from "@/components/time-tracking/time-tracker"
import { TimeHistory } from "@/components/time-tracking/time-history" // We'll create this next
import { Suspense } from "react"

export default function TimeTrackingPage() {
    return (
        <PageShell
            title="Control Horario"
            description="Registra tu jornada laboral y asigna horas a proyectos."
        >
            <div className="grid gap-8 lg:grid-cols-2">
                <div className="space-y-6">
                    <Suspense fallback={<div>Cargando...</div>}>
                        <TimeTracker />
                    </Suspense>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-white">Historial Reciente</h3>
                    <Suspense fallback={<div>Cargando historial...</div>}>
                        <TimeHistory />
                    </Suspense>
                </div>
            </div>
        </PageShell>
    )
}
