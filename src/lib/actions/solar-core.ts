'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { validateSpanishID, validateEmail } from '@/lib/validators/dni'
import { Prisma } from '@prisma/client'
import {
    SOLAR_PHASES,
    PAYMENT_STATUS,
    type CreateSaleInput,
    type ReconcilePaymentInput,
    type EngineerReviewInput
} from '@/lib/types/solar-core'

// ============================================================================
// FEATURE FLAG - Control de activación gradual
// ============================================================================

const IS_SOLAR_V2 = process.env.ENABLE_SOLAR_CORE_V2 === 'true'

// ============================================================================
// SOLAR SALES SERVICE
// ============================================================================

/**
 * Crea una nueva venta solar con validación estricta de DNI y Email
 * @requires Rol: comercial, admin, owner
 */
export async function createSolarSale(data: CreateSaleInput) {
    if (!IS_SOLAR_V2) {
        return { error: 'Solar Core V2 no está habilitado', code: 'FEATURE_DISABLED' }
    }

    const session = await auth()
    if (!session?.user?.id) {
        return { error: 'No autenticado', code: 'UNAUTHORIZED' }
    }

    // 1. Validar DNI (Módulo 23)
    const dniResult = validateSpanishID(data.clientDni)
    if (!dniResult.valid) {
        return {
            error: dniResult.error,
            code: 'INVALID_DNI',
            status: 400
        }
    }

    // 2. Validar Email (RFC 5322)
    const emailResult = validateEmail(data.clientEmail)
    if (!emailResult.valid) {
        return {
            error: emailResult.error,
            code: 'INVALID_EMAIL',
            status: 400
        }
    }

    // 3. Obtener organización del usuario
    const user = await prisma.User.findUnique({
        where: { id: session.user.id },
        select: { organization_id: true, role: true, department: true }
    })

    if (!user?.organization_id) {
        return { error: 'Usuario sin organización', code: 'NO_ORGANIZATION' }
    }

    // 4. Verificar permisos (comercial, admin, owner)
    const allowedRoles = ['owner', 'admin', 'comercial']
    const allowedDepts = ['comercial', 'ventas', 'sales']
    const hasPermission = allowedRoles.includes(user.role || '') ||
        allowedDepts.includes(user.department?.toLowerCase() || '')

    if (!hasPermission) {
        return { error: 'Sin permisos para crear ventas', code: 'FORBIDDEN', status: 403 }
    }

    try {
        // 5. Buscar o crear cliente
        let customer = await prisma.customers.findFirst({
            where: {
                nif: dniResult.normalized,
                organization_id: user.organization_id
            }
        })

        if (!customer) {
            customer = await prisma.customers.create({
                data: {
                    name: data.clientName,
                    email: emailResult.normalized,
                    nif: dniResult.normalized,
                    phone: data.clientPhone,
                    organization_id: user.organization_id,
                    created_by: session.user.id,
                }
            })
        }

        // 6. Crear proyecto con estado inicial
        const project = await prisma.projects.create({
            data: {
                name: data.projectName,
                description: data.projectDescription,
                installation_type: data.installationType,
                client_id: customer.id,
                organization_id: user.organization_id,
                created_by: session.user.id,
                // Solar Core fields
                solar_phase: SOLAR_PHASES.PHASE_0A,
                payment_status: PAYMENT_STATUS.PENDING,
                total_amount: new Prisma.Decimal(data.totalAmount),
            }
        })

        revalidatePath('/dashboard/projects')
        revalidatePath('/dashboard/solar')

        return {
            success: true,
            projectId: project.id,
            message: `Venta creada: ${project.name} - Fase ${SOLAR_PHASES.PHASE_0A}`
        }

    } catch (error) {
        console.error('[SolarCore] Error creating sale:', error)
        return { error: 'Error al crear la venta', code: 'DB_ERROR' }
    }
}

// ============================================================================
// FINANCE SERVICE - ACID Transactions
// ============================================================================

/**
 * Concilia un pago con bloqueo de fila (Pessimistic Locking)
 * @requires Rol: tesoreria, admin, owner
 * @critical Usa SELECT FOR UPDATE para evitar race conditions
 */
export async function reconcilePayment(data: ReconcilePaymentInput) {
    if (!IS_SOLAR_V2) {
        return { error: 'Solar Core V2 no está habilitado', code: 'FEATURE_DISABLED' }
    }

    const session = await auth()
    if (!session?.user?.id) {
        return { error: 'No autenticado', code: 'UNAUTHORIZED' }
    }

    // 1. Verificar permisos (tesoreria, admin, owner)
    const user = await prisma.User.findUnique({
        where: { id: session.user.id },
        select: { role: true, department: true, organization_id: true }
    })

    const allowedRoles = ['owner', 'admin', 'tesoreria']
    const allowedDepts = ['tesoreria', 'finanzas', 'finance', 'administracion']
    const hasPermission = allowedRoles.includes(user?.role || '') ||
        allowedDepts.includes(user?.department?.toLowerCase() || '')

    if (!hasPermission) {
        return { error: 'Solo Tesorería puede conciliar pagos', code: 'FORBIDDEN', status: 403 }
    }

    // 2. Validar monto
    if (data.amount <= 0) {
        return { error: 'El monto debe ser mayor a 0', code: 'INVALID_AMOUNT', status: 400 }
    }

    try {
        // 3. Transacción ACID con bloqueo pesimista
        const result = await prisma.$transaction(async (tx) => {
            // 3.1 Bloquear fila con SELECT FOR UPDATE
            const [lockedProject] = await tx.$queryRaw<{ id: string; payment_status: string }[]>`
                SELECT id, payment_status 
                FROM projects 
                WHERE id = ${data.projectId}::uuid 
                  AND organization_id = ${user!.organization_id}::uuid
                FOR UPDATE
            `

            if (!lockedProject) {
                throw new Error('PROYECTO_NO_ENCONTRADO')
            }

            if (lockedProject.payment_status === PAYMENT_STATUS.PAID) {
                throw new Error('PAGO_YA_PROCESADO')
            }

            // 3.2 Verificar que no exista transacción duplicada
            const existingTx = await tx.project_transactions.findUnique({
                where: { transaction_ref: data.transactionRef }
            })

            if (existingTx) {
                throw new Error('REFERENCIA_DUPLICADA')
            }

            // 3.3 Crear registro de transacción
            await tx.project_transactions.create({
                data: {
                    project_id: data.projectId,
                    amount: new Prisma.Decimal(data.amount),
                    transaction_ref: data.transactionRef,
                    payment_method: data.paymentMethod,
                    notes: data.notes,
                    processed_by: session.user.id,
                }
            })

            // 3.4 Actualizar estado del proyecto
            await tx.projects.update({
                where: { id: data.projectId },
                data: {
                    payment_status: PAYMENT_STATUS.PAID,
                    solar_phase: SOLAR_PHASES.PHASE_1_DOCS,
                    updated_at: new Date(),
                }
            })

            return { success: true }
        }, {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable
        })

        revalidatePath(`/dashboard/projects/${data.projectId}`)
        revalidatePath('/dashboard/finance')

        return {
            success: true,
            message: `Pago conciliado: ${data.amount}€ - Ref: ${data.transactionRef}`
        }

    } catch (error: any) {
        console.error('[SolarCore] Error reconciling payment:', error)

        const errorMessages: Record<string, string> = {
            'PROYECTO_NO_ENCONTRADO': 'Proyecto no encontrado',
            'PAGO_YA_PROCESADO': 'Este proyecto ya tiene el pago registrado',
            'REFERENCIA_DUPLICADA': 'Ya existe una transacción con esta referencia',
        }

        return {
            error: errorMessages[error.message] || 'Error al conciliar pago',
            code: error.message || 'DB_ERROR'
        }
    }
}

// ============================================================================
// ENGINEERING SERVICE - State Machine
// ============================================================================

/**
 * Registra la revisión de ingeniería con máquina de estados
 * @requires Rol: ingenieria, admin, owner
 */
export async function submitEngineerReview(data: EngineerReviewInput) {
    if (!IS_SOLAR_V2) {
        return { error: 'Solar Core V2 no está habilitado', code: 'FEATURE_DISABLED' }
    }

    const session = await auth()
    if (!session?.user?.id) {
        return { error: 'No autenticado', code: 'UNAUTHORIZED' }
    }

    // 1. Verificar permisos (ingenieria, admin, owner)
    const user = await prisma.User.findUnique({
        where: { id: session.user.id },
        select: { role: true, department: true, organization_id: true, full_name: true }
    })

    const allowedRoles = ['owner', 'admin', 'ingenieria']
    const allowedDepts = ['ingenieria', 'engineering', 'tecnico', 'instalaciones']
    const hasPermission = allowedRoles.includes(user?.role || '') ||
        allowedDepts.includes(user?.department?.toLowerCase() || '')

    if (!hasPermission) {
        return { error: 'Solo Ingeniería puede revisar proyectos', code: 'FORBIDDEN', status: 403 }
    }

    try {
        // 2. Obtener proyecto y validar estado previo
        const project = await prisma.projects.findFirst({
            where: {
                id: data.projectId,
                organization_id: user!.organization_id
            }
        })

        if (!project) {
            return { error: 'Proyecto no encontrado', code: 'NOT_FOUND' }
        }

        // 3. Validar que está en fase revisable
        const reviewablePhases = [SOLAR_PHASES.PHASE_1_DOCS, SOLAR_PHASES.PHASE_2_REVIEW, SOLAR_PHASES.CORRECTIONS]
        if (!reviewablePhases.includes(project.solar_phase as any)) {
            return {
                error: `Proyecto en fase ${project.solar_phase} no es revisable`,
                code: 'INVALID_STATE'
            }
        }

        // 4. Aplicar máquina de estados
        const newPhase = data.verdict === 'OK'
            ? SOLAR_PHASES.APPROVED
            : SOLAR_PHASES.CORRECTIONS

        const verdict = {
            verdict: data.verdict,
            reason: data.reason,
            reviewed_by: user!.full_name,
            reviewed_at: new Date().toISOString(),
        }

        await prisma.projects.update({
            where: { id: data.projectId },
            data: {
                solar_phase: newPhase,
                engineer_verdict: verdict,
                updated_at: new Date(),
            }
        })

        revalidatePath(`/dashboard/projects/${data.projectId}`)
        revalidatePath('/dashboard/engineering')

        return {
            success: true,
            message: data.verdict === 'OK'
                ? '✅ Proyecto aprobado por ingeniería'
                : `⚠️ Proyecto requiere correcciones: ${data.reason}`
        }

    } catch (error) {
        console.error('[SolarCore] Error submitting review:', error)
        return { error: 'Error al registrar revisión', code: 'DB_ERROR' }
    }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Obtener estado de un proyecto Solar
 */
export async function getSolarProjectStatus(projectId: string) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: 'No autenticado' }
    }

    const project = await prisma.projects.findUnique({
        where: { id: projectId },
        select: {
            id: true,
            name: true,
            solar_phase: true,
            payment_status: true,
            total_amount: true,
            engineer_verdict: true,
            transactions: {
                orderBy: { created_at: 'desc' },
                take: 5
            }
        }
    })

    return project ? { success: true, project } : { error: 'Proyecto no encontrado' }
}
