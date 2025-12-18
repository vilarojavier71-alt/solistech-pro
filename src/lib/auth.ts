import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import bcrypt from "bcryptjs"
import { PrismaClient } from "@prisma/client"
// import prisma from "@/lib/db"

const prisma = new PrismaClient()

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/auth/login",
        newUser: "/auth/register",
    },
    providers: [
        // Google OAuth
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        // Email/Password credentials
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null
                }

                const user = await prisma.users.findUnique({
                    where: { email: credentials.email as string },
                })

                if (!user || !user.password_hash) {
                    return null
                }

                const isValid = await bcrypt.compare(
                    credentials.password as string,
                    user.password_hash
                )

                if (!isValid) {
                    return null
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.full_name,
                    role: user.role || undefined,
                    organizationId: user.organization_id || undefined,
                }
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            // For OAuth (Google), create/update user in our users table
            if (account?.provider === "google" && user.email) {
                const existingUser = await prisma.users.findUnique({
                    where: { email: user.email },
                })

                if (!existingUser) {
                    // Create new user from Google OAuth
                    await prisma.users.create({
                        data: {
                            email: user.email,
                            full_name: user.name || "Usuario",
                            role: "user",
                            email_verified: true,
                            avatar_url: user.image,
                        },
                    })
                }
            }
            return true
        },
        async jwt({ token, user, account }) {
            // Initial login - set basic user data
            if (user) {
                token.id = user.id
                token.role = (user as any).role || "user"
                token.organizationId = (user as any).organizationId
            }

            // CRITICAL FIX: Always re-hydrate organization_id from DB
            // This ensures session reflects changes made after login (e.g., creating org)
            if (token.id) {
                console.log('[AUTH] JWT Callback -> Fetching user data for:', token.id)
                const dbUser = await prisma.users.findUnique({
                    where: { id: token.id as string },
                    select: {
                        organization_id: true,
                        role: true,
                        organization: {
                            select: { subscription_plan: true }
                        }
                    }
                })

                if (dbUser) {
                    console.log('[AUTH] DB User Found. Org ID:', dbUser.organization_id)
                    token.organizationId = dbUser.organization_id || undefined
                    token.role = dbUser.role || token.role
                    token.plan = dbUser.organization?.subscription_plan || 'basic'
                } else {
                    console.error('[AUTH] CRITICAL: User not found in DB during JWT refresh:', token.id)
                }
            }

            // Fetch Permissions if role is present and not yet loaded
            if (token.role && !token.permissions) {
                const rolePermissions = await prisma.role_permissions.findMany({
                    where: { role: token.role as string },
                    select: { permission_slug: true }
                })
                token.permissions = rolePermissions?.map((rp: { permission_slug: string }) => rp.permission_slug) || []
            }

            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string
                    ; (session.user as any).role = token.role || "user"
                    ; (session.user as any).organizationId = token.organizationId || ""
                    ; (session.user as any).permissions = token.permissions || []
                    ; (session.user as any).plan = token.plan || "basic"
            }
            return session
        },
    },
})
