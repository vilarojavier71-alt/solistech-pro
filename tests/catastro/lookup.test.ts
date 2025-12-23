import { describe, expect, it, jest } from '@jest/globals'
import { POST } from '@/app/api/catastro/lookup/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/actions/catastro', () => ({
  geocodeAddress: jest.fn(async () => ({ success: true, data: { lat: 1, lng: 2 } })),
  searchCadastreByCoordinates: jest.fn(async () => ({ success: true, data: { rc: '123', address: 'A', city: 'C' }, source: 'test' }))
}))

jest.mock('@/lib/audit/audit-logger', () => ({
  auditLogAction: jest.fn(async () => Promise.resolve())
}))

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(async () => ({ user: { id: 'u1' } }))
}))

function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/catastro/lookup', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' }
  })
}

describe('Catastro lookup API', () => {
  it('returns 401 if not authenticated', async () => {
    const { auth } = await import('@/lib/auth')
    ;(auth as jest.Mock).mockResolvedValueOnce(null)
    const res = await POST(makeReq({ mode: 'address', payload: { query: 'x' } }))
    expect(res.status).toBe(401)
  })

  it('validates address payload', async () => {
    const res = await POST(makeReq({ mode: 'address', payload: {} }))
    expect(res.status).toBe(400)
  })

  it('returns success for address mode', async () => {
    const res = await POST(makeReq({ mode: 'address', payload: { query: 'calle' } }))
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.data.rc).toBe('123')
  })

  it('returns error for invalid rc', async () => {
    const res = await POST(makeReq({ mode: 'rc', payload: { rc: '123' } }))
    expect(res.status).toBe(400)
  })
})

