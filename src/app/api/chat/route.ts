import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { mapSolarPhaseToUI } from '@/lib/utils/solar-status-mapper'

// ============================================================================
// RATE LIMITER (En memoria - para producción usar Redis/Upstash)
// ============================================================================

const RATE_LIMIT = {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 10, // 10 requests por minuto por usuario
}

const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
    const now = Date.now()
    const userLimit = rateLimitStore.get(userId)

    if (!userLimit || now > userLimit.resetAt) {
        rateLimitStore.set(userId, { count: 1, resetAt: now + RATE_LIMIT.windowMs })
        return { allowed: true, remaining: RATE_LIMIT.maxRequests - 1 }
    }

    if (userLimit.count >= RATE_LIMIT.maxRequests) {
        return { allowed: false, remaining: 0 }
    }

    userLimit.count++
    return { allowed: true, remaining: RATE_LIMIT.maxRequests - userLimit.count }
}

// Limpieza periódica del store (evitar memory leak)
setInterval(() => {
    const now = Date.now()
    for (const [key, value] of rateLimitStore.entries()) {
        if (now > value.resetAt) {
            rateLimitStore.delete(key)
        }
    }
}, 60000) // Limpiar cada minuto

// ============================================================================
// SOLAR ASSISTANT - AI Chat Endpoint
// Powered by OpenAI (o proveedor configurado)
// ============================================================================

const SYSTEM_PROMPT = `Eres un asistente experto en energía solar de MotorGap.
Tu tono es profesional, empático y resolutivo.

REGLAS:
- Solo respondes preguntas sobre instalación solar, trámites y documentación.
- Si no sabes algo, deriva al humano diciendo "Te conecto con un asesor".
- Responde en español, de forma breve y clara.
- Si el cliente tiene documentos rechazados, explica amablemente qué corregir.
- Usa emojis ocasionalmente para ser más cercano (☀️ ⚡ 📄).

CONTEXTO DEL PROYECTO:
{PROJECT_CONTEXT}
`

// Tool definitions para function calling
const TOOLS = {
    getProjectStatus: {
        name: 'getProjectStatus',
        description: 'Obtiene el estado actual del proyecto solar del cliente',
        parameters: {}
    },
    explainPhase: {
        name: 'explainPhase',
        description: 'Explica qué significa una fase específica del proyecto',
        parameters: {
            phase: { type: 'string', description: 'Código de la fase (ej: PHASE_1_DOCS)' }
        }
    }
}

// Base de conocimiento de fases
const PHASE_EXPLANATIONS: Record<string, string> = {
    'DRAFT': 'Tu proyecto está siendo preparado. Pronto recibirás el presupuesto personalizado.',
    'PHASE_0A': '¡Venta confirmada! Tu proyecto solar ha sido registrado correctamente.',
    'PHASE_0B': 'Estamos validando tu pago. Este proceso puede tardar 1-2 días hábiles.',
    'PHASE_1_DOCS': 'Necesitamos documentación: DNI, factura de luz y contrato firmado.',
    'PHASE_2_REVIEW': 'Nuestro equipo técnico está analizando tu proyecto. Tiempo estimado: 3-5 días.',
    'CORRECTIONS': 'Algunos documentos necesitan corrección. Revisa los comentarios y vuelve a subirlos.',
    'APPROVED': '¡Proyecto aprobado! Estamos coordinando la fecha de instalación.',
    'COMPLETED': '¡Felicidades! Tu sistema solar está operativo. ¡Bienvenido a la energía limpia!',
}

export async function POST(request: NextRequest) {
    try {
        // 1. Verificar autenticación
        const session = await auth()
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
        }

        // 2. Verificar Rate Limit
        const { allowed, remaining } = checkRateLimit(session.user.id || session.user.email)
        if (!allowed) {
            return NextResponse.json(
                { error: 'Demasiadas solicitudes. Por favor espera un momento.' },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Remaining': '0',
                        'Retry-After': '60'
                    }
                }
            )
        }

        const { messages } = await request.json()
        const userMessage = messages[messages.length - 1]?.content || ''

        // 2. Obtener contexto del proyecto del usuario
        const projectContext = await getProjectContext(session.user.email)

        // 3. Generar respuesta (simulada sin SDK por ahora)
        const response = await generateResponse(userMessage, projectContext)

        return NextResponse.json({
            role: 'assistant',
            content: response
        })

    } catch (error) {
        console.error('[AI Chat] Error:', error)
        return NextResponse.json(
            { error: 'Error procesando mensaje' },
            { status: 500 }
        )
    }
}

async function getProjectContext(userEmail: string) {
    // Buscar proyecto del cliente por email
    const project = await prisma.projects.findFirst({
        where: {
            client_portal_enabled: true,
            customer: { email: userEmail }
        },
        include: {
            customer: { select: { name: true } },
            documents: { select: { type: true, status: true, rejection_reason: true } }
        }
    })

    if (!project) {
        return {
            hasProject: false,
            message: 'No tienes proyectos activos'
        }
    }

    const uiState = mapSolarPhaseToUI(project.solar_phase)
    const rejectedDocs = project.documents?.filter(d => d.status === 'REJECTED') || []

    return {
        hasProject: true,
        customerName: project.customer?.name || 'Cliente',
        projectName: project.name,
        phase: project.solar_phase,
        phaseUI: uiState,
        paymentStatus: project.payment_status,
        rejectedDocuments: rejectedDocs,
        hasRejectedDocs: rejectedDocs.length > 0
    }
}

async function generateResponse(userMessage: string, context: any): Promise<string> {
    const message = userMessage.toLowerCase()

    // Saludo inicial con contexto
    if (!context.hasProject) {
        return `Hola 👋 Parece que aún no tienes un proyecto solar activo. 
¿Te gustaría que te conecte con un asesor para comenzar tu instalación? ☀️`
    }

    const { customerName, phase, phaseUI, hasRejectedDocs, rejectedDocuments } = context

    // Respuestas contextuales
    if (message.includes('estado') || message.includes('cómo va') || message.includes('progreso')) {
        let response = `Hola ${customerName}! 👋\n\n`
        response += `📊 **Estado de tu proyecto:** ${phaseUI.message}\n`
        response += `📈 Progreso: ${phaseUI.percentComplete}%\n\n`
        response += `${phaseUI.description}`

        if (hasRejectedDocs) {
            response += `\n\n⚠️ **Atención:** Tienes ${rejectedDocuments.length} documento(s) que necesitan corrección.`
            rejectedDocuments.forEach((doc: any) => {
                response += `\n- ${doc.type}: ${doc.rejection_reason || 'Necesita revisión'}`
            })
        }

        return response
    }

    if (message.includes('documento') || message.includes('subir') || message.includes('rechazado')) {
        if (hasRejectedDocs) {
            let response = `📄 Tenemos documentos que necesitan corrección:\n\n`
            rejectedDocuments.forEach((doc: any) => {
                response += `❌ **${doc.type}:** ${doc.rejection_reason || 'Por favor, sube una nueva versión'}\n`
            })
            response += `\nPuedes subir la corrección en el panel de arriba.`
            return response
        }
        return `📄 Todos tus documentos están en orden. ${PHASE_EXPLANATIONS[phase] || ''}`
    }

    if (message.includes('fase') || message.includes('siguiente') || message.includes('qué sigue')) {
        return `${phaseUI.icon} **${phaseUI.message}**\n\n${PHASE_EXPLANATIONS[phase] || phaseUI.description}`
    }

    if (message.includes('pago') || message.includes('precio') || message.includes('cuánto')) {
        return `💳 Para consultas sobre pagos o presupuestos, te recomiendo contactar directamente con tu asesor comercial. 
¿Quieres que te proporcione su contacto?`
    }

    if (message.includes('instala') || message.includes('cuándo') || message.includes('fecha')) {
        if (phase === 'APPROVED') {
            return `🏗️ ¡Genial! Tu proyecto está aprobado. Nuestro equipo está coordinando la fecha de instalación. 
Recibirás una llamada pronto para confirmar el día.`
        }
        return `📅 La instalación se programa después de completar la fase de documentación y aprobación técnica. 
Actualmente estás en: **${phaseUI.message}**`
    }

    // Respuesta genérica con contexto
    return `Hola ${customerName}! ☀️

Tu proyecto está en: **${phaseUI.message}** (${phaseUI.percentComplete}%)

${phaseUI.description}

¿En qué más puedo ayudarte?
- "¿Cómo va mi proyecto?"
- "¿Qué documentos necesito?"
- "¿Cuándo es la instalación?"`
}
