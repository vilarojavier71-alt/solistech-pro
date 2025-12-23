import { NextRequest, NextResponse } from 'next/server'
import { geocodeAddress, searchCadastreByCoordinates } from '@/lib/actions/catastro'
import { auditLogAction } from '@/lib/audit/audit-logger'
import { auth } from '@/lib/auth'

type LookupMode = 'address' | 'rc'

interface AddressPayload {
  query: string
}

interface RCPayload {
  rc: string
}

function invalid(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status })
}

async function logAudit(userId: string, payload: Record<string, unknown>) {
  await auditLogAction(
    'security.breach.attempt',
    userId,
    'catastro',
    'lookup',
    'CATASTRO_QUERY',
    { metadata: { ...payload, pii: false } }
  )
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return invalid('No autenticado', 401)

  const body = await req.json().catch(() => null)
  if (!body) return invalid('Payload inválido')

  const mode: LookupMode = body.mode
  if (mode === 'address') {
    const payload = body.payload as AddressPayload
    if (!payload?.query) return invalid('Dirección requerida')

    const geo = await geocodeAddress(payload.query)
    if (!geo.success || !geo.data) return invalid(geo.message || 'No se pudo geocodificar', 404)

    const { lat, lng } = geo.data
    const result = await searchCadastreByCoordinates(lat, lng, payload.query)
    await logAudit(session.user.id, { mode, rc: result?.data?.rc })

    return NextResponse.json(result)
  }

  if (mode === 'rc') {
    const payload = body.payload as RCPayload
    if (!payload?.rc || payload.rc.length < 14) return invalid('RC inválida')
    await logAudit(session.user.id, { mode, rc: payload.rc.slice(0, 4) + '***' })
    return NextResponse.json({ success: true, data: { rc: payload.rc } })
  }

  return invalid('Modo no soportado')
}

