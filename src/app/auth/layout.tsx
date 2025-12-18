import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    let session
    try {
        session = await auth()
        // If user is already logged in, redirect to dashboard
        if (session?.user) {
            redirect('/dashboard')
        }
    } catch (error) {
        console.error("Auth check failed in layout:", error)
        // Continue rendering login form if auth check fails
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
            <div className="w-full max-w-md px-4">
                {children}
            </div>
        </div>
    )
}

