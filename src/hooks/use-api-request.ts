/**
 * Hook centralizado para peticiones API
 * 
 * Implementa:
 * - Manejo de errores consistente
 * - Logging estructurado
 * - Retry logic
 * - Rate limiting (futuro)
 * 
 * @example
 * const { data, error, isLoading } = useApiRequest('/api/projects', { method: 'GET' })
 */

'use client'

import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'

interface UseApiRequestOptions extends RequestInit {
    retries?: number
    retryDelay?: number
    onError?: (error: Error) => void
}

interface UseApiRequestResult<T> {
    data: T | null
    error: Error | null
    isLoading: boolean
    refetch: () => Promise<void>
}

/**
 * Hook centralizado para peticiones HTTP
 * Reemplaza fetch() directo en componentes
 */
export function useApiRequest<T = unknown>(
    url: string,
    options: UseApiRequestOptions = {}
): UseApiRequestResult<T> {
    const [data, setData] = useState<T | null>(null)
    const [error, setError] = useState<Error | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const {
        retries = 3,
        retryDelay = 1000,
        onError,
        ...fetchOptions
    } = options

    const fetchData = async (attempt = 1): Promise<void> => {
        try {
            setIsLoading(true)
            setError(null)

            const response = await fetch(url, {
                ...fetchOptions,
                headers: {
                    'Content-Type': 'application/json',
                    ...fetchOptions.headers,
                },
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`HTTP ${response.status}: ${errorText}`)
            }

            const jsonData = await response.json()
            setData(jsonData)
            
            // Logging estructurado
            logger.info('API request successful', {
                source: 'useApiRequest',
                action: 'fetch_success',
                url,
                status: response.status
            })
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Unknown error')
            
            // Retry logic
            if (attempt < retries) {
                logger.warn('API request failed, retrying', {
                    source: 'useApiRequest',
                    action: 'retry',
                    url,
                    attempt,
                    error: error.message
                })
                
                await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
                return fetchData(attempt + 1)
            }

            setError(error)
            
            // Logging estructurado
            logger.error('API request failed', {
                source: 'useApiRequest',
                action: 'fetch_error',
                url,
                error: error.message,
                attempts: attempt
            })

            // Callback de error personalizado
            if (onError) {
                onError(error)
            }
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [url]) // Re-fetch cuando cambia la URL

    const refetch = () => fetchData()

    return { data, error, isLoading, refetch }
}

/**
 * Hook para peticiones POST/PUT/DELETE
 */
export function useApiMutation<T = unknown, P = unknown>(
    url: string,
    options: UseApiRequestOptions = {}
) {
    const [data, setData] = useState<T | null>(null)
    const [error, setError] = useState<Error | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const mutate = async (payload?: P) => {
        try {
            setIsLoading(true)
            setError(null)

            const response = await fetch(url, {
                ...options,
                method: options.method || 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
                body: payload ? JSON.stringify(payload) : undefined,
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`HTTP ${response.status}: ${errorText}`)
            }

            const jsonData = await response.json()
            setData(jsonData)

            logger.info('API mutation successful', {
                source: 'useApiMutation',
                action: 'mutation_success',
                url,
                method: options.method || 'POST'
            })

            return jsonData
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Unknown error')
            setError(error)

            logger.error('API mutation failed', {
                source: 'useApiMutation',
                action: 'mutation_error',
                url,
                error: error.message
            })

            throw error
        } finally {
            setIsLoading(false)
        }
    }

    return { mutate, data, error, isLoading }
}

