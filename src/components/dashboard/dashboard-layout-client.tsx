"use client"

import { SidebarProvider, useSidebar } from "@/components/providers/sidebar-provider"
import { OnboardingProvider } from "@/components/providers/onboarding-provider"
import { Sidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { MobileMenu } from "@/components/dashboard/mobile-menu"
import { OnboardingTour } from "@/components/onboarding/onboarding-tour-driver"
import { cn } from "@/lib/utils"

function DashboardContent({ children, user }: { children: React.ReactNode, user: any }) {
    const { isCollapsed } = useSidebar()

    return (
        <div className="flex min-h-screen w-full bg-muted/40">
            {/* 1. SIDEBAR (Desktop) - Dynamic Width */}
            <aside
                className={cn(
                    "hidden md:flex flex-col fixed inset-y-0 z-50 transition-all duration-300 ease-in-out bg-zinc-950",
                    isCollapsed ? "w-20" : "w-64"
                )}
            >
                <Sidebar userRole={user?.user_metadata?.role} plan={user?.plan} />
            </aside>

            {/* 2. MAIN CONTENT - Dynamic Margin */}
            <main
                className={cn(
                    "flex-1 overflow-y-auto transition-all duration-300 ease-in-out",
                    isCollapsed ? "md:ml-20" : "md:ml-64"
                )}
            >
                <DashboardHeader user={user} />
                <div className="p-6 pb-24 md:pb-6">
                    {children}
                </div>
            </main>

            {/* 3. MOBILE MENU (Sheet) */}
            <div className="md:hidden">
                {/* Handled in DashboardHeader usually, but specific MobileMenu component might be used here if needed for bottom nav replacement or generic handling */}
                {/* Logic moved to DashboardHeader as per previous step, but ensuring layout structure is clean */}
            </div>

            <OnboardingTour />
        </div>
    )
}

export function DashboardLayoutClient({ children, user }: { children: React.ReactNode, user: any }) {
    return (
        <SidebarProvider>
            <OnboardingProvider>
                <DashboardContent user={user}>{children}</DashboardContent>
            </OnboardingProvider>
        </SidebarProvider>
    )
}

