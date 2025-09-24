"use client"

import { useState, useEffect, useRef, useCallback } from 'react'

// Basic debounce hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Advanced debounced callback hook
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps?: React.DependencyList
): [T, () => void] {
  const callbackRef = useRef<T>(callback)
  const timeoutRef = useRef<NodeJS.Timeout>()

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  // Cancel pending execution
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }
  }, [])

  // Debounced function
  const debouncedCallback = useCallback(
    ((...args: Parameters<T>) => {
      cancel()
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args)
      }, delay)
    }) as T,
    [delay, cancel, ...(deps || [])]
  )

  // Cleanup on unmount
  useEffect(() => {
    return cancel
  }, [cancel])

  return [debouncedCallback, cancel]
}

// Search-specific debounce hook
export function useSearchDebounce(
  searchTerm: string,
  delay: number = 300
) {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm)
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    setIsSearching(true)

    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setIsSearching(false)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [searchTerm, delay])

  return {
    debouncedSearchTerm,
    isSearching
  }
}

// Throttle hook for limiting function calls
export function useThrottle<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value)
  const lastExecuted = useRef<number>(Date.now())

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() >= lastExecuted.current + delay) {
        setThrottledValue(value)
        lastExecuted.current = Date.now()
      }
    }, delay - (Date.now() - lastExecuted.current))

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return throttledValue
}

// Throttled callback hook
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps?: React.DependencyList
): T {
  const lastRan = useRef<number>(Date.now())
  const timeoutRef = useRef<NodeJS.Timeout>()

  const throttledCallback = useCallback(
    ((...args: Parameters<T>) => {
      if (Date.now() - lastRan.current >= delay) {
        callback(...args)
        lastRan.current = Date.now()
      } else {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(() => {
          if (Date.now() - lastRan.current >= delay) {
            callback(...args)
            lastRan.current = Date.now()
          }
        }, delay - (Date.now() - lastRan.current))
      }
    }) as T,
    [callback, delay, ...(deps || [])]
  )

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return throttledCallback
}