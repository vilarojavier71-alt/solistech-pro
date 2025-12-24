/**
 * FinOps Guardrails - ISO 27001 A.12.2.1 & EDoS Prevention
 * 
 * Previene ataques de Economic Denial of Sustainability (EDoS)
 * Validando presupuesto antes de acciones costosas.
 */

'use server'

import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { auditLogAction } from '@/lib/audit/audit-logger'

interface BudgetConfig {
    monthlyLimit: number
    currentSpend: number
    alerts: Array<{ threshold: number; action: 'warn' | 'block' }>
}

interface InfrastructureResource {
    name: string
    costPerUnit: number
    unit: string
}

/**
 * Obtiene el presupuesto actual de la organización
 */
async function getCurrentBudget(organizationId: string): Promise<BudgetConfig | null> {
    try {
        const org = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: {
                id: true,
                subscription_plan: true,
                // TODO: Añadir campos de presupuesto cuando se implemente
                // monthly_budget_limit: true,
                // current_monthly_spend: true
            }
        })

        if (!org) return null

        // Presupuestos por plan (temporal - debería venir de BD)
        const budgetLimits: Record<string, number> = {
            basic: 50,      // €50/mes
            pro: 500,       // €500/mes
            enterprise: 5000 // €5000/mes
        }

        const monthlyLimit = budgetLimits[org.subscription_plan || 'basic'] || 50

        // TODO: Calcular gasto actual desde tabla de costos
        const currentSpend = 0 // Placeholder

        return {
            monthlyLimit,
            currentSpend,
            alerts: [
                { threshold: 0.8, action: 'warn' },  // 80% - Alerta
                { threshold: 0.9, action: 'block' }  // 90% - Bloquear
            ]
        }
    } catch (error) {
        logger.error('Failed to get budget', {
            source: 'finops',
            action: 'get_budget_error',
            organizationId,
            error: error instanceof Error ? error.message : 'Unknown error'
        })
        return null
    }
}

/**
 * Calcula el costo estimado de un recurso
 */
function calculateProjectedCost(
    resource: InfrastructureResource,
    requestedIncrease: number
): number {
    return resource.costPerUnit * requestedIncrease
}

/**
 * Valida si una acción de escalado de infraestructura está permitida
 * según el presupuesto mensual
 * 
 * @param organizationId - ID de la organización
 * @param resource - Recurso a escalar
 * @param requestedIncrease - Incremento solicitado
 * @returns true si está permitido, false si excede presupuesto
 */
export async function validateInfrastructureScaling(
    organizationId: string,
    resource: InfrastructureResource,
    requestedIncrease: number
): Promise<{ allowed: boolean; reason?: string; projectedCost?: number }> {
    const budget = await getCurrentBudget(organizationId)
    
    if (!budget) {
        logger.warn('Budget not configured, allowing scaling', {
            source: 'finops',
            action: 'budget_not_configured',
            organizationId
        })
        return { allowed: true, reason: 'Budget not configured' }
    }

    const projectedCost = calculateProjectedCost(resource, requestedIncrease)
    const totalAfterAction = budget.currentSpend + projectedCost

    // Verificar umbrales de alerta
    for (const alert of budget.alerts) {
        const thresholdAmount = budget.monthlyLimit * alert.threshold
        
        if (totalAfterAction > thresholdAmount) {
            if (alert.action === 'block') {
                // Audit log del bloqueo
                await auditLogAction(
                    'budget.exceeded',
                    'system', // System action
                    'budget',
                    organizationId,
                    `Budget exceeded: ${totalAfterAction.toFixed(2)}€ > ${budget.monthlyLimit}€`,
                    {
                        organizationId,
                        metadata: {
                            currentSpend: budget.currentSpend,
                            projectedCost,
                            totalAfterAction,
                            monthlyLimit: budget.monthlyLimit,
                            threshold: alert.threshold,
                            resource: resource.name
                        }
                    }
                ).catch(err => {
                    logger.error('Failed to audit budget block', {
                        source: 'finops',
                        error: err instanceof Error ? err.message : 'Unknown'
                    })
                })

                return {
                    allowed: false,
                    reason: `Budget threshold exceeded. Current: ${budget.currentSpend.toFixed(2)}€, Projected: ${totalAfterAction.toFixed(2)}€, Limit: ${budget.monthlyLimit}€`,
                    projectedCost
                }
            } else if (alert.action === 'warn') {
                // Solo advertencia, permitir pero loguear
                logger.warn('Budget threshold warning', {
                    source: 'finops',
                    action: 'budget_warning',
                    organizationId,
                    currentSpend: budget.currentSpend,
                    projectedCost,
                    totalAfterAction,
                    threshold: alert.threshold
                })
            }
        }
    }

    return { allowed: true, projectedCost }
}

/**
 * Registra un costo de infraestructura y genera asiento contable 622x automático
 * ISO 27001: FinOps Guardrails + Accounting Automation
 */
export async function recordInfrastructureCost(
    organizationId: string,
    resource: InfrastructureResource,
    cost: number,
    metadata?: Record<string, unknown>
): Promise<void> {
    try {
        // 1. Logging estructurado
        logger.info('Infrastructure cost recorded', {
            source: 'finops',
            action: 'cost_recorded',
            organizationId,
            resource: resource.name,
            cost,
            ...metadata
        })

        // 2. Audit log
        await auditLogAction(
            'infrastructure.scaled',
            'system',
            'infrastructure',
            organizationId,
            `Infrastructure cost: ${cost}€ for ${resource.name}`,
            {
                organizationId,
                metadata: {
                    resource: resource.name,
                    cost,
                    ...metadata
                }
            }
        ).catch(() => {})

        // 3. Accounting 622x: Generar asiento contable automático
        if (cost > 0) {
            try {
                const { createJournalEntry } = await import('@/lib/actions/accounting')
                const { getCurrentUserWithRole } = await import('@/lib/session')
                
                const user = await getCurrentUserWithRole()
                if (user?.organizationId === organizationId) {
                    // Buscar cuenta 622x (Gastos de infraestructura)
                    const { prisma } = await import('@/lib/db')
                    const expenseAccount = await prisma.accountingAccount.findFirst({
                        where: {
                            organization_id: organizationId,
                            code: { startsWith: '622' },
                            type: 'expense',
                            is_active: true
                        },
                        orderBy: { code: 'asc' }
                    })

                    // Buscar cuenta 4000 (Proveedores)
                    const supplierAccount = await prisma.accountingAccount.findFirst({
                        where: {
                            organization_id: organizationId,
                            code: { startsWith: '400' },
                            type: 'liability',
                            is_active: true
                        },
                        orderBy: { code: 'asc' }
                    })

                    if (expenseAccount && supplierAccount) {
                        await createJournalEntry({
                            date: new Date().toISOString().split('T')[0],
                            description: `Gasto de infraestructura: ${resource.name}`,
                            reference: `INFRA-${resource.name}-${Date.now()}`,
                            lines: [
                                {
                                    accountId: expenseAccount.id,
                                    debit: cost,
                                    credit: 0,
                                    description: `${resource.name} - ${resource.unit}`
                                },
                                {
                                    accountId: supplierAccount.id,
                                    debit: 0,
                                    credit: cost,
                                    description: `Proveedor: ${resource.name}`
                                }
                            ]
                        }).catch((err) => {
                            logger.warn('Failed to create accounting entry for infrastructure cost', {
                                source: 'finops',
                                action: 'accounting_entry_failed',
                                organizationId,
                                error: err instanceof Error ? err.message : 'Unknown'
                            })
                        })
                    } else {
                        logger.warn('Accounting accounts not found for infrastructure cost', {
                            source: 'finops',
                            action: 'accounts_not_found',
                            organizationId,
                            expenseAccount: !!expenseAccount,
                            supplierAccount: !!supplierAccount
                        })
                    }
                }
            } catch (accountingError) {
                // No bloquear si falla el accounting, solo loguear
                logger.error('Failed to create accounting entry', {
                    source: 'finops',
                    action: 'accounting_error',
                    organizationId,
                    error: accountingError instanceof Error ? accountingError.message : 'Unknown'
                })
            }
        }
    } catch (error) {
        logger.error('Failed to record infrastructure cost', {
            source: 'finops',
            action: 'record_cost_error',
            organizationId,
            error: error instanceof Error ? error.message : 'Unknown error'
        })
    }
}


