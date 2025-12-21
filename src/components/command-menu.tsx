"use client"

import * as React from "react"
import {
    Calculator,
    Calendar,
    CreditCard,
    Settings,
    Smile,
    User,
    Zap,
    Moon,
    Sun,
    LayoutDashboard,
    FileText,
    Users
} from "lucide-react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { DialogProps } from "@radix-ui/react-dialog"
import { Command as CommandPrimitive } from "cmdk"

import { cn } from "@/lib/utils"
// import { Dialog, DialogContent } from "@/components/ui/dialog" // Usaremos el wrapper directo de cmdk si es necesario para estilos custom, o la implementación shadcn si existiera.
// Para esta implementación "Glass", usaremos estilos directos sobre CommandPrimitive para máximo control visual.

export function CommandMenu() {
    const [open, setOpen] = React.useState(false)
    const { setTheme } = useTheme()
    const router = useRouter()

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    const runCommand = React.useCallback((command: () => unknown) => {
        setOpen(false)
        command()
    }, [])

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/60 backdrop-blur-sm animate-in fade-in-0">
            <div className="w-full max-w-lg rounded-xl border border-white/10 bg-zinc-950/80 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 overflow-hidden ring-1 ring-white/10">
                <CommandPrimitive className="flex h-full w-full flex-col overflow-hidden rounded-xl bg-transparent text-zinc-50">
                    <div className="flex items-center border-b border-white/5 px-3" cmdk-input-wrapper="">
                        <CommandPrimitive.Input
                            placeholder="Escribe un comando o busca..."
                            className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-zinc-500 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>
                    <CommandPrimitive.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
                        <CommandPrimitive.Empty className="py-6 text-center text-sm text-zinc-500">Sin resultados.</CommandPrimitive.Empty>

                        <CommandPrimitive.Group heading="Navegación Rápida" className="text-xs font-medium text-zinc-400 px-2 py-1.5">
                            <CommandItem onSelect={() => runCommand(() => router.push('/dashboard'))}>
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                <span>Dashboard</span>
                            </CommandItem>
                            <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/invoices/new'))}>
                                <FileText className="mr-2 h-4 w-4" />
                                <span>Crear Factura</span>
                            </CommandItem>
                            <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/settings/team'))}>
                                <Users className="mr-2 h-4 w-4" />
                                <span>Equipo y Usuarios</span>
                            </CommandItem>
                            <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/switching'))}>
                                <Zap className="mr-2 h-4 w-4" />
                                <span>Switching Eléctrico</span>
                            </CommandItem>
                        </CommandPrimitive.Group>

                        <CommandPrimitive.Separator className="my-1 h-px bg-white/5" />

                        <CommandPrimitive.Group heading="Configuración" className="text-xs font-medium text-zinc-400 px-2 py-1.5">
                            <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
                                <Sun className="mr-2 h-4 w-4" />
                                <span>Modo Claro</span>
                            </CommandItem>
                            <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
                                <Moon className="mr-2 h-4 w-4" />
                                <span>Modo Oscuro</span>
                            </CommandItem>
                        </CommandPrimitive.Group>
                    </CommandPrimitive.List>
                </CommandPrimitive>
            </div>
        </div>
    )
}

function CommandItem({ children, onSelect }: { children: React.ReactNode, onSelect: () => void }) {
    return (
        <CommandPrimitive.Item
            onSelect={onSelect}
            className="group relative flex cursor-default select-none items-center rounded-md px-2 py-2 text-sm outline-none data-[selected=true]:bg-white/10 data-[selected=true]:text-white transition-colors"
        >
            {children}
            <span className="ml-auto text-xs tracking-widest text-zinc-500 group-data-[selected=true]:text-zinc-400">â†µ</span>
        </CommandPrimitive.Item>
    )
}
