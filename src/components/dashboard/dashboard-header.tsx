"use client"

import { useState, useEffect } from "react"
import { Bell, Search, Menu, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MobileMenu } from "./mobile-menu"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { signOut } from "next-auth/react"
import { getUnreadCount, getNotifications, markAsRead, markAllAsRead } from "@/lib/actions/notifications"

interface DashboardHeaderProps {
    user: any
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
    const [mounted, setMounted] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const [notifications, setNotifications] = useState<any[]>([])
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        setMounted(true)
        fetchUnreadCount()

        // Polling for unread count every minute
        const interval = setInterval(fetchUnreadCount, 60000)
        return () => clearInterval(interval)
    }, [])

    const fetchUnreadCount = async () => {
        try {
            const count = await getUnreadCount()
            setUnreadCount(count)
        } catch (error) {
            console.error("Failed to fetch unread count", error)
        }
    }

    const fetchNotifications = async () => {
        try {
            const data = await getNotifications(10) // Limit 10
            setNotifications(data)
        } catch (error) {
            console.error("Failed to fetch notifications", error)
        }
    }

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open)
        if (open) {
            fetchNotifications()
        }
    }

    const handleMarkAsRead = async (id: string, link?: string) => {
        await markAsRead(id)
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
        fetchUnreadCount()

        if (link) {
            window.location.href = link
        }
    }

    const handleMarkAllRead = async () => {
        await markAllAsRead()
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
    }

    const handleSignOut = async () => {
        await signOut({ callbackUrl: "/login" })
    }

    const initials = user?.email?.substring(0, 2).toUpperCase() || "U"

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="md:hidden">
                <MobileMenu userRole={user?.user_metadata?.role || 'user'} />
            </div>

            <div className="w-full flex-1">
                <form>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Buscar proyectos, clientes..."
                            className="w-full bg-background pl-8 md:w-2/3 lg:w-1/3"
                            suppressHydrationWarning
                        />
                    </div>
                </form>
            </div>

            <div className="flex items-center gap-2">
                {mounted ? (
                    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative">
                                <Bell className="h-5 w-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600" />
                                )}
                                <span className="sr-only">Notificaciones</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80">
                            <DropdownMenuLabel className="flex justify-between items-center">
                                <span>Notificaciones</span>
                                {unreadCount > 0 && (
                                    <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="text-xs h-6">
                                        Marcar leídas
                                    </Button>
                                )}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <div className="max-h-[300px] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                        No tienes notificaciones
                                    </div>
                                ) : (
                                    notifications.map((notification) => (
                                        <DropdownMenuItem
                                            key={notification.id}
                                            className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${!notification.read ? 'bg-muted/50' : ''}`}
                                            onClick={() => handleMarkAsRead(notification.id, notification.link)}
                                        >
                                            <div className="flex w-full justify-between items-start">
                                                <span className="font-medium text-sm">{notification.title}</span>
                                                {!notification.read && <span className="h-2 w-2 rounded-full bg-blue-500 mt-1" />}
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                                            <span className="text-[10px] text-muted-foreground w-full text-right">
                                                {new Date(notification.created_at).toLocaleDateString()}
                                            </span>
                                        </DropdownMenuItem>
                                    ))
                                )}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5" />
                        <span className="sr-only">Notificaciones</span>
                    </Button>
                )}

                {mounted ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user?.user_metadata?.avatar_url} alt="Avatar" />
                                    <AvatarFallback>{initials}</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild className="cursor-pointer">
                                <a href="/dashboard/settings/profile">Perfil</a>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="cursor-pointer">
                                <a href="/dashboard/settings">Configuración</a>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleSignOut} className="text-red-500 cursor-pointer">
                                Cerrar Sesión
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                )}
            </div>
        </header>
    )
}
