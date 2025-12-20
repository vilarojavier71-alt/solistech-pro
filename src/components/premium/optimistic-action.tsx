'use client'

import React, { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

// ============================================
// TYPES
// ============================================

export interface OptimisticActionProps<T = any, R = any> {
    children: React.ReactNode
    onAction: (data?: T) => Promise<R>
    optimisticUpdate?: (data?: T) => void
    onSuccess?: (result: R) => void
    onError?: (error: Error) => void
    onRevert?: () => void
    successMessage?: string
    errorMessage?: string
    loadingMessage?: string
    showToast?: boolean
    disabled?: boolean
}

// ============================================
// OPTIMISTIC UI WRAPPER COMPONENT
// ============================================

export function OptimisticAction<T = any, R = any>({
    children,
    onAction,
    optimisticUpdate,
    onSuccess,
    onError,
    onRevert,
    successMessage = 'Acción completada',
    errorMessage = 'Error al procesar',
    loadingMessage = 'Procesando...',
    showToast = true,
    disabled = false
}: OptimisticActionProps<T, R>) {
    const [isPending, startTransition] = useTransition()
    const [isLoading, setIsLoading] = useState(false)

    const handleAction = async (data?: T) => {
        if (disabled || isLoading) return

        setIsLoading(true)

        // 1. Apply optimistic update immediately
        if (optimisticUpdate) {
            optimisticUpdate(data)
        }

        // 2. Show loading toast
        const toastId = showToast
            ? toast.loading(loadingMessage, {
                icon: <Loader2 className="h-4 w-4 animate-spin" />
            })
            : null

        try {
            // 3. Execute actual action
            const result = await onAction(data)

            // 4. Success feedback
            if (showToast && toastId) {
                toast.success(successMessage, {
                    id: toastId,
                    icon: <CheckCircle className="h-4 w-4" />,
                    duration: 2000
                })
            }

            // 5. Call success callback
            if (onSuccess) {
                onSuccess(result)
            }

            setIsLoading(false)
            return result
        } catch (error) {
            // 6. Revert optimistic update on error
            if (onRevert) {
                onRevert()
            }

            // 7. Error feedback
            if (showToast && toastId) {
                toast.error(errorMessage, {
                    id: toastId,
                    icon: <XCircle className="h-4 w-4" />,
                    description: error instanceof Error ? error.message : undefined,
                    duration: 4000
                })
            }

            // 8. Call error callback
            if (onError) {
                onError(error instanceof Error ? error : new Error(String(error)))
            }

            setIsLoading(false)
            throw error
        }
    }

    // Clone children and inject action handler
    return (
        <>
            {typeof children === 'function'
                ? children({ handleAction, isLoading: isLoading || isPending })
                : React.cloneElement(children as React.ReactElement, {
                    onClick: () => handleAction(),
                    disabled: disabled || isLoading || isPending,
                    'aria-busy': isLoading || isPending
                })}
        </>
    )
}

// ============================================
// OPTIMISTIC LIST HELPER
// ============================================

export function useOptimisticList<T extends { id: string | number }>(
    initialData: T[]
) {
    const [data, setData] = useState<T[]>(initialData)
    const [tempIds, setTempIds] = useState<Set<string | number>>(new Set())

    const addOptimistic = (item: Omit<T, 'id'>) => {
        const tempId = `temp-${Date.now()}`
        const optimisticItem = { ...item, id: tempId } as T
        setData(prev => [...prev, optimisticItem])
        setTempIds(prev => new Set([...prev, tempId]))
        return tempId
    }

    const updateOptimistic = (tempId: string | number, realItem: T) => {
        setData(prev => prev.map(item => item.id === tempId ? realItem : item))
        setTempIds(prev => {
            const newSet = new Set(prev)
            newSet.delete(tempId)
            return newSet
        })
    }

    const removeOptimistic = (id: string | number) => {
        setData(prev => prev.filter(item => item.id !== id))
        setTempIds(prev => {
            const newSet = new Set(prev)
            newSet.delete(id)
            return newSet
        })
    }

    const revertOptimistic = (tempId: string | number) => {
        removeOptimistic(tempId)
    }

    return {
        data,
        setData,
        addOptimistic,
        updateOptimistic,
        removeOptimistic,
        revertOptimistic,
        isTempId: (id: string | number) => tempIds.has(id)
    }
}

// ============================================
// OPTIMISTIC FORM WRAPPER
// ============================================

export interface OptimisticFormProps<T = any> {
    children: (props: {
        handleSubmit: (data: T) => void
        isSubmitting: boolean
    }) => React.ReactNode
    onSubmit: (data: T) => Promise<any>
    onSuccess?: (result: any) => void
    onError?: (error: Error) => void
    successMessage?: string
    errorMessage?: string
}

export function OptimisticForm<T = any>({
    children,
    onSubmit,
    onSuccess,
    onError,
    successMessage = 'Guardado correctamente',
    errorMessage = 'Error al guardar'
}: OptimisticFormProps<T>) {
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (data: T) => {
        if (isSubmitting) return

        setIsSubmitting(true)

        const toastId = toast.loading('Guardando...', {
            icon: <Loader2 className="h-4 w-4 animate-spin" />
        })

        try {
            const result = await onSubmit(data)

            toast.success(successMessage, {
                id: toastId,
                icon: <CheckCircle className="h-4 w-4" />,
                duration: 2000
            })

            if (onSuccess) {
                onSuccess(result)
            }

            setIsSubmitting(false)
            return result
        } catch (error) {
            toast.error(errorMessage, {
                id: toastId,
                icon: <XCircle className="h-4 w-4" />,
                description: error instanceof Error ? error.message : undefined,
                duration: 4000
            })

            if (onError) {
                onError(error instanceof Error ? error : new Error(String(error)))
            }

            setIsSubmitting(false)
            throw error
        }
    }

    return <>{children({ handleSubmit, isSubmitting })}</>
}
