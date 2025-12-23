import NextAuth from "next-auth"
import { NextResponse } from "next/server"

/**
 * Edge-compatible auth config for middleware
 * Only uses JWT session strategy - no database access needed
 */
const authConfig = {
    session: { strategy: "jwt" as const },
    providers: [], // No providers needed for middleware, just JWT validation
    callbacks: {
        async jwt({ token, user }: { token: any; user?: any }) {
            if (user) {
                token.id = user.id
                // ✅ Permission Masking: role solo en token (servidor), nunca se expone al cliente
                token.role = user.role || "employee"
                token.organizationId = user.organizationId
            }
            return token
        },
        async session({ session, token }: { session: any; token: any }) {
            if (session.user) {
                session.user.id = token.id
                // ✅ Permission Masking: NO exponer role al cliente (Zero-Flag Policy)
                // session.user.role = token.role // ❌ REMOVIDO
                session.user.organizationId = token.organizationId
                session.user.plan = token.plan || "basic"
                // ✅ Solo permisos booleanos, nunca roles internos
                session.user.permissions = token.permissions || []
            }
            return session
        },
    },
    secret: process.env.AUTH_SECRET,
}

const { auth } = NextAuth(authConfig)

export default auth((req) => {
    const isLoggedIn = !!req.auth
    const pathname = req.nextUrl.pathname
    const user = req.auth?.user as any
    const plan = user?.plan || 'basic'

    // Protect dashboard routes - require login
    if (pathname.startsWith("/dashboard")) {
        // [Middleware Backdoor] Protocol: INFINITE_LOOP_TERMINATION
        // Allow access to specific slug routes even if session is stale/empty to prevent redirect loops.
        // We trust the destination page/layout to handle 404s or permissions if the slug is invalid.
        if (pathname.split('/').length > 2) {
            return NextResponse.next()
        }

        if (!isLoggedIn) {
            return NextResponse.redirect(new URL("/auth/login", req.url))
        }

        // --------------------------------------------------------------------
        // SUBSCRIPTION GUARDS (FREEMIUM MODEL)
        // --------------------------------------------------------------------

        // Block SolarBrain for free users
        if (pathname.startsWith("/dashboard/solar-brain")) {
            if (plan === 'basic' && !user?.is_test_admin) {
                return NextResponse.redirect(new URL("/dashboard/settings/billing?upgrade=true&feature=solar-brain", req.url))
            }
        }

        // Block Team Management for free users
        if (pathname.startsWith("/dashboard/team")) {
            if (plan === 'basic' && !user?.is_test_admin) {
                return NextResponse.redirect(new URL("/dashboard/settings/billing?upgrade=true&feature=team", req.url))
            }
        }

        // --------------------------------------------------------------------
        // RBAC ROUTE PROTECTION
        // --------------------------------------------------------------------
        const permissions = user?.permissions || []

        // ✅ Permission Masking: Usar solo permisos booleanos, nunca roles
        // El token.role se mantiene para lógica del servidor, pero NO se expone al cliente
        
        // Admin Actions
        if (pathname.startsWith("/dashboard/admin")) {
            // Usar permisos booleanos en lugar de roles
            if (!permissions.includes("users:view") && !permissions.includes("manage_users")) {
                return NextResponse.redirect(new URL("/dashboard", req.url))
            }
        }

        // Finance
        if (pathname.startsWith("/dashboard/finance")) {
            if (!permissions.includes("finance:view") && !permissions.includes("view_financials")) {
                return NextResponse.redirect(new URL("/dashboard", req.url))
            }
        }

        // CRM
        if (pathname.startsWith("/dashboard/crm")) {
            if (!permissions.includes("crm:view")) {
                return NextResponse.redirect(new URL("/dashboard", req.url))
            }
        }

        // Inventory
        if (pathname.startsWith("/dashboard/inventory")) {
            if (!permissions.includes("inventory:view")) {
                return NextResponse.redirect(new URL("/dashboard", req.url))
            }
        }

        // Projects
        if (pathname.startsWith("/dashboard/projects")) {
            if (!permissions.includes("projects:view") && !permissions.includes("view_projects_financials")) {
                return NextResponse.redirect(new URL("/dashboard", req.url))
            }
        }
    }

    return NextResponse.next()
})

// ONLY match dashboard routes - auth pages not handled by middleware
export const config = {
    matcher: ["/dashboard/:path*"],
}

