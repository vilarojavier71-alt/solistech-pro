
import { useState, useEffect, useCallback } from 'react'
import { searchBenefitsAI } from '@/lib/actions/solar-brain'

export interface MunicipalBenefit {
    id: string
    municipality: string | null
    province: string | null
    autonomous_community: string
    scope_level: 'municipality' | 'comarca' | 'region'
    ibi_percentage: number
    ibi_years: number
    icio_percentage: number
    requirements: string[]
    last_updated: string
}

interface SearchState {
    data: MunicipalBenefit[]
    loading: boolean
    error: string | null
    total: number
}

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

export function useMunicipalBenefits() {
    const [query, setQuery] = useState('')
    const debouncedQuery = useDebounce(query, 500) // Increased debounce for AI tokens

    const [state, setState] = useState<SearchState>({
        data: [],
        loading: false,
        error: null,
        total: 0
    })

    const fetchBenefits = useCallback(async (q: string) => {
        setState(prev => ({ ...prev, loading: true, error: null }))
        try {
            // Call AI Server Action directly
            const results = await searchBenefitsAI(q)

            setState(prev => ({
                ...prev,
                data: results as MunicipalBenefit[],
                total: results.length,
                loading: false
            }))
        } catch (err) {
            console.error(err)
            setState(prev => ({ ...prev, loading: false, error: 'Error en SolarBrain AI' }))
        }
    }, [])

    useEffect(() => {
        // Only fetch if query is not empty, or load defaults on mount
        fetchBenefits(debouncedQuery)
    }, [debouncedQuery, fetchBenefits])

    return {
        ...state,
        // Compatibility with old interface
        filters: {
            q: query,
            region: '',
            min_ibi: '',
            min_icio: ''
        },
        setQuery,
        setRegion: () => console.warn('SolarBrain automatically detects regions'),
        setMinIbi: () => console.warn('SolarBrain automatically detects percentages'),
        refresh: () => fetchBenefits(query)
    }
}
