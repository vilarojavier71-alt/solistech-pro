
import { google } from 'googleapis'
import { prisma } from '@/lib/db'
import { encrypt, decrypt } from './encryption'

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/gmail/callback`

if (!CLIENT_ID || !CLIENT_SECRET) {
    console.warn('Missing Google OAuth Credentials in environment variables.')
}

const SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/userinfo.email'
]

export function getOAuth2Client() {
    return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)
}

export function generateAuthUrl(state?: string) {
    const oauth2Client = getOAuth2Client()
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent',
        state
    })
}

export async function storeTokens(userId: string, tokens: any, email: string) {
    if (!tokens.access_token || !tokens.refresh_token) {
        throw new Error('Incomplete tokens received from Google')
    }

    const encryptedAccess = encrypt(tokens.access_token)
    const encryptedRefresh = encrypt(tokens.refresh_token)
    const expiryDate = tokens.expiry_date || Date.now() + 3500 * 1000

    await prisma.gmail_tokens.upsert({
        where: { user_id: userId },
        update: {
            access_token: encryptedAccess,
            refresh_token: encryptedRefresh,
            email,
            scope: tokens.scope || SCOPES.join(' '),
            expires_at: expiryDate,
            is_active: true,
            updated_at: new Date()
        },
        create: {
            user_id: userId,
            access_token: encryptedAccess,
            refresh_token: encryptedRefresh,
            email,
            scope: tokens.scope || SCOPES.join(' '),
            expires_at: expiryDate,
            is_active: true
        }
    })
}

export async function getGmailClient(userId: string) {
    const tokenRecord = await prisma.gmail_tokens.findUnique({
        where: { user_id: userId }
    })

    if (!tokenRecord) {
        return { client: null, error: 'User has no connected Gmail account' }
    }

    const oauth2Client = getOAuth2Client()

    try {
        const accessToken = decrypt(tokenRecord.access_token)
        const refreshToken = decrypt(tokenRecord.refresh_token)

        oauth2Client.setCredentials({
            access_token: accessToken,
            refresh_token: refreshToken,
            expiry_date: Number(tokenRecord.expires_at)
        })
    } catch (e) {
        return { client: null, error: 'Failed to decrypt credentials' }
    }

    const isExpired = Date.now() >= (Number(tokenRecord.expires_at) - 60000)

    if (isExpired) {
        try {
            const { credentials } = await oauth2Client.refreshAccessToken()
            const newEncryptedAccess = encrypt(credentials.access_token!)

            await prisma.gmail_tokens.update({
                where: { user_id: userId },
                data: {
                    access_token: newEncryptedAccess,
                    expires_at: credentials.expiry_date || Date.now() + 3500 * 1000,
                    updated_at: new Date(),
                    ...(credentials.refresh_token && { refresh_token: encrypt(credentials.refresh_token) })
                }
            })
        } catch (refreshError) {
            console.error('Failed to refresh token:', refreshError)
            return { client: null, error: 'Authentication expired (Refresh failed)' }
        }
    }

    return { client: google.gmail({ version: 'v1', auth: oauth2Client }), error: null }
}
