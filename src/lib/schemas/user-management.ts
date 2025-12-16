import { z } from "zod"

export const CertificationTypeEnum = z.enum(["PRL", "ALTURA", "ELECTRICIDAD_BAJA", "CONDUCIR", "OTRO"])

export const CertificationSchema = z.object({
    type: CertificationTypeEnum,
    name: z.string().min(3, "El nombre del certificado es obligatorio"),
    issueDate: z.date(),
    expiryDate: z.date(),
    file: z.any().optional(), // File object integration depends on upload logic
})

export const UserPersonalSchema = z.object({
    fullName: z.string().min(2, "Nombre completo requerido"),
    email: z.string().email("Email inválido"),
    phone: z.string().min(9, "Teléfono requerido").optional().or(z.literal("")),
    emergencyContact: z.object({
        name: z.string().min(2, "Nombre de contacto requerido"),
        phone: z.string().min(9, "Teléfono de contacto requerido"),
        relation: z.string().optional(),
    }).optional(),
})

export const UserProfessionalSchema = z.object({
    roleId: z.string().optional().or(z.literal('')), // Relaxed to avoid 'required' error if UI sends undefined
    employeeId: z.string().optional(),
    jobTitle: z.string().optional(), // Made optional as it's not in DB yet
    department: z.string().optional(),
    workZoneId: z.string().optional(), // Relaxed to optional string
    startDate: z.date().optional(),
})

// Schema unificado para el Wizard
export const AdvancedUserSchema = z.object({
    step1: UserPersonalSchema,
    step2: UserProfessionalSchema,
    step3: z.object({
        certifications: z.array(CertificationSchema).default([]),
    }),
})

export type AdvancedUserFormValues = z.infer<typeof AdvancedUserSchema>
