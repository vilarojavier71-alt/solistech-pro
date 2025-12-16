/**
 * API Route: Time Entries Sync
 * Migrated to NextAuth + Prisma
 * Refactored to match actual Prisma schema (clock_in/clock_out model)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

interface SyncRequest {
    type: 'clock_in' | 'clock_out'
    data: {
        timestamp: string
        location: {
            latitude: number
            longitude: number
            accuracy: number
            address?: string
        } | null
        projectId?: string
    }
    offline_timestamp: string
    offline_id: string
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user) {
            return NextResponse.json(
                { error: 'No autenticado' },
                { status: 401 }
            )
        }

        const body: SyncRequest = await request.json()
        const { type, data, offline_id } = body

        if (!type || !data) {
            return NextResponse.json(
                { error: 'Datos incompletos' },
                { status: 400 }
            )
        }

        const timestamp = new Date(data.timestamp)

        if (type === 'clock_in') {
            // Check for open entry (already clocked in)
            const openEntry = await prisma.time_entries.findFirst({
                where: {
                    user_id: session.user.id,
                    clock_out: null
                }
            })

            if (openEntry) {
                return NextResponse.json({
                    success: false,
                    error: 'Ya tienes un fichaje abierto. Primero debes fichar salida.',
                    openEntry
                }, { status: 400 })
            }

            // Create new clock_in entry
            const newEntry = await prisma.time_entries.create({
                data: {
                    user_id: session.user.id,
                    project_id: data.projectId || null,
                    clock_in: timestamp,
                    lat_in: data.location?.latitude ? new Prisma.Decimal(data.location.latitude) : null,
                    lng_in: data.location?.longitude ? new Prisma.Decimal(data.location.longitude) : null,
                    address_in: data.location?.address || null,
                    status: 'active'
                }
            })

            return NextResponse.json({
                success: true,
                message: 'Entrada registrada correctamente',
                data: newEntry
            })

        } else if (type === 'clock_out') {
            // Find open entry to close
            const openEntry = await prisma.time_entries.findFirst({
                where: {
                    user_id: session.user.id,
                    clock_out: null
                }
            })

            if (!openEntry) {
                return NextResponse.json({
                    success: false,
                    error: 'No hay fichaje abierto para cerrar.'
                }, { status: 400 })
            }

            // Calculate total minutes
            const clockIn = new Date(openEntry.clock_in)
            const totalMinutes = Math.round((timestamp.getTime() - clockIn.getTime()) / 60000)

            // Update entry with clock_out
            const updatedEntry = await prisma.time_entries.update({
                where: { id: openEntry.id },
                data: {
                    clock_out: timestamp,
                    lat_out: data.location?.latitude ? new Prisma.Decimal(data.location.latitude) : null,
                    lng_out: data.location?.longitude ? new Prisma.Decimal(data.location.longitude) : null,
                    address_out: data.location?.address || null,
                    total_minutes: totalMinutes
                }
            })

            return NextResponse.json({
                success: true,
                message: `Salida registrada. Tiempo total: ${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`,
                data: updatedEntry
            })
        }

        return NextResponse.json({ error: 'Tipo de fichaje no válido' }, { status: 400 })

    } catch (error) {
        console.error('Error en sync endpoint:', error)
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Error desconocido',
                success: false
            },
            { status: 500 }
        )
    }
}

