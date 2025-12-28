'use server'

import { streamText } from 'ai'
import { createStreamableValue } from 'ai/rsc'
import { openai } from '@/lib/ai/provider'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import {
    AssistantRole,
    buildSystemPrompt,
    ASSISTANT_PROMPTS
} from '@/lib/ai/prompts'
import {
    getSalesContext,
    getTechnicalContext,
    getAdminContext,
    getSupportContext,
    CONTEXT_FIELD_MAPPING
} from '@/lib/ai/context-providers'

/**
 * Main AI Orchestrator
 * Stream text response based on user query and active context
 */
export async function streamGeminiResponse(
    message: string,
    model: string = 'gpt-4o',
    contextId?: string, // Linked ID (Lead ID, Project ID, etc)
    role: AssistantRole = 'sales'
) {
    const session = await auth()

    // 1. SECURITY: Tenancy Check
    if (!session?.user?.organizationId) {
        throw new Error("Unauthorized: No Organization ID")
    }

    const orgId = session.user.organizationId
    const userId = session.user.id

    // 2. CONTEXT RETRIEVAL (RAG Layer)
    let contextData: Record<string, any> = {}

    try {
        if (contextId) {
            switch (role) {
                case 'sales':
                    contextData = await getSalesContext(contextId, orgId) || {}
                    break
                case 'technical':
                    contextData = await getTechnicalContext(contextId, orgId) || {}
                    break
                case 'admin':
                    contextData = await getAdminContext(contextId, orgId) || {}
                    break
                case 'support':
                    // Support context often depends on User ID, not an external entity ID
                    contextData = await getSupportContext(contextId || userId, 'dashboard') || {}
                    break
                case 'god_mode':
                    // God Mode needs aggregation. For now, fetch generic stats mock or minimal aggregation.
                    // Ideally this would call a dedicated aggregator function.
                    // For MVP/Greenfield, we'll inject user info and basic stats.
                    contextData = {
                        sales_summary: "Acceso a todos los leads",
                        technical_summary: "Acceso a todos los proyectos",
                        finance_summary: "Acceso a facturación global",
                        support_metrics: "Acceso a tickets globales"
                    }
                    break
            }
        }
    } catch (error) {
        console.error("Context Retrieval Error:", error)
        // Fallback: Continue without context rather than crashing
    }

    // 3. PROMPT ENGINEERING
    const systemPrompt = buildSystemPrompt(role, contextData)

    // 4. STREAMING GENERATION
    const result = await streamText({
        model: openai(model),
        system: systemPrompt,
        messages: [{ role: 'user', content: message }],
        temperature: 0.7,
    })

    return createStreamableValue(result.textStream).value
}
