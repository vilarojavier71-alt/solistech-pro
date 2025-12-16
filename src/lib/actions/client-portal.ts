'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { INSTALLATION_PHASES, LEGALIZATION_STATUS } from '@/lib/types/solar-core'

// ============================================================================
// ACCIONES DE CONSULTA (CLIENTE)
// ============================================================================

/**
 * Obtener estado del proyecto para el cliente
 * Solo devuelve datos si el usuario es el cliente asociado
 */
export async function getClientProjectStatus(projectId: string) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: 'No autenticado' }
    }

    try {
        // Buscar proyecto y verificar que el cliente esté asociado
        const project = await prisma.projects.findFirst({
            where: {
                id: projectId,
                client_portal_enabled: true,
                customer: {
                    // El email del cliente coincide con el usuario logueado
                    email: session.user.email
                }
            },
            include: {
                customer: {
                    select: { name: true, email: true, phone: true }
                },
                organization: {
                    select: { name: true, phone: true, email: true }
                },
                assigned_technician: {
                    select: { full_name: true, email: true }
                }
            }
        })

        if (!project) {
            return { error: 'Proyecto no encontrado o sin acceso' }
        }

        return {
            success: true,
            project: {
                id: project.id,
                name: project.name,
                installation_type: project.installation_type,
                system_size_kwp: project.system_size_kwp,
                estimated_production_kwh: project.estimated_production_kwh,
                estimated_savings: project.estimated_savings,
                installation_phase: project.installation_phase,
                legalization_status: project.legalization_status,
                installation_date: project.installation_date,
                activation_date: project.activation_date,
                expected_completion: project.expected_completion,
                phase_notes: project.phase_notes,
                customer: project.customer,
                organization: project.organization,
                technician: project.assigned_technician,
            }
        }
    } catch (error) {
        console.error('[ClientPortal] Error fetching project:', error)
        return { error: 'Error al obtener el proyecto' }
    }
}

/**
 * Obtener todos los proyectos del cliente logueado
 */
export async function getClientProjects() {
    const session = await auth()
    if (!session?.user?.email) {
        return { error: 'No autenticado' }
    }

    try {
        const projects = await prisma.projects.findMany({
            where: {
                client_portal_enabled: true,
                customer: {
                    email: session.user.email
                }
            },
            select: {
                id: true,
                name: true,
                installation_phase: true,
                legalization_status: true,
                expected_completion: true,
                system_size_kwp: true,
            },
            orderBy: { created_at: 'desc' }
        })

        return { success: true, projects }
    } catch (error) {
        console.error('[ClientPortal] Error fetching projects:', error)
        return { error: 'Error al obtener proyectos' }
    }
}

/**
 * Obtener historial de fases del proyecto
 */
export async function getProjectPhaseHistory(projectId: string) {
    const session = await auth()
    if (!session?.user?.email) {
        return { error: 'No autenticado' }
    }

    try {
        // Verificar acceso del cliente
        const project = await prisma.projects.findFirst({
            where: {
                id: projectId,
                client_portal_enabled: true,
                customer: { email: session.user.email }
            }
        })

        if (!project) {
            return { error: 'Sin acceso al proyecto' }
        }

        const history = await prisma.project_phase_history.findMany({
            where: { project_id: projectId },
            include: {
                user: { select: { full_name: true } }
            },
            orderBy: { created_at: 'desc' },
            take: 20
        })

        return { success: true, history }
    } catch (error) {
        console.error('[ClientPortal] Error fetching history:', error)
        return { error: 'Error al obtener historial' }
    }
}

// ============================================================================
// ACCIONES DE GESTIÓN (EMPLEADOS/ADMIN)
// ============================================================================

/**
 * Actualizar fase de instalación de un proyecto
 * Solo para empleados con permisos de gestión
 */
export async function updateProjectPhase(
    projectId: string,
    newPhase: number,
    notes?: string
) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: 'No autenticado' }
    }

    // Verificar que el usuario tiene rol de gestión
    const user = await prisma.users.findUnique({
        where: { id: session.user.id },
        select: { role: true, organization_id: true }
    })

    if (!user || !['owner', 'admin', 'employee'].includes(user.role || '')) {
        return { error: 'Sin permisos para esta acción' }
    }

    try {
        // Obtener proyecto actual
        const project = await prisma.projects.findFirst({
            where: {
                id: projectId,
                organization_id: user.organization_id
            }
        })

        if (!project) {
            return { error: 'Proyecto no encontrado' }
        }

        // Actualizar fase y registrar historial
        await prisma.$transaction([
            // Actualizar proyecto
            prisma.projects.update({
                where: { id: projectId },
                data: {
                    installation_phase: newPhase,
                    phase_notes: notes,
                    updated_at: new Date(),
                    // Auto-set fechas si corresponde
                    ...(newPhase === 5 && !project.installation_date && { installation_date: new Date() }),
                    ...(newPhase === 7 && !project.activation_date && { activation_date: new Date() }),
                }
            }),
            // Registrar historial
            prisma.project_phase_history.create({
                data: {
                    project_id: projectId,
                    from_phase: project.installation_phase,
                    to_phase: newPhase,
                    changed_by: session.user.id,
                    notes: notes
                }
            })
        ])

        revalidatePath(`/dashboard/projects/${projectId}`)
        revalidatePath('/dashboard/client')

        return {
            success: true,
            message: `Proyecto actualizado a fase ${newPhase}: ${INSTALLATION_PHASES[newPhase]?.name}`
        }
    } catch (error) {
        console.error('[ClientPortal] Error updating phase:', error)
        return { error: 'Error al actualizar fase' }
    }
}

/**
 * Habilitar/deshabilitar portal cliente para un proyecto
 */
export async function toggleClientPortal(projectId: string, enabled: boolean) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: 'No autenticado' }
    }

    const user = await prisma.users.findUnique({
        where: { id: session.user.id },
        select: { role: true, organization_id: true }
    })

    if (!user || !['owner', 'admin'].includes(user.role || '')) {
        return { error: 'Sin permisos para esta acción' }
    }

    try {
        await prisma.projects.update({
            where: { id: projectId },
            data: {
                client_portal_enabled: enabled,
                // Generar token si se habilita
                ...(enabled && { client_access_token: crypto.randomUUID() })
            }
        })

        revalidatePath(`/dashboard/projects/${projectId}`)
        return { success: true, message: enabled ? 'Portal cliente activado' : 'Portal cliente desactivado' }
    } catch (error) {
        console.error('[ClientPortal] Error toggling portal:', error)
        return { error: 'Error al cambiar estado del portal' }
    }
}

/**
 * Actualizar estado de legalización
 */
export async function updateLegalizationStatus(
    projectId: string,
    status: 'pending' | 'in_progress' | 'approved' | 'rejected'
) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: 'No autenticado' }
    }

    try {
        await prisma.projects.update({
            where: { id: projectId },
            data: { legalization_status: status }
        })

        revalidatePath(`/dashboard/projects/${projectId}`)
        revalidatePath('/dashboard/client')

        return { success: true, message: `Estado de legalización: ${LEGALIZATION_STATUS[status]}` }
    } catch (error) {
        console.error('[ClientPortal] Error updating legalization:', error)
        return { error: 'Error al actualizar legalización' }
    }
}

// ============================================================================
// GESTIÓN DE DOCUMENTOS (Fase 3 - Document Upload Pipeline)
// ============================================================================

/**
 * Subir documento del cliente
 * @param projectId ID del proyecto
 * @param type Tipo de documento (DNI, FACTURA_LUZ, CONTRATO, CIE)
 * @param fileUrl URL del archivo subido a storage
 * @param fileName Nombre original del archivo
 */
export async function uploadDocument(
    projectId: string,
    type: string,
    fileUrl: string,
    fileName: string
) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: 'No autenticado' }
    }

    try {
        // Verificar que el proyecto existe y es accesible
        const project = await prisma.projects.findFirst({
            where: {
                id: projectId,
                customer: { email: session.user.email }
            }
        })

        if (!project) {
            return { error: 'Proyecto no encontrado o sin acceso' }
        }

        // Buscar documento existente del mismo tipo
        const existingDoc = await prisma.project_documents.findFirst({
            where: {
                project_id: projectId,
                type: type
            }
        })

        if (existingDoc) {
            // Actualizar documento existente (re-upload después de rechazo)
            await prisma.project_documents.update({
                where: { id: existingDoc.id },
                data: {
                    url: fileUrl,
                    file_name: fileName,
                    status: 'UPLOADED',
                    rejection_reason: null,
                    uploaded_by: session.user.id,
                    uploaded_at: new Date(),
                    reviewed_by: null,
                    reviewed_at: null,
                }
            })
        } else {
            // Crear nuevo documento
            await prisma.project_documents.create({
                data: {
                    project_id: projectId,
                    type: type,
                    status: 'UPLOADED',
                    url: fileUrl,
                    file_name: fileName,
                    uploaded_by: session.user.id,
                    uploaded_at: new Date(),
                }
            })
        }

        revalidatePath(`/dashboard/client`)
        revalidatePath(`/dashboard/projects/${projectId}`)

        return { success: true, message: `Documento ${type} subido correctamente` }
    } catch (error) {
        console.error('[ClientPortal] Error uploading document:', error)
        return { error: 'Error al subir documento' }
    }
}

/**
 * Aprobar documento (solo staff)
 */
export async function approveDocument(documentId: string) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: 'No autenticado' }
    }

    // Verificar que es staff
    const user = await prisma.users.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })

    if (!user || !['owner', 'admin', 'employee'].includes(user.role || '')) {
        return { error: 'Sin permisos para aprobar documentos' }
    }

    try {
        await prisma.project_documents.update({
            where: { id: documentId },
            data: {
                status: 'APPROVED',
                reviewed_by: session.user.id,
                reviewed_at: new Date(),
                rejection_reason: null,
            }
        })

        revalidatePath('/dashboard/client')
        return { success: true, message: 'Documento aprobado' }
    } catch (error) {
        console.error('[ClientPortal] Error approving document:', error)
        return { error: 'Error al aprobar documento' }
    }
}

/**
 * Rechazar documento con motivo (solo staff)
 */
export async function rejectDocument(documentId: string, reason: string) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: 'No autenticado' }
    }

    // Verificar que es staff
    const user = await prisma.users.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })

    if (!user || !['owner', 'admin', 'employee'].includes(user.role || '')) {
        return { error: 'Sin permisos para rechazar documentos' }
    }

    if (!reason || reason.trim().length < 5) {
        return { error: 'El motivo de rechazo es obligatorio (mínimo 5 caracteres)' }
    }

    try {
        const doc = await prisma.project_documents.update({
            where: { id: documentId },
            data: {
                status: 'REJECTED',
                rejection_reason: reason.trim(),
                reviewed_by: session.user.id,
                reviewed_at: new Date(),
            },
            include: { project: { select: { id: true } } }
        })

        revalidatePath('/dashboard/client')
        revalidatePath(`/dashboard/projects/${doc.project.id}`)

        return { success: true, message: 'Documento rechazado. El cliente será notificado.' }
    } catch (error) {
        console.error('[ClientPortal] Error rejecting document:', error)
        return { error: 'Error al rechazar documento' }
    }
}

/**
 * Obtener documentos de un proyecto
 */
export async function getProjectDocuments(projectId: string) {
    const session = await auth()
    if (!session?.user?.email) {
        return { error: 'No autenticado' }
    }

    try {
        const documents = await prisma.project_documents.findMany({
            where: { project_id: projectId },
            orderBy: { created_at: 'desc' }
        })

        return { success: true, documents }
    } catch (error) {
        console.error('[ClientPortal] Error fetching documents:', error)
        return { error: 'Error al obtener documentos' }
    }
}

