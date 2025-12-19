
import { getGmailStatus } from '@/lib/actions/gmail'
import { ConnectGmailButton } from '@/components/gmail/connect-button'
import { InboxList } from '@/components/gmail/inbox-list'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Info } from 'lucide-react'

export default async function MailPage({ searchParams }: { searchParams: { error?: string, success?: string } }) {
    console.log('[MAIL DEBUG] Rendering MailPage')
    let isConnected = false
    let email: string | undefined

    try {
        const status = await getGmailStatus()
        console.log('[MAIL DEBUG] getGmailStatus result:', status)
        isConnected = status.isConnected
        email = status.email
    } catch (e: any) {
        console.error('[MAIL DEBUG] CRITICAL: getGmailStatus threw error:', e)
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Buzón Gmail</h2>
            </div>

            {searchParams.error && (
                <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{searchParams.error}</AlertDescription>
                </Alert>
            )}

            {searchParams.success && (
                <Alert className="text-green-600 border-green-200 bg-green-50">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Conectado</AlertTitle>
                    <AlertDescription>Su cuenta de Gmail se ha vinculado correctamente.</AlertDescription>
                </Alert>
            )}

            {!isConnected ? (
                <Card className="max-w-md mx-auto mt-10">
                    <CardHeader>
                        <CardTitle>Conectar Gmail</CardTitle>
                        <CardDescription>
                            Vincule su cuenta de Google Workspace para gestionar sus correos desde aquí.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center py-6">
                        <ConnectGmailButton />
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg">
                        <span className="text-sm font-medium">Conectado como: {email}</span>
                        {/* Disconnect button could go here */}
                    </div>
                    <InboxList />
                </div>
            )}
        </div>
    )
}
