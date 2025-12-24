'use server'

import { prisma } from '@/lib/db'
import { getCurrentUserWithRole } from '@/lib/session'
import { revalidatePath } from 'next/cache'

interface Coordinates {
    lat: number
    lng: number
    address?: string
}

interface CheckInParams {
    projectId?: string
    coords: Coordinates
}

interface CheckOutParams {
    entryId: string
    coords: Coordinates
}

// Haversine formula to calculate distance in meters
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lon2 - lon1) * Math.PI / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
}

const MAX_DISTANCE_METERS = 500

export async function checkIn({ projectId, coords }: CheckInParams) {
    try {
        const user = await getCurrentUserWithRole()
        if (!user) return { success: false, error: 'Unauthorized' }

        // Check if already active
        const activeEntry = await prisma.timeEntry.findFirst({
            where: {
                user_id: user.id,
                status: 'active'
            }
        })

        if (activeEntry) {
            return { success: false, error: 'Ya tienes un fichaje activo' }
        }

        let isVerified = false
        let verificationNotes = ''

        // Validate Location if Project ID provided
        if (projectId) {
            const project = await prisma.project.findUnique({
                where: { id: projectId }
            })

            const location = project?.location as { lat?: number; lng?: number } | null

            if (location?.lat && location?.lng) {
                const distance = calculateDistance(coords.lat, coords.lng, location.lat, location.lng)
                if (distance <= MAX_DISTANCE_METERS) {
                    isVerified = true
                    verificationNotes = `Verificado: a ${Math.round(distance)}m del proyecto.`
                } else {
                    verificationNotes = `Fuera de rango: a ${Math.round(distance)}m (Máx ${MAX_DISTANCE_METERS}m).`
                }
            } else {
                verificationNotes = 'Proyecto sin coordenadas para verificar.'
                isVerified = true
            }
        } else {
            isVerified = true
            verificationNotes = 'Fichaje general (sin proyecto).'
        }

        // Insert Entry
        await prisma.timeEntry.create({
            data: {
                user_id: user.id,
                project_id: projectId || null,
                clock_in: new Date(),
                lat_in: coords.lat,
                lng_in: coords.lng,
                address_in: coords.address,
                is_verified: isVerified,
                verification_notes: verificationNotes,
                status: 'active'
            }
        })

        revalidatePath('/dashboard/time-tracking')
        return { success: true }

    } catch (error: any) {
        console.error('CheckIn Error:', error)
        return { success: false, error: error.message }
    }
}

export async function checkOut({ entryId, coords }: CheckOutParams) {
    try {
        const user = await getCurrentUserWithRole()
        if (!user) return { success: false, error: 'Unauthorized' }

        // Get Entry
        const entry = await prisma.timeEntry.findUnique({
            where: { id: entryId }
        })

        if (!entry) return { success: false, error: 'Fichaje no encontrado' }
        if (entry.status !== 'active') return { success: false, error: 'Este fichaje ya está cerrado' }

        // Calculate time
        const clockIn = new Date(entry.clock_in)
        const clockOut = new Date()
        const diffMs = clockOut.getTime() - clockIn.getTime()
        const totalMinutes = Math.round(diffMs / 60000)

        // Update
        await prisma.timeEntry.update({
            where: { id: entryId },
            data: {
                clock_out: clockOut,
                lat_out: coords.lat,
                lng_out: coords.lng,
                address_out: coords.address,
                total_minutes: totalMinutes,
                status: 'completed'
            }
        })

        revalidatePath('/dashboard/time-tracking')
        return { success: true }

    } catch (error: any) {
        console.error('CheckOut Error:', error)
        return { success: false, error: error.message }
    }
}

export async function getActiveEntry() {
    const user = await getCurrentUserWithRole()
    if (!user) return null

    const data = await prisma.timeEntry.findFirst({
        where: {
            user_id: user.id,
            status: 'active'
        },
        include: {
            project: { select: { name: true } }
        }
    })

    return data
}

export async function getTimeHistory() {
    const user = await getCurrentUserWithRole()
    if (!user) return []

    const data = await prisma.timeEntry.findMany({
        where: { user_id: user.id },
        include: {
            project: { select: { name: true } }
        },
        orderBy: { clock_in: 'desc' },
        take: 50
    })

    return data
}

export async function getAdminTimeEntries(month?: string) {
    const user = await getCurrentUserWithRole()
    if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
        return []
    }

    const where: any = {}

    if (month) {
        const [y, m] = month.split('-')
        const startDate = new Date(parseInt(y), parseInt(m) - 1, 1)
        const endDate = new Date(parseInt(y), parseInt(m), 1)

        where.clock_in = {
            gte: startDate,
            lt: endDate
        }
    }

    const data = await prisma.timeEntry.findMany({
        where,
        include: {
            user: { select: { full_name: true, email: true } },
            project: { select: { name: true } }
        },
        orderBy: { clock_in: 'desc' }
    })

    return data
}
