/**
 * Auth Callback Route
 * 
 * This was previously used for Supabase OAuth callbacks.
 * With NextAuth, OAuth callbacks are handled by /api/auth/[...nextauth]/route.ts
 * 
 * This route now just redirects to the appropriate location.
 */

import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const next = searchParams.get('next') ?? '/dashboard'

    // NextAuth handles OAuth callbacks at /api/auth/callback/[provider]
    // This legacy route just redirects to dashboard or specified next URL
    const isLocalEnv = process.env.NODE_ENV === 'development'
    const forwardedHost = request.headers.get('x-forwarded-host')

    if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
    } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
    } else {
        return NextResponse.redirect(`${origin}${next}`)
    }
}
