// Schemas de validación para contabilidad (separados de 'use server')
import { z } from 'zod'

export const AccountTypeSchema = z.enum(['asset', 'liability', 'equity', 'revenue', 'expense'])

export const CreateAccountSchema = z.object({
    code: z.string().min(1, "El código es obligatorio"),
    name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
    type: AccountTypeSchema,
    parentId: z.string().uuid().optional().nullable(),
    isGroup: z.boolean().default(false)
})

export const TransactionLineSchema = z.object({
    accountId: z.string().uuid("ID de cuenta inválido"),
    debit: z.coerce.number().min(0).default(0),
    credit: z.coerce.number().min(0).default(0),
    description: z.string().optional()
})

export const CreateJournalEntrySchema = z.object({
    date: z.string().refine((val) => !isNaN(Date.parse(val)), "Fecha inválida"),
    description: z.string().min(3, "La descripción es obligatoria"),
    reference: z.string().optional(),
    lines: z.array(TransactionLineSchema).min(2, "El asiento debe tener al menos 2 líneas")
})

export type CreateAccountData = z.infer<typeof CreateAccountSchema>
export type CreateJournalEntryData = z.infer<typeof CreateJournalEntrySchema>
