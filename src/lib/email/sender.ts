import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface EmailPayload {
    to: string
    subject: string
    html: string
}

export async function sendEmail({ to, subject, html }: EmailPayload) {
    // Modo Simulación si no hay API Key o estamos en desarrollo local puro sin configurar
    if (!process.env.RESEND_API_KEY) {
        console.log(`[📧 MOCK EMAIL] To: ${to} | Subject: ${subject}`)
        console.log(`[📧 MOCK CONTENT] ${html.substring(0, 50)}...`)
        return { success: true, id: 'mock-id' }
    }

    try {
        const data = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'MotorGap <no-reply@motorgap.es>',
            to: [to],
            subject: subject,
            html: html,
        })

        return { success: true, data }
    } catch (error) {
        console.error('Error sending email:', error)
        return { success: false, error }
    }
}
