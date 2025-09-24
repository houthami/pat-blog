"use client"

import { useEffect, useRef, useState } from 'react'

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  triggerOnce?: boolean
  skip?: boolean
}

export function useIntersectionObserver({
  threshold = 0.1,
  root = null,
  rootMargin = '0px',
  triggerOnce = false,
  skip = false
}: UseIntersectionObserverOptions = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasIntersected, setHasIntersected] = useState(false)
  const targetRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (skip || !targetRef.current) return

    const element = targetRef.current

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isElementIntersecting = entry.isIntersecting

        setIsIntersecting(isElementIntersecting)

        if (isElementIntersecting && !hasIntersected) {
          setHasIntersected(true)
        }

        if (triggerOnce && isElementIntersecting) {
          observer.unobserve(element)
        }
      },
      {
        threshold,
        root,
        rootMargin
      }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [threshold, root, rootMargin, triggerOnce, skip, hasIntersected])

  return {
    targetRef,
    isIntersecting,
    hasIntersected
  }
}

// Hook for lazy loading
export function useLazyLoad(options?: UseIntersectionObserverOptions) {
  return useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px',
    triggerOnce: true,
    ...options
  })
}

// Hook for infinite scrolling
export function useInfiniteScroll(
  callback: () => void,
  options?: UseIntersectionObserverOptions
) {
  const { targetRef, isIntersecting } = useIntersectionObserver({
    threshold: 1.0,
    rootMargin: '100px',
    ...options
  })

  useEffect(() => {
    if (isIntersecting) {
      callback()
    }
  }, [isIntersecting, callback])

  return targetRef
}

// Hook for viewport visibility tracking
export function useViewportVisibility(
  callback: (isVisible: boolean) => void,
  options?: UseIntersectionObserverOptions
) {
  const { targetRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.5,
    ...options
  })

  useEffect(() => {
    callback(isIntersecting)
  }, [isIntersecting, callback])

  return targetRef
}