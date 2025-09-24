"use client"

import React, { useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AccessibleInput } from "@/components/ui/accessible-input"
import { AccessibleButton } from "@/components/ui/accessible-button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Search,
  Filter,
  X,
  ChevronDown,
  Clock,
  Users,
  Star,
  ChefHat,
  Utensils,
  Leaf,
  Wheat,
  Milk,
  Flame
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface RecipeFilters {
  query?: string
  categories?: string[]
  dietary?: string[]
  difficulty?: string[]
  cookTime?: { min: number; max: number }
  prepTime?: { min: number; max: number }
  servings?: { min: number; max: number }
  cuisine?: string[]
  mealType?: string[]
  equipment?: string[]
  ingredients?: string[]
  rating?: number
  sortBy?: 'relevance' | 'newest' | 'oldest' | 'rating' | 'cookTime' | 'popularity'
  sortOrder?: 'asc' | 'desc'
}

interface AdvancedRecipeSearchProps {
  filters: RecipeFilters
  onFiltersChange: (filters: RecipeFilters) => void
  onSearch: () => void
  isLoading?: boolean
  categories?: { id: string; name: string; icon?: string }[]
  popularIngredients?: string[]
  className?: string
}

const dietaryOptions = [
  { value: 'vegetarian', label: 'Vegetarian', icon: <Leaf className="w-4 h-4 text-green-500" /> },
  { value: 'vegan', label: 'Vegan', icon: <Leaf className="w-4 h-4 text-green-600" /> },
  { value: 'gluten-free', label: 'Gluten-Free', icon: <Wheat className="w-4 h-4 text-amber-500" /> },
  { value: 'dairy-free', label: 'Dairy-Free', icon: <Milk className="w-4 h-4 text-blue-500" /> },
  { value: 'keto', label: 'Keto', icon: <Flame className="w-4 h-4 text-red-500" /> },
  { value: 'paleo', label: 'Paleo', icon: <Utensils className="w-4 h-4 text-orange-500" /> },
  { value: 'low-carb', label: 'Low Carb', icon: <ChefHat className="w-4 h-4 text-purple-500" /> },
  { value: 'low-fat', label: 'Low Fat', icon: <Star className="w-4 h-4 text-yellow-500" /> }
]

const cuisineOptions = [
  'Italian', 'French', 'Asian', 'Mexican', 'Indian', 'Mediterranean',
  'American', 'Chinese', 'Japanese', 'Thai', 'Korean', 'Greek',
  'Spanish', 'Middle Eastern', 'British', 'German'
]

const mealTypeOptions = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
  { value: 'dessert', label: 'Dessert' },
  { value: 'appetizer', label: 'Appetizer' },
  { value: 'side', label: 'Side Dish' },
  { value: 'beverage', label: 'Beverage' }
]

const difficultyOptions = [
  { value: 'easy', label: 'Easy', color: 'text-green-600' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
  { value: 'hard', label: 'Hard', color: 'text-red-600' }
]

const sortOptions = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'cookTime', label: 'Shortest Cook Time' },
  { value: 'popularity', label: 'Most Popular' }
]

export function AdvancedRecipeSearch({
  filters,
  onFiltersChange,
  onSearch,
  isLoading = false,
  categories = [],
  popularIngredients = [],
  className
}: AdvancedRecipeSearchProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeFilters, setActiveFilters] = useState<string[]>([])

  const updateFilter = useCallback(<K extends keyof RecipeFilters>(
    key: K,
    value: RecipeFilters[K]
  ) => {
    const newFilters = { ...filters, [key]: value }
    onFiltersChange(newFilters)
  }, [filters, onFiltersChange])

  const addToArrayFilter = useCallback(<K extends keyof RecipeFilters>(
    key: K,
    value: string
  ) => {
    const currentArray = (filters[key] as string[]) || []
    if (!currentArray.includes(value)) {
      updateFilter(key, [...currentArray, value] as RecipeFilters[K])
    }
  }, [filters, updateFilter])

  const removeFromArrayFilter = useCallback(<K extends keyof RecipeFilters>(
    key: K,
    value: string
  ) => {
    const currentArray = (filters[key] as string[]) || []
    updateFilter(key, currentArray.filter(item => item !== value) as RecipeFilters[K])
  }, [filters, updateFilter])

  const clearAllFilters = useCallback(() => {
    onFiltersChange({ query: filters.query, sortBy: 'relevance' })
    setActiveFilters([])
  }, [filters.query, onFiltersChange])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.categories?.length) count++
    if (filters.dietary?.length) count++
    if (filters.difficulty?.length) count++
    if (filters.cuisine?.length) count++
    if (filters.mealType?.length) count++
    if (filters.cookTime && (filters.cookTime.min > 0 || filters.cookTime.max < 240)) count++
    if (filters.servings && (filters.servings.min > 1 || filters.servings.max < 12)) count++
    if (filters.rating && filters.rating > 0) count++
    return count
  }, [filters])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSearch()
    }
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="w-5 h-5" />
            Recipe Search
          </CardTitle>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''}
              </Badge>
            )}
            <AccessibleButton
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1"
              ariaLabel={`${isExpanded ? 'Collapse' : 'Expand'} advanced search filters`}
              ariaExpanded={isExpanded}
            >
              <Filter className="w-4 h-4" />
              <ChevronDown className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-180")} />
            </AccessibleButton>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main Search */}
        <div className="space-y-2">
          <AccessibleInput
            label="Search recipes"
            placeholder="Search by recipe name, ingredients, or cooking method..."
            value={filters.query || ''}
            onChange={(e) => updateFilter('query', e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-base"
            hideLabel
          />

          <div className="flex items-center gap-2">
            <AccessibleButton
              onClick={onSearch}
              disabled={isLoading}
              className="flex items-center gap-2"
              ariaLabel="Search recipes"
            >
              <Search className="w-4 h-4" />
              {isLoading ? 'Searching...' : 'Search'}
            </AccessibleButton>

            <Select
              value={filters.sortBy || 'relevance'}
              onValueChange={(value) => updateFilter('sortBy', value as RecipeFilters['sortBy'])}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {activeFilterCount > 0 && (
              <AccessibleButton
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="flex items-center gap-1"
                ariaLabel="Clear all filters"
              >
                <X className="w-4 h-4" />
                Clear
              </AccessibleButton>
            )}
          </div>
        </div>

        {/* Advanced Filters */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              {/* Categories */}
              {categories.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Categories</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`category-${category.id}`}
                          checked={filters.categories?.includes(category.id) || false}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              addToArrayFilter('categories', category.id)
                            } else {
                              removeFromArrayFilter('categories', category.id)
                            }
                          }}
                        />
                        <Label
                          htmlFor={`category-${category.id}`}
                          className="text-sm font-normal flex items-center gap-2"
                        >
                          {category.icon && <span>{category.icon}</span>}
                          {category.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dietary Restrictions */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Dietary</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {dietaryOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`dietary-${option.value}`}
                        checked={filters.dietary?.includes(option.value) || false}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            addToArrayFilter('dietary', option.value)
                          } else {
                            removeFromArrayFilter('dietary', option.value)
                          }
                        }}
                      />
                      <Label
                        htmlFor={`dietary-${option.value}`}
                        className="text-sm font-normal flex items-center gap-2"
                      >
                        {option.icon}
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Meal Type */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Meal Type</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {mealTypeOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`meal-${option.value}`}
                        checked={filters.mealType?.includes(option.value) || false}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            addToArrayFilter('mealType', option.value)
                          } else {
                            removeFromArrayFilter('mealType', option.value)
                          }
                        }}
                      />
                      <Label htmlFor={`meal-${option.value}`} className="text-sm font-normal">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Cook Time */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Cook Time (minutes)
                </Label>
                <div className="space-y-3">
                  <div className="px-3">
                    <Slider
                      value={[filters.cookTime?.min || 0, filters.cookTime?.max || 240]}
                      onValueChange={([min, max]) => updateFilter('cookTime', { min, max })}
                      max={240}
                      min={0}
                      step={5}
                      className="w-full"
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{filters.cookTime?.min || 0} min</span>
                    <span>{filters.cookTime?.max || 240} min</span>
                  </div>
                </div>
              </div>

              {/* Servings */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Servings
                </Label>
                <div className="space-y-3">
                  <div className="px-3">
                    <Slider
                      value={[filters.servings?.min || 1, filters.servings?.max || 12]}
                      onValueChange={([min, max]) => updateFilter('servings', { min, max })}
                      max={12}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{filters.servings?.min || 1}</span>
                    <span>{filters.servings?.max || 12}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Difficulty & Rating */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Difficulty */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Difficulty</Label>
                <div className="flex flex-wrap gap-2">
                  {difficultyOptions.map((option) => (
                    <AccessibleButton
                      key={option.value}
                      variant={filters.difficulty?.includes(option.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const isSelected = filters.difficulty?.includes(option.value)
                        if (isSelected) {
                          removeFromArrayFilter('difficulty', option.value)
                        } else {
                          addToArrayFilter('difficulty', option.value)
                        }
                      }}
                      className={cn("flex items-center gap-1", option.color)}
                      ariaPressed={filters.difficulty?.includes(option.value)}
                    >
                      <ChefHat className="w-3 h-3" />
                      {option.label}
                    </AccessibleButton>
                  ))}
                </div>
              </div>

              {/* Minimum Rating */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Minimum Rating
                </Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <AccessibleButton
                      key={rating}
                      variant="ghost"
                      size="sm"
                      onClick={() => updateFilter('rating', rating === filters.rating ? 0 : rating)}
                      className={cn(
                        "p-1",
                        (filters.rating || 0) >= rating ? "text-yellow-500" : "text-gray-300"
                      )}
                      ariaLabel={`Minimum ${rating} star${rating !== 1 ? 's' : ''}`}
                    >
                      <Star className={cn("w-5 h-5", (filters.rating || 0) >= rating && "fill-current")} />
                    </AccessibleButton>
                  ))}
                </div>
              </div>

            </div>

            {/* Cuisine */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Cuisine</Label>
              <div className="flex flex-wrap gap-2">
                {cuisineOptions.map((cuisine) => (
                  <AccessibleButton
                    key={cuisine}
                    variant={filters.cuisine?.includes(cuisine) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const isSelected = filters.cuisine?.includes(cuisine)
                      if (isSelected) {
                        removeFromArrayFilter('cuisine', cuisine)
                      } else {
                        addToArrayFilter('cuisine', cuisine)
                      }
                    }}
                    ariaPressed={filters.cuisine?.includes(cuisine)}
                  >
                    {cuisine}
                  </AccessibleButton>
                ))}
              </div>
            </div>

          </CollapsibleContent>
        </Collapsible>

        {/* Active Filters Display */}
        {activeFilterCount > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Active Filters:</Label>
            <div className="flex flex-wrap gap-2">
              {filters.categories?.map((categoryId) => {
                const category = categories.find(c => c.id === categoryId)
                return category ? (
                  <Badge key={categoryId} variant="secondary" className="flex items-center gap-1">
                    {category.icon && <span>{category.icon}</span>}
                    {category.name}
                    <AccessibleButton
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromArrayFilter('categories', categoryId)}
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      ariaLabel={`Remove ${category.name} filter`}
                    >
                      <X className="w-3 h-3" />
                    </AccessibleButton>
                  </Badge>
                ) : null
              })}

              {filters.dietary?.map((dietary) => (
                <Badge key={dietary} variant="secondary" className="flex items-center gap-1">
                  {dietaryOptions.find(d => d.value === dietary)?.icon}
                  {dietaryOptions.find(d => d.value === dietary)?.label}
                  <AccessibleButton
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromArrayFilter('dietary', dietary)}
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    ariaLabel={`Remove ${dietary} filter`}
                  >
                    <X className="w-3 h-3" />
                  </AccessibleButton>
                </Badge>
              ))}

              {filters.difficulty?.map((difficulty) => (
                <Badge key={difficulty} variant="secondary" className="flex items-center gap-1">
                  <ChefHat className="w-3 h-3" />
                  {difficulty}
                  <AccessibleButton
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromArrayFilter('difficulty', difficulty)}
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    ariaLabel={`Remove ${difficulty} difficulty filter`}
                  >
                    <X className="w-3 h-3" />
                  </AccessibleButton>
                </Badge>
              ))}

              {(filters.rating && filters.rating > 0) && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  {filters.rating}+ stars
                  <AccessibleButton
                    variant="ghost"
                    size="sm"
                    onClick={() => updateFilter('rating', 0)}
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    ariaLabel="Remove rating filter"
                  >
                    <X className="w-3 h-3" />
                  </AccessibleButton>
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}