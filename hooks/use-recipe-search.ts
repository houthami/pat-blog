"use client"

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useApiQuery } from '@/hooks/use-api'
import { RecipeFilters } from '@/components/search/advanced-recipe-search'

interface Recipe {
  id: string
  title: string
  description: string | null
  imageUrl: string | null
  createdAt: string
  difficulty?: 'easy' | 'medium' | 'hard'
  prepTime?: number
  cookTime?: number
  servings?: number
  cuisine?: string
  mealType?: string[]
  author: {
    name: string | null
    image?: string | null
  }
  _count?: {
    interactions: number
    views: number
    comments: number
  }
  averageRating?: number
  category?: {
    id: string
    name: string
    slug: string
    color: string
    icon?: string
  }
}

interface SearchResponse {
  recipes: Recipe[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
    hasNext: boolean
    hasPrev: boolean
  }
  facets?: {
    categories: { id: string; name: string; count: number }[]
    cuisines: { name: string; count: number }[]
    difficulties: { level: string; count: number }[]
    mealTypes: { type: string; count: number }[]
  }
}

export function useRecipeSearch(initialFilters: RecipeFilters = {}) {
  const [filters, setFilters] = useState<RecipeFilters>({
    sortBy: 'relevance',
    ...initialFilters
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [searchHistory, setSearchHistory] = useState<string[]>([])

  // Debounced search query
  const [debouncedQuery, setDebouncedQuery] = useState(filters.query || '')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(filters.query || '')
    }, 300)

    return () => clearTimeout(timer)
  }, [filters.query])

  // Build search params
  const searchParams = useMemo(() => {
    const params: Record<string, string> = {
      page: currentPage.toString(),
      limit: '12'
    }

    if (debouncedQuery) {
      params.query = debouncedQuery
    }

    if (filters.categories?.length) {
      params.categories = filters.categories.join(',')
    }

    if (filters.dietary?.length) {
      params.dietary = filters.dietary.join(',')
    }

    if (filters.difficulty?.length) {
      params.difficulty = filters.difficulty.join(',')
    }

    if (filters.cuisine?.length) {
      params.cuisine = filters.cuisine.join(',')
    }

    if (filters.mealType?.length) {
      params.mealType = filters.mealType.join(',')
    }

    if (filters.cookTime) {
      params.cookTimeMin = filters.cookTime.min.toString()
      params.cookTimeMax = filters.cookTime.max.toString()
    }

    if (filters.prepTime) {
      params.prepTimeMin = filters.prepTime.min.toString()
      params.prepTimeMax = filters.prepTime.max.toString()
    }

    if (filters.servings) {
      params.servingsMin = filters.servings.min.toString()
      params.servingsMax = filters.servings.max.toString()
    }

    if (filters.rating) {
      params.minRating = filters.rating.toString()
    }

    if (filters.sortBy) {
      params.sortBy = filters.sortBy
    }

    if (filters.sortOrder) {
      params.sortOrder = filters.sortOrder
    }

    return params
  }, [filters, debouncedQuery, currentPage])

  // Search function
  const searchFn = useCallback(async (): Promise<SearchResponse> => {
    const searchParamsString = new URLSearchParams(searchParams).toString()
    const response = await fetch(`/api/blog/recipes?${searchParamsString}`)

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`)
    }

    return response.json()
  }, [searchParams])

  // Use API query with auto-refetch when params change
  const {
    data,
    isLoading,
    error,
    refetch
  } = useApiQuery(searchFn, {
    enabled: true
  })

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<RecipeFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setCurrentPage(1) // Reset to first page when filters change
  }, [])

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({ sortBy: 'relevance' })
    setCurrentPage(1)
  }, [])

  // Search action
  const search = useCallback(() => {
    // Add to search history if there's a query
    if (filters.query && filters.query.trim()) {
      setSearchHistory(prev => {
        const newHistory = [filters.query!, ...prev.filter(q => q !== filters.query)]
        return newHistory.slice(0, 10) // Keep last 10 searches
      })
    }

    refetch()
  }, [filters.query, refetch])

  // Auto-search when debouncedQuery changes
  useEffect(() => {
    if (debouncedQuery !== filters.query) {
      search()
    }
  }, [debouncedQuery, filters.query, search])

  // Auto-search when filters change (but not query)
  useEffect(() => {
    const { query, ...otherFilters } = filters
    const hasNonQueryFilters = Object.values(otherFilters).some(value => {
      if (Array.isArray(value)) return value.length > 0
      if (typeof value === 'object' && value !== null) return true
      return value !== undefined && value !== null && value !== ''
    })

    if (hasNonQueryFilters) {
      search()
    }
  }, [filters, search])

  // Pagination
  const goToPage = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const nextPage = useCallback(() => {
    if (data?.pagination.hasNext) {
      setCurrentPage(prev => prev + 1)
    }
  }, [data?.pagination.hasNext])

  const previousPage = useCallback(() => {
    if (data?.pagination.hasPrev) {
      setCurrentPage(prev => prev - 1)
    }
  }, [data?.pagination.hasPrev])

  // Quick filters
  const applyQuickFilter = useCallback((type: string, value: string) => {
    switch (type) {
      case 'category':
        updateFilters({
          categories: [value]
        })
        break
      case 'dietary':
        updateFilters({
          dietary: [value]
        })
        break
      case 'difficulty':
        updateFilters({
          difficulty: [value]
        })
        break
      case 'cuisine':
        updateFilters({
          cuisine: [value]
        })
        break
      case 'mealType':
        updateFilters({
          mealType: [value]
        })
        break
      default:
        break
    }
  }, [updateFilters])

  // Suggested searches based on current filters
  const suggestedSearches = useMemo(() => {
    const suggestions: string[] = []

    if (filters.dietary?.length) {
      suggestions.push(`${filters.dietary[0]} recipes`)
    }

    if (filters.mealType?.length) {
      suggestions.push(`${filters.mealType[0]} ideas`)
    }

    if (filters.cuisine?.length) {
      suggestions.push(`${filters.cuisine[0]} cuisine`)
    }

    if (filters.difficulty?.length) {
      suggestions.push(`${filters.difficulty[0]} recipes`)
    }

    return suggestions.slice(0, 5)
  }, [filters])

  // Search statistics
  const searchStats = useMemo(() => {
    if (!data) return null

    return {
      totalResults: data.pagination.total,
      currentPage: data.pagination.page,
      totalPages: data.pagination.pages,
      resultsPerPage: data.pagination.limit,
      hasFilters: Object.keys(filters).some(key => {
        const value = filters[key as keyof RecipeFilters]
        if (key === 'sortBy') return false
        if (Array.isArray(value)) return value.length > 0
        if (typeof value === 'object' && value !== null) return true
        return value !== undefined && value !== null && value !== ''
      })
    }
  }, [data, filters])

  return {
    // Data
    recipes: data?.recipes || [],
    pagination: data?.pagination,
    facets: data?.facets,

    // State
    filters,
    currentPage,
    isLoading,
    error,

    // Actions
    updateFilters,
    clearFilters,
    search,
    refetch,

    // Pagination
    goToPage,
    nextPage,
    previousPage,

    // Quick actions
    applyQuickFilter,

    // Helpers
    searchHistory,
    suggestedSearches,
    searchStats
  }
}