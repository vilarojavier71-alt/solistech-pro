
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

// Use a secure key from env or fallback for dev (Use ENV in production!)
const ALGORITHM = 'aes-256-gcm'
const ENCRYPTION_KEY = process.env.GMAIL_ENCRYPTION_KEY || '01234567890123456789012345678901' // 32 chars
const IV_LENGTH = 16

export function encrypt(text: string): string {
    const iv = randomBytes(IV_LENGTH)
    const cipher = createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv)
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    const authTag = cipher.getAuthTag().toString('hex')

    // Format: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag}:${encrypted}`
}

export function decrypt(text: string): string {
    const textParts = text.split(':')
    if (textParts.length !== 3) throw new Error('Invalid encrypted string format')

    const iv = Buffer.from(textParts[0], 'hex')
    const authTag = Buffer.from(textParts[1], 'hex')
    const encryptedText = textParts[2]

    const decipher = createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
}
