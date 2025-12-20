import { PageShell } from "@/components/ui/page-shell"
import { TimeReportTable } from "@/components/time-tracking/time-report-table"
import { getAdminTimeEntries } from "@/lib/actions/time-tracking"

export default async function TimeTrackingAdminPage(props: { searchParams: Promise<{ month?: string }> }) {
    const searchParams = await props.searchParams;
    const currentMonth = searchParams.month || new Date().toISOString().slice(0, 7) // YYYY-MM

    const entries = await getAdminTimeEntries(currentMonth)

    return (
        <PageShell
            title="Reporte de Horas"
            description="Vista administrativa de control horario y nómina."
        >
            <TimeReportTable entries={entries} currentMonth={currentMonth} />
        </PageShell>
    )
}
