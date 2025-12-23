/**
 * Tests AAA para Accounting 622x (FinOps Guardrails)
 * ISO 27001: A.12.2.1 - FinOps Guardrails
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { recordInfrastructureCost } from '@/lib/finops/budget-guardrail'
import { createJournalEntry } from '@/lib/actions/accounting'

describe('Accounting 622x - Infrastructure Cost Recording', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('recordInfrastructureCost', () => {
        it('should create accounting entry 622x when cost > 0', async () => {
            // Arrange
            const organizationId = 'org-123'
            const resource = {
                name: 'pdf_generation',
                costPerUnit: 0.01,
                unit: 'pdf'
            }
            const cost = 0.05

            // Mock prisma
            vi.mock('@/lib/db', () => ({
                prisma: {
                    accounting_accounts: {
                        findFirst: vi.fn()
                            .mockResolvedValueOnce({
                                id: 'account-622x',
                                code: '6221',
                                type: 'expense'
                            })
                            .mockResolvedValueOnce({
                                id: 'account-4000',
                                code: '4000',
                                type: 'liability'
                            })
                    }
                }
            }))

            // Mock createJournalEntry
            vi.mock('@/lib/actions/accounting', () => ({
                createJournalEntry: vi.fn().mockResolvedValue({
                    success: true,
                    data: { id: 'journal-123' }
                })
            }))

            // Mock getCurrentUserWithRole
            vi.mock('@/lib/session', () => ({
                getCurrentUserWithRole: vi.fn().mockResolvedValue({
                    id: 'user-123',
                    organizationId: 'org-123'
                })
            }))

            // Act
            await recordInfrastructureCost(organizationId, resource, cost)

            // Assert
            expect(createJournalEntry).toHaveBeenCalled()
            const call = (createJournalEntry as any).mock.calls[0][0]
            expect(call.lines).toHaveLength(2)
            expect(call.lines[0].debit).toBe(cost)
            expect(call.lines[1].credit).toBe(cost)
        })

        it('should not create accounting entry when cost is 0', async () => {
            // Arrange
            const organizationId = 'org-123'
            const resource = {
                name: 'pdf_generation',
                costPerUnit: 0.01,
                unit: 'pdf'
            }
            const cost = 0

            vi.mock('@/lib/actions/accounting', () => ({
                createJournalEntry: vi.fn()
            }))

            // Act
            await recordInfrastructureCost(organizationId, resource, cost)

            // Assert
            expect(createJournalEntry).not.toHaveBeenCalled()
        })
    })
})

