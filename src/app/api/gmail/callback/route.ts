
import { NextRequest, NextResponse } from 'next/server'
import { connectGmailAccount } from '@/lib/actions/gmail'

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    const baseUrl = process.env.NEXTAUTH_URL || 'https://motorgap.es'

    if (error) {
        return NextResponse.redirect(new URL(`/dashboard/mail?error=${error}`, baseUrl))
    }

    if (!code) {
        return NextResponse.redirect(new URL('/dashboard/mail?error=No_code_received', baseUrl))
    }

    const result = await connectGmailAccount(code)

    if (result.error) {
        return NextResponse.redirect(new URL(`/dashboard/mail?error=${encodeURIComponent(result.error)}`, baseUrl))
    }

    return NextResponse.redirect(new URL('/dashboard/mail?success=true', baseUrl))
}
