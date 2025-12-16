import { PageShell } from "@/components/ui/page-shell"
import { GlowCard } from "@/components/ui/glow-card"
import { Construction } from "lucide-react"

export function PlaceholderPage({ title, description }: { title: string, description: string }) {
    return (
        <PageShell title={title}>
            <div className="grid place-items-center h-[60vh]">
                <GlowCard className="p-12 text-center max-w-md flex flex-col items-center gap-4">
                    <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-500 mb-2">
                        <Construction className="h-10 w-10" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Módulo {title}</h2>
                    <p className="text-zinc-400">{description}</p>
                    <button className="px-4 py-2 bg-emerald-500 text-black font-bold rounded hover:bg-emerald-400 transition-colors pointer-events-none opacity-50">
                        Próximamente
                    </button>
                </GlowCard>
            </div>
        </PageShell>
    )
}
