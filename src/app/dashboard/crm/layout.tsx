import { Metadata } from "next"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CRMNavigation } from "@/components/crm/crm-nav"

export const metadata: Metadata = {
    title: "CRM | MotorGap",
    description: "Gestión de clientes y oportunidades",
}

export default function CRMLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="flex-none px-6 pt-6 -mb-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-white">CRM</h2>
                        <p className="text-zinc-400">Gestión integral de clientes y oportunidades de venta</p>
                    </div>
                </div>

                <div className="border-b border-zinc-800">
                    <CRMNavigation />
                </div>
            </div>

            <div className="flex-1 overflow-auto px-6 pb-6">
                {children}
            </div>
        </div>
    )
}


