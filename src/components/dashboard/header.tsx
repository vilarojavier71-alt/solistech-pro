'use client'


import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, Settings, User, HelpCircle, PlayCircle, BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { signOut } from 'next-auth/react'

export function DashboardHeader({ user }: { user: any }) {
    const router = useRouter()


    const handleLogout = async () => {
        await signOut({ redirect: false })
        toast.success('Sesión cerrada')
        router.push('/auth/login')
        router.refresh()
    }

    const handleRestartTour = () => {
        import('@/lib/onboarding/tour-config').then(({ restartOnboardingTour }) => {
            restartOnboardingTour()
        })
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    return (
        <header className="flex h-16 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6" id="dashboard-header">
            <div className="flex items-center gap-4">
                {/* Breadcrumbs or page title could go here */}
            </div>

            <div className="flex items-center gap-2">
                {/* Freemium Badge */}
                {user?.plan === 'basic' && (
                    <div className="mr-4 hidden md:block">
                        <Link href="/dashboard/settings/billing">
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 hover:bg-blue-200 cursor-pointer transition-colors border border-blue-200">
                                ?? PLAN GRATUITO
                            </span>
                        </Link>
                    </div>
                )}

                {/* Help Button */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative">
                            <HelpCircle className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Centro de Ayuda</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleRestartTour}>
                            <PlayCircle className="mr-2 h-4 w-4" />
                            <span>Ver Tour de Nuevo</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/dashboard/help">
                                <BookOpen className="mr-2 h-4 w-4" />
                                <span>Guías y Tutoriales</span>
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* User Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={user?.avatar_url} alt={user?.full_name || ''} />
                                <AvatarFallback>
                                    {user?.full_name ? getInitials(user.full_name) : 'U'}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">
                                    {user?.full_name || 'Usuario'}
                                </p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {user?.email}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push('/dashboard/settings')} id="settings-button">
                            <User className="mr-2 h-4 w-4" />
                            <span>Perfil</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Configuración</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Cerrar sesión</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
