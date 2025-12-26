import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Obtener lista de solicitudes de subvención
export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { organization_id: true }
        })

        if (!user?.organization_id) {
            return NextResponse.json({ applications: [] })
        }

        const applications = await prisma.subsidyApplication.findMany({
            where: { organization_id: user.organization_id },
            include: {
                customer: {
                    select: { id: true, name: true, email: true, phone: true }
                }
            },
            orderBy: { created_at: 'desc' }
        })

        return NextResponse.json({ applications })
    } catch (error) {
        console.error('Error fetching subsidy applications:', error)
        return NextResponse.json(
            { error: 'Error al obtener solicitudes' },
            { status: 500 }
        )
    }
}

// POST - Crear nueva solicitud de subvención
export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { organization_id: true }
        })

        if (!user?.organization_id) {
            return NextResponse.json(
                { error: 'Organización no encontrada' },
                { status: 400 }
            )
        }

        const body = await request.json()
        const {
            customer_id,
            subsidy_type,
            region,
            province,
            municipality,
            estimated_amount,
            project_cost,
            submission_deadline,
            notes
        } = body

        if (!customer_id || !region) {
            return NextResponse.json(
                { error: 'Cliente y región son requeridos' },
                { status: 400 }
            )
        }

        // Generar número de expediente único
        const year = new Date().getFullYear()
        const count = await prisma.subsidyApplication.count({
            where: { organization_id: user.organization_id }
        })
        const application_number = `SUB-${year}-${String(count + 1).padStart(4, '0')}`

        // Documentos requeridos por defecto según tipo de subvención
        const defaultDocs = getRequiredDocs(subsidy_type)

        const application = await prisma.subsidyApplication.create({
            data: {
                organization_id: user.organization_id,
                customer_id,
                created_by: session.user.id,
                application_number,
                subsidy_type: subsidy_type || 'ibi',
                region,
                province,
                municipality,
                estimated_amount: estimated_amount ? parseFloat(estimated_amount) : null,
                project_cost: project_cost ? parseFloat(project_cost) : null,
                submission_deadline: submission_deadline ? new Date(submission_deadline) : null,
                notes,
                required_docs: defaultDocs,
                status: 'collecting_docs'
            },
            include: {
                customer: {
                    select: { id: true, name: true, email: true }
                }
            }
        })

        return NextResponse.json({ application })
    } catch (error) {
        console.error('Error creating subsidy application:', error)
        return NextResponse.json(
            { error: 'Error al crear solicitud' },
            { status: 500 }
        )
    }
}

// Documentos requeridos según tipo de subvención
function getRequiredDocs(subsidyType: string) {
    const baseDocs = [
        { name: 'DNI/NIE del titular', uploaded: false, file_url: null },
        { name: 'Factura de la instalación', uploaded: false, file_url: null },
        { name: 'Certificado de instalación', uploaded: false, file_url: null }
    ]

    switch (subsidyType) {
        case 'ibi':
            return [
                ...baseDocs,
                { name: 'Recibo del IBI', uploaded: false, file_url: null },
                { name: 'Solicitud de bonificación', uploaded: false, file_url: null }
            ]
        case 'icio':
            return [
                ...baseDocs,
                { name: 'Licencia de obra', uploaded: false, file_url: null },
                { name: 'Proyecto técnico', uploaded: false, file_url: null }
            ]
        case 'irpf':
            return [
                ...baseDocs,
                { name: 'Certificado energético previo', uploaded: false, file_url: null },
                { name: 'Certificado energético posterior', uploaded: false, file_url: null }
            ]
        default:
            return baseDocs
    }
}
