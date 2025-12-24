import { useMutation, UseMutationResult } from '@tanstack/react-query'

interface CatastroResult {
  rc: string
  address: string
  city: string
  lat?: number
  lng?: number
  match_type?: string
}

interface ApiResponse {
  success: boolean
  data?: CatastroResult
  message?: string
  source?: string
}

async function postLookup(mode: 'address' | 'rc', payload: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch('/api/catastro/lookup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, payload })
  })
  if (!res.ok) {
    return { success: false, message: 'Error de red' }
  }
  return res.json()
}

export function useCatastro() {
  const addressMutation: UseMutationResult<ApiResponse, Error, string> = useMutation({
    mutationFn: (query: string) => postLookup('address', { query })
  })

  const rcMutation: UseMutationResult<ApiResponse, Error, string> = useMutation({
    mutationFn: (rc: string) => postLookup('rc', { rc })
  })

  return {
    searchByAddress: addressMutation.mutateAsync,
    searchByRC: rcMutation.mutateAsync,
    isLoading: addressMutation.isLoading || rcMutation.isLoading,
  }
}


