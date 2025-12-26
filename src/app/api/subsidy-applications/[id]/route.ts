import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface Params {
    params: { id: string }
}

// GET - Obtener una solicitud específica
export async function GET(request: NextRequest, { params }: Params) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
        }

        const application = await prisma.subsidyApplication.findUnique({
            where: { id: params.id },
            include: {
                customer: {
                    select: { id: true, name: true, email: true, phone: true, address: true }
                }
            }
        })

        if (!application) {
            return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
        }

        return NextResponse.json({ application })
    } catch (error) {
        console.error('Error fetching subsidy application:', error)
        return NextResponse.json(
            { error: 'Error al obtener solicitud' },
            { status: 500 }
        )
    }
}

// PATCH - Actualizar solicitud (status, documentos, etc.)
export async function PATCH(request: NextRequest, { params }: Params) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
        }

        const body = await request.json()
        const {
            status,
            estimated_amount,
            approved_amount,
            submission_deadline,
            required_docs,
            notes,
            rejection_reason
        } = body

        // Construir datos de actualización dinámicamente
        const updateData: Record<string, any> = { updated_at: new Date() }

        if (status) {
            updateData.status = status
            // Actualizar fechas según el status
            if (status === 'submitted') updateData.submitted_at = new Date()
            if (status === 'approved') updateData.approved_at = new Date()
            if (status === 'rejected') updateData.rejected_at = new Date()
        }

        if (estimated_amount !== undefined) updateData.estimated_amount = parseFloat(estimated_amount)
        if (approved_amount !== undefined) updateData.approved_amount = parseFloat(approved_amount)
        if (submission_deadline) updateData.submission_deadline = new Date(submission_deadline)
        if (required_docs) updateData.required_docs = required_docs
        if (notes !== undefined) updateData.notes = notes
        if (rejection_reason !== undefined) updateData.rejection_reason = rejection_reason

        const application = await prisma.subsidyApplication.update({
            where: { id: params.id },
            data: updateData,
            include: {
                customer: {
                    select: { id: true, name: true, email: true }
                }
            }
        })

        return NextResponse.json({ application })
    } catch (error) {
        console.error('Error updating subsidy application:', error)
        return NextResponse.json(
            { error: 'Error al actualizar solicitud' },
            { status: 500 }
        )
    }
}

// DELETE - Eliminar solicitud
export async function DELETE(request: NextRequest, { params }: Params) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
        }

        await prisma.subsidyApplication.delete({
            where: { id: params.id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting subsidy application:', error)
        return NextResponse.json(
            { error: 'Error al eliminar solicitud' },
            { status: 500 }
        )
    }
}
