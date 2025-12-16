
import { google } from 'googleapis'
import { createAdminClient } from '@/lib/supabase/admin'
import { encrypt, decrypt } from './encryption'

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'

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
        access_type: 'offline', // Crucial for refresh_token
        scope: SCOPES,
        prompt: 'consent', // Force consent to ensure refresh_token is returned
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

    const supabase = createAdminClient()

    // Upsert tokens
    const { error } = await supabase
        .from('gmail_tokens')
        .upsert({
            user_id: userId,
            access_token: encryptedAccess,
            refresh_token: encryptedRefresh,
            email,
            scope: tokens.scope || SCOPES.join(' '),
            expires_at: expiryDate,
            is_active: true,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

    if (error) throw error
}

export async function getGmailClient(userId: string) {
    const supabase = createAdminClient()

    // 1. Get tokens from DB
    const { data: tokenRecord, error } = await supabase
        .from('gmail_tokens')
        .select('*')
        .eq('user_id', userId)
        .single()

    if (error || !tokenRecord) {
        return { client: null, error: 'User has no connected Gmail account' }
    }

    const oauth2Client = getOAuth2Client()

    // 2. Decrypt
    try {
        const accessToken = decrypt(tokenRecord.access_token)
        const refreshToken = decrypt(tokenRecord.refresh_token)

        oauth2Client.setCredentials({
            access_token: accessToken,
            refresh_token: refreshToken,
            expiry_date: Number(tokenRecord.expires_at) // BigInt to Number
        })
    } catch (e) {
        return { client: null, error: 'Failed to decrypt credentials' }
    }

    // 3. Check and Refresh if needed
    // googleapis handles refresh automatically if refresh_token is present, 
    // but we want to intercept it to save the new access_token to DB

    // To do this properly, we can use the 'tokens' event or check manually.
    // Manual check:
    const isExpired = Date.now() >= (Number(tokenRecord.expires_at) - 60000) // 1 min buffer

    if (isExpired) {
        try {
            const { credentials } = await oauth2Client.refreshAccessToken()

            // Update DB with new encrypted access token
            // Note: refresh_token might not change, but if it does, update it too
            const newEncryptedAccess = encrypt(credentials.access_token!)

            const updates: any = {
                access_token: newEncryptedAccess,
                expires_at: credentials.expiry_date,
                updated_at: new Date().toISOString()
            }

            if (credentials.refresh_token) {
                updates.refresh_token = encrypt(credentials.refresh_token)
            }

            await supabase
                .from('gmail_tokens')
                .update(updates)
                .eq('user_id', userId)

        } catch (refreshError) {
            console.error('Failed to refresh token:', refreshError)
            return { client: null, error: 'Authentication expired (Refresh failed)' }
        }
    }

    return { client: google.gmail({ version: 'v1', auth: oauth2Client }), error: null }
}
