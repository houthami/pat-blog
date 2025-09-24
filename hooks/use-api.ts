"use client"

import { useState, useCallback } from 'react'
import { APIError, Result, withErrorHandler, withRetry } from '@/lib/api/error-handling'

interface ApiState<T> {
  data: T | null
  isLoading: boolean
  error: APIError | null
  isError: boolean
  isSuccess: boolean
}

interface UseApiOptions {
  retries?: number
  retryDelay?: number
  onSuccess?: (data: any) => void
  onError?: (error: APIError) => void
}

export function useApi<T = any>(options: UseApiOptions = {}) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    isLoading: false,
    error: null,
    isError: false,
    isSuccess: false
  })

  const execute = useCallback(async <R = T>(
    apiCall: () => Promise<R>
  ): Promise<Result<R>> => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      isError: false,
      isSuccess: false
    }))

    const wrappedCall = withErrorHandler(apiCall)
    const finalCall = options.retries
      ? withRetry(wrappedCall, options.retries, options.retryDelay)
      : wrappedCall

    const result = await finalCall()

    if (result.success) {
      setState({
        data: result.data as T,
        isLoading: false,
        error: null,
        isError: false,
        isSuccess: true
      })
      options.onSuccess?.(result.data)
    } else {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: result.error,
        isError: true,
        isSuccess: false
      }))
      options.onError?.(result.error)
    }

    return result
  }, [options])

  const reset = useCallback(() => {
    setState({
      data: null,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: false
    })
  }, [])

  const retry = useCallback(async (lastApiCall?: () => Promise<T>) => {
    if (lastApiCall) {
      return execute(lastApiCall)
    }
  }, [execute])

  return {
    ...state,
    execute,
    reset,
    retry
  }
}

// Specialized hooks for common patterns
export function useApiQuery<T>(
  queryFn: () => Promise<T>,
  options: UseApiOptions & { enabled?: boolean } = {}
) {
  const api = useApi<T>(options)
  const { enabled = true } = options

  const refetch = useCallback(() => {
    if (enabled) {
      return api.execute(queryFn)
    }
    return Promise.resolve({ success: false, error: APIError.validationError('Query disabled') } as Result<T>)
  }, [api, queryFn, enabled])

  return {
    ...api,
    refetch
  }
}

export function useApiMutation<T, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<T>,
  options: UseApiOptions = {}
) {
  const api = useApi<T>(options)

  const mutate = useCallback((variables: TVariables) => {
    return api.execute(() => mutationFn(variables))
  }, [api, mutationFn])

  return {
    ...api,
    mutate
  }
}