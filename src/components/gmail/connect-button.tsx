'use client'

import { useState } from 'react'
import { getGmailAuthUrl } from '@/lib/actions/gmail'
import { Button } from '@/components/ui/button'
import { Mail } from 'lucide-react'

export function ConnectGmailButton() {
    const [loading, setLoading] = useState(false)

    const handleConnect = async () => {
        setLoading(true)
        const res = await getGmailAuthUrl()
        if (res.url) {
            window.location.href = res.url
        } else {
            alert('Error al iniciar conexión')
            setLoading(false)
        }
    }

    return (
        <Button onClick={handleConnect} disabled={loading} className="gap-2">
            <Mail className="h-4 w-4" />
            {loading ? 'Conectando...' : 'Conectar Gmail'}
        </Button>
    )
}
