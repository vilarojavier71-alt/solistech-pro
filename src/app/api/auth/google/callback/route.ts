
import { connectGmailAccount } from '@/lib/actions/gmail'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
        return redirect(`/dashboard/mail?error=${error}`)
    }

    if (!code) {
        return redirect('/dashboard/mail?error=no_code')
    }

    const res = await connectGmailAccount(code)

    if (res.error) {
        return redirect(`/dashboard/mail?error=${encodeURIComponent(res.error)}`)
    }

    return redirect('/dashboard/mail?success=true')
}
