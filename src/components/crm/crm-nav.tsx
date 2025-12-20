'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function CRMNavigation() {
    const pathname = usePathname()

    const links = [
        { href: "/dashboard/crm", label: "Dashboard", exact: true },
        { href: "/dashboard/crm/clients", label: "Clientes" },
        { href: "/dashboard/crm/opportunities", label: "Oportunidades" },
    ]

    return (
        <div className="flex space-x-6">
            {links.map((link) => {
                const isActive = link.exact
                    ? pathname === link.href
                    : pathname.startsWith(link.href)

                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            "pb-3 text-sm font-medium transition-colors border-b-2",
                            isActive
                                ? "text-white border-emerald-500"
                                : "text-zinc-400 hover:text-white border-transparent hover:border-zinc-700"
                        )}
                    >
                        {link.label}
                    </Link>
                )
            })}
        </div>
    )
}
