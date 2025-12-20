"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

interface SidebarContextType {
    isCollapsed: boolean
    toggleSidebar: () => void
    setCollapsed: (v: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const stored = localStorage.getItem("sidebar_collapsed")
        if (stored === "true") {
            setIsCollapsed(true)
        }
    }, [])

    const toggleSidebar = () => {
        const newState = !isCollapsed
        setIsCollapsed(newState)
        localStorage.setItem("sidebar_collapsed", String(newState))
    }

    const setCollapsed = (v: boolean) => {
        setIsCollapsed(v)
        localStorage.setItem("sidebar_collapsed", String(v))
    }

    // Avoid hydration mismatch by rendering children only or handling initial state carefully.
    // However, for sidebar layout, a small shift is acceptable or we can use a loading state.
    // For now, we return children always, state updates on mount.

    return (
        <SidebarContext.Provider value={{ isCollapsed, toggleSidebar, setCollapsed }}>
            {children}
        </SidebarContext.Provider>
    )
}

export function useSidebar() {
    const context = useContext(SidebarContext)
    if (context === undefined) {
        throw new Error("useSidebar must be used within a SidebarProvider")
    }
    return context
}
