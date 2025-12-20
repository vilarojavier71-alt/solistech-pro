
import { NextRequest, NextResponse } from 'next/server'
import { connectGmailAccount } from '@/lib/actions/gmail'

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
        return NextResponse.redirect(new URL(`/dashboard/mail?error=${error}`, req.url))
    }

    if (!code) {
        return NextResponse.redirect(new URL('/dashboard/mail?error=No_code_received', req.url))
    }

    const result = await connectGmailAccount(code)

    if (result.error) {
        return NextResponse.redirect(new URL(`/dashboard/mail?error=${encodeURIComponent(result.error)}`, req.url))
    }

    return NextResponse.redirect(new URL('/dashboard/mail?success=true', req.url))
}
