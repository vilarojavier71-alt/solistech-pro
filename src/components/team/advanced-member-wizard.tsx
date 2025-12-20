"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { cn } from "@/lib/utils"
import { CalendarIcon, Check, ChevronRight, Loader2, Upload, User, Briefcase, ShieldCheck } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

// Importar Schemas
import { AdvancedUserSchema, CertificationTypeEnum } from "@/lib/schemas/user-management"
import { triggerConfetti } from "@/lib/confetti"
import type { AdvancedUserFormValues } from "@/lib/schemas/user-management"

// Steps Definitions
const steps = [
    { id: 1, title: "Identidad", icon: User, description: "Datos personales y acceso" },
    { id: 2, title: "Profesional", icon: Briefcase, description: "Rol, zona y cargo" },
    { id: 3, title: "Compliance", icon: ShieldCheck, description: "Certificaciones y PRL" },
]

interface WizardProps {
    roles: { id: string; name: string }[]
    workZones: { id: string; name: string }[]
    onComplete: (data: AdvancedUserFormValues) => Promise<void>
    onCancel: () => void
}

export function AdvancedMemberWizard({ roles, workZones, onComplete, onCancel }: WizardProps) {
    const [currentStep, setCurrentStep] = React.useState(1)
    const [direction, setDirection] = React.useState(0)
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    // React Hook Form Setup
    const form = useForm<AdvancedUserFormValues>({
        resolver: zodResolver(AdvancedUserSchema),
        defaultValues: {
            step1: {
                fullName: "",
                email: "",
                phone: "",
            },
            step2: {
                roleId: "",
                jobTitle: "",
                department: "Instalaciones",
                startDate: new Date(),
            },
            step3: {
                certifications: [],
            },
        } as Partial<AdvancedUserFormValues>,
        mode: "onChange",
    })

    const { control, trigger, getValues, setValue, watch, formState: { errors } } = form

    // Navigation Logic
    const handleNext = async () => {
        let isValid = false

        if (currentStep === 1) {
            isValid = await trigger("step1")
        } else if (currentStep === 2) {
            isValid = await trigger("step2")
        }

        if (isValid) {
            setDirection(1)
            setCurrentStep((prev) => prev + 1)
        }
    }

    const handleBack = () => {
        setDirection(-1)
        setCurrentStep((prev) => prev - 1)
    }

    const handleSubmit = async () => {
        const isValid = await trigger()
        if (!isValid) return

        setIsSubmitting(true)
        try {
            await onComplete(getValues())
            toast.success("Miembro creado exitosamente")
            triggerConfetti() // ?? WOW Factor
        } catch (error) {
            toast.error("Error al crear miembro")
        } finally {
            setIsSubmitting(false)
        }
    }

    // Animation Variants
    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 50 : -50,
            opacity: 0,
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 50 : -50,
            opacity: 0,
        }),
    }

    return (
        <div className="w-full max-w-4xl mx-auto p-1">
            <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-xl ring-1 ring-white/10">
                <CardHeader className="border-b border-border/50 pb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                                Alta de Nuevo Miembro
                            </CardTitle>
                            <CardDescription>
                                Complete el expediente digital del empleado.
                            </CardDescription>
                        </div>
                        {/* Step Indicators */}
                        <div className="flex items-center gap-2">
                            {steps.map((step) => (
                                <div key={step.id} className="flex items-center">
                                    <div
                                        className={cn(
                                            "flex items-center justify-center w-8 h-8 rounded-full border transition-all duration-300",
                                            currentStep >= step.id
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-muted text-muted-foreground border-border"
                                        )}
                                    >
                                        {currentStep > step.id ? <Check className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
                                    </div>
                                    {step.id !== steps.length && (
                                        <div
                                            className={cn(
                                                "w-8 h-0.5 mx-2 transition-colors duration-300",
                                                currentStep > step.id ? "bg-primary" : "bg-border"
                                            )}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-6 md:p-8 min-h-[400px]">
                    <AnimatePresence mode="wait" custom={direction}>

                        {/* STEP 1: IDENTIDAD */}
                        {currentStep === 1 && (
                            <motion.div
                                key="step1"
                                custom={direction}
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
                                className="space-y-6"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="fullName">Nombre Completo *</Label>
                                        <Input
                                            id="fullName"
                                            {...form.register("step1.fullName")}
                                            placeholder="Ej. Juan Pérez"
                                            className={cn(errors.step1?.fullName && "border-destructive focus-visible:ring-destructive")}
                                        />
                                        {errors.step1?.fullName && <span className="text-xs text-destructive">{errors.step1.fullName.message}</span>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Corporativo *</Label>
                                        <Input
                                            id="email"
                                            {...form.register("step1.email")}
                                            placeholder="juan@solistech.pro"
                                            type="email"
                                            className={cn(errors.step1?.email && "border-destructive focus-visible:ring-destructive")}
                                        />
                                        {errors.step1?.email && <span className="text-xs text-destructive">{errors.step1.email.message}</span>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Teléfono Móvil</Label>
                                        <Input id="phone" {...form.register("step1.phone")} placeholder="+34 600 000 000" />
                                    </div>

                                    <div className="col-span-1 md:col-span-2 mt-4 p-4 border rounded-lg bg-muted/30">
                                        <Label className="mb-2 block font-semibold">Contacto de Emergencia (Opcional)</Label>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <Input {...form.register("step1.emergencyContact.name")} placeholder="Nombre Contacto" />
                                            <Input {...form.register("step1.emergencyContact.phone")} placeholder="Teléfono Contacto" />
                                            <Input {...form.register("step1.emergencyContact.relation")} placeholder="Relación (Ej. Cónyuge)" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 2: PROFESIONAL */}
                        {currentStep === 2 && (
                            <motion.div
                                key="step2"
                                custom={direction}
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="jobTitle">Cargo / Job Title *</Label>
                                        <Input id="jobTitle" {...form.register("step2.jobTitle")} placeholder="Ej. Instalador Senior" />
                                        {errors.step2?.jobTitle && <span className="text-xs text-destructive">{errors.step2.jobTitle.message}</span>}

                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="employeeId">ID Empleado</Label>
                                        <Input id="employeeId" {...form.register("step2.employeeId")} placeholder="Ej. EMP-2025-001" />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="roleId">Rol en Sistema *</Label>
                                        <Select
                                            onValueChange={(val) => setValue("step2.roleId", val)}
                                            defaultValue={getValues("step2.roleId")}
                                        >
                                            <SelectTrigger id="roleId">
                                                <SelectValue placeholder="Seleccionar Rol" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {roles?.filter(r => r.id && r.id !== "").map(role => (
                                                    <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.step2?.roleId && <span className="text-xs text-destructive">{errors.step2.roleId.message}</span>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="department">Departamento</Label>
                                        <Input id="department" {...form.register("step2.department")} placeholder="Instalaciones" />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="workZoneId">Zona de Trabajo</Label>
                                        <Select
                                            onValueChange={(val) => setValue("step2.workZoneId", val)}
                                            defaultValue={getValues("step2.workZoneId")}
                                        >
                                            <SelectTrigger id="workZoneId">
                                                <SelectValue placeholder="Asignar Zona" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {workZones?.filter(z => z.id && z.id !== "").map(zone => (
                                                    <SelectItem key={zone.id} value={zone.id}>{zone.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2 flex flex-col">
                                        <Label>Fecha de Inicio</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full pl-3 text-left font-normal",
                                                        !getValues("step2.startDate") && "text-muted-foreground"
                                                    )}
                                                >
                                                    {getValues("step2.startDate") && (
                                                        format(getValues("step2.startDate")!, "PPP", { locale: es })
                                                    )}
                                                    {!getValues("step2.startDate") && (
                                                        <span>Seleccionar fecha</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={watch("step2.startDate")}
                                                    onSelect={(date: Date | undefined) => date && setValue("step2.startDate", date)}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 3: COMPLIANCE */}
                        {currentStep === 3 && (
                            <motion.div
                                key="step3"
                                custom={direction}
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                <div className="text-center space-y-2 mb-8">
                                    <ShieldCheck className="w-12 h-12 mx-auto text-muted-foreground/50" />
                                    <h3 className="text-lg font-medium">Documentación y Certificados</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Opcional. Puede añadir los carnets vigentes ahora o más tarde desde el perfil.
                                    </p>
                                </div>

                                {/* Placeholder for Upload - No list rendering yet to avoid complexity */}
                                <div className="border border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center gap-4 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer group">
                                    <div className="p-4 rounded-full bg-background group-hover:scale-110 transition-transform">
                                        <Upload className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Subir certificaciones</p>
                                        <p className="text-xs text-muted-foreground mt-1">Arrastre archivos PDF o imágenes aquí</p>
                                    </div>
                                    <Button type="button" variant="secondary" size="sm" onClick={() => toast.info("Funcionalidad de subida en desarrollo")}>
                                        Seleccionar Archivos
                                    </Button>
                                    {/* If we had items, we would map them here using useFieldArray */}
                                </div>

                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm text-blue-400">
                                    <p className="flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4" />
                                        Nota: El control de caducidad se activará automáticamente al guardar.
                                    </p>
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </CardContent>

                <Separator className="bg-border/50" />

                <CardFooter className="p-6 flex justify-between bg-muted/20">
                    <Button
                        variant="ghost"
                        onClick={currentStep === 1 ? onCancel : handleBack}
                        disabled={isSubmitting}
                    >
                        {currentStep === 1 ? "Cancelar" : "Atrás"}
                    </Button>

                    {currentStep < 3 ? (
                        <Button onClick={handleNext} className="gap-2">
                            Siguiente <ChevronRight className="w-4 h-4" />
                        </Button>
                    ) : (
                        <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20">
                            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            Finalizar Alta
                        </Button>
                    )}
                </CardFooter>
            </Card>

            {/* Progress Bar background */}
            <div className="mt-8 flex justify-center gap-2">
                {[1, 2, 3].map((s) => (
                    <div key={s} className={cn("h-1 w-12 rounded-full transition-colors", currentStep >= s ? "bg-primary" : "bg-muted")} />
                ))}
            </div>
        </div>
    )
}
