"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Sidebar } from "./sidebar"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"

interface MobileMenuProps {
    userRole?: string
}

export function MobileMenu({ userRole }: MobileMenuProps) {
    const [open, setOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    const pathname = usePathname()

    useEffect(() => {
        setMounted(true)
    }, [])

    // Close sheet when route changes
    useEffect(() => {
        setOpen(false)
    }, [pathname])

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
            </Button>
        )
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 bg-zinc-950 border-r-0" aria-describedby={undefined}>
                <SheetTitle className="sr-only">Menú de Navegación</SheetTitle>
                <Sidebar userRole={userRole} />
            </SheetContent>
        </Sheet>
    )
}
