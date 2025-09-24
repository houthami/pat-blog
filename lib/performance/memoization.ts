"use client"

import { useMemo, useCallback, useRef } from 'react'

// Simple memoization function
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map()

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args)

    if (cache.has(key)) {
      return cache.get(key)
    }

    const result = fn(...args)
    cache.set(key, result)
    return result
  }) as T
}

// LRU Cache implementation
export class LRUCache<K, V> {
  private capacity: number
  private cache: Map<K, V>

  constructor(capacity: number) {
    this.capacity = capacity
    this.cache = new Map()
  }

  get(key: K): V | undefined {
    if (this.cache.has(key)) {
      // Move to end (mark as recently used)
      const value = this.cache.get(key)!
      this.cache.delete(key)
      this.cache.set(key, value)
      return value
    }
    return undefined
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      // Update existing key
      this.cache.delete(key)
    } else if (this.cache.size >= this.capacity) {
      // Remove least recently used item
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }

    this.cache.set(key, value)
  }

  has(key: K): boolean {
    return this.cache.has(key)
  }

  delete(key: K): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}

// Memoization with LRU cache
export function memoizeWithLRU<T extends (...args: any[]) => any>(
  fn: T,
  capacity: number = 100
): T {
  const cache = new LRUCache<string, ReturnType<T>>(capacity)

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args)

    if (cache.has(key)) {
      return cache.get(key)!
    }

    const result = fn(...args)
    cache.set(key, result)
    return result
  }) as T
}

// React hook for memoized computations
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  fn: T,
  deps: React.DependencyList
): T {
  const memoizedFn = useRef<T>()
  const cache = useRef(new Map())

  return useCallback(
    ((...args: Parameters<T>) => {
      const key = JSON.stringify(args)

      if (cache.current.has(key)) {
        return cache.current.get(key)
      }

      const result = fn(...args)
      cache.current.set(key, result)
      return result
    }) as T,
    deps
  )
}

// Expensive computation memoization
export function useMemoizedComputation<T>(
  computeFn: () => T,
  deps: React.DependencyList,
  shouldRecompute?: (prevDeps: React.DependencyList, newDeps: React.DependencyList) => boolean
): T {
  const prevDepsRef = useRef<React.DependencyList>()
  const resultRef = useRef<T>()

  return useMemo(() => {
    const prevDeps = prevDepsRef.current
    const shouldCompute = !prevDeps ||
      (shouldRecompute ? shouldRecompute(prevDeps, deps) : true)

    if (shouldCompute || resultRef.current === undefined) {
      resultRef.current = computeFn()
    }

    prevDepsRef.current = deps
    return resultRef.current
  }, deps)
}

// Stable reference hook
export function useStableCallback<T extends (...args: any[]) => any>(callback: T): T {
  const callbackRef = useRef<T>(callback)

  // Update the ref when callback changes
  callbackRef.current = callback

  // Return a stable callback that calls the latest version
  return useCallback(
    ((...args: Parameters<T>) => {
      return callbackRef.current(...args)
    }) as T,
    []
  )
}

// Recipe-specific memoization utilities
export const recipeComputations = {
  // Memoize recipe filtering
  filterRecipes: memoizeWithLRU((recipes: any[], filters: any) => {
    return recipes.filter(recipe => {
      // Apply filters logic
      if (filters.difficulty && recipe.difficulty !== filters.difficulty) {
        return false
      }

      if (filters.maxCookTime && recipe.cookTime > filters.maxCookTime) {
        return false
      }

      if (filters.dietary && filters.dietary.length > 0) {
        if (!filters.dietary.every((diet: string) => recipe.dietary?.includes(diet))) {
          return false
        }
      }

      return true
    })
  }, 50),

  // Memoize recipe search
  searchRecipes: memoizeWithLRU((recipes: any[], query: string) => {
    const lowercaseQuery = query.toLowerCase()
    return recipes.filter(recipe =>
      recipe.title.toLowerCase().includes(lowercaseQuery) ||
      recipe.description?.toLowerCase().includes(lowercaseQuery) ||
      recipe.ingredients?.some((ingredient: string) =>
        ingredient.toLowerCase().includes(lowercaseQuery)
      )
    )
  }, 30),

  // Memoize nutrition calculations
  calculateNutrition: memoizeWithLRU((ingredients: any[], servings: number) => {
    const totalCalories = ingredients.reduce((sum, ingredient) =>
      sum + (ingredient.calories || 0) * (ingredient.amount || 0), 0
    )

    return {
      calories: Math.round(totalCalories / servings),
      protein: Math.round(ingredients.reduce((sum, ing) =>
        sum + (ing.protein || 0) * (ing.amount || 0), 0) / servings),
      carbs: Math.round(ingredients.reduce((sum, ing) =>
        sum + (ing.carbs || 0) * (ing.amount || 0), 0) / servings),
      fat: Math.round(ingredients.reduce((sum, ing) =>
        sum + (ing.fat || 0) * (ing.amount || 0), 0) / servings)
    }
  }, 20),

  // Memoize ingredient scaling
  scaleIngredients: memoizeWithLRU((ingredients: any[], fromServings: number, toServings: number) => {
    const scaleFactor = toServings / fromServings
    return ingredients.map(ingredient => ({
      ...ingredient,
      amount: ingredient.amount * scaleFactor
    }))
  }, 30)
}

// Performance monitoring
export function withPerformanceMonitoring<T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T {
  return ((...args: Parameters<T>) => {
    const start = performance.now()
    const result = fn(...args)
    const end = performance.now()

    if (end - start > 10) { // Log if takes more than 10ms
      console.log(`Performance: ${name} took ${end - start}ms`)
    }

    return result
  }) as T
}

// Batch processing utility
export function batchProcess<T, R>(
  items: T[],
  processor: (batch: T[]) => R[],
  batchSize: number = 10
): R[] {
  const results: R[] = []

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = processor(batch)
    results.push(...batchResults)
  }

  return results
}