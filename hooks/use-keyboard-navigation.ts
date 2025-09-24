"use client"

import { useEffect, useCallback, useRef } from 'react'

interface UseKeyboardNavigationOptions {
  onEscape?: () => void
  onEnter?: () => void
  onArrowUp?: () => void
  onArrowDown?: () => void
  onArrowLeft?: () => void
  onArrowRight?: () => void
  onTab?: (e: KeyboardEvent) => void
  enabled?: boolean
}

export function useKeyboardNavigation({
  onEscape,
  onEnter,
  onArrowUp,
  onArrowDown,
  onArrowLeft,
  onArrowRight,
  onTab,
  enabled = true
}: UseKeyboardNavigationOptions) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return

    switch (e.key) {
      case 'Escape':
        onEscape?.()
        break
      case 'Enter':
        onEnter?.()
        break
      case 'ArrowUp':
        e.preventDefault()
        onArrowUp?.()
        break
      case 'ArrowDown':
        e.preventDefault()
        onArrowDown?.()
        break
      case 'ArrowLeft':
        onArrowLeft?.()
        break
      case 'ArrowRight':
        onArrowRight?.()
        break
      case 'Tab':
        onTab?.(e)
        break
    }
  }, [enabled, onEscape, onEnter, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onTab])

  useEffect(() => {
    if (!enabled) return

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown, enabled])

  return { handleKeyDown }
}

export function useFocusManagement() {
  const focusableElementsSelector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ')

  const getFocusableElements = useCallback((container: HTMLElement) => {
    return Array.from(container.querySelectorAll(focusableElementsSelector)) as HTMLElement[]
  }, [])

  const trapFocus = useCallback((containerRef: React.RefObject<HTMLElement>) => {
    if (!containerRef.current) return

    const focusableElements = getFocusableElements(containerRef.current)
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleTabKey)
    firstElement?.focus()

    return () => {
      document.removeEventListener('keydown', handleTabKey)
    }
  }, [getFocusableElements])

  const restoreFocus = useCallback((previouslyFocusedElement: HTMLElement | null) => {
    if (previouslyFocusedElement) {
      previouslyFocusedElement.focus()
    }
  }, [])

  return {
    getFocusableElements,
    trapFocus,
    restoreFocus
  }
}