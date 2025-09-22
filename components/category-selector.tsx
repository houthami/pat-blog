"use client"

import { useState, useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { ChevronRight } from "lucide-react"

interface Category {
  id: string
  name: string
  slug: string
  color: string
  parentId?: string
  parent?: Category
  children?: Category[]
  isActive: boolean
}

interface CategorySelectorProps {
  value?: string
  onChange: (categoryId: string | undefined) => void
  label?: string
  placeholder?: string
  required?: boolean
}

export function CategorySelector({
  value,
  onChange,
  label = "Category",
  placeholder = "Select a category",
  required = false
}: CategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.filter((cat: Category) => cat.isActive))
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const buildCategoryTree = (categories: Category[]): Category[] => {
    const categoryMap = new Map<string, Category>()
    const rootCategories: Category[] = []

    // Create a map of all categories
    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] })
    })

    // Build the tree structure
    categories.forEach(category => {
      const cat = categoryMap.get(category.id)!
      if (category.parentId) {
        const parent = categoryMap.get(category.parentId)
        if (parent) {
          parent.children = parent.children || []
          parent.children.push(cat)
        }
      } else {
        rootCategories.push(cat)
      }
    })

    return rootCategories
  }

  const renderCategoryOptions = (categories: Category[], level = 0): JSX.Element[] => {
    const options: JSX.Element[] = []

    categories.forEach(category => {
      const indent = "  ".repeat(level)
      const displayName = level > 0 ? `${indent}${category.name}` : category.name

      options.push(
        <SelectItem key={category.id} value={category.id}>
          <div className="flex items-center gap-2">
            {level > 0 && (
              <div className="flex items-center text-muted-foreground">
                {Array.from({ length: level }, (_, i) => (
                  <ChevronRight key={i} className="h-3 w-3" />
                ))}
              </div>
            )}
            <div
              className="w-3 h-3 rounded-full border"
              style={{ backgroundColor: category.color }}
            />
            <span>{category.name}</span>
          </div>
        </SelectItem>
      )

      if (category.children && category.children.length > 0) {
        options.push(...renderCategoryOptions(category.children, level + 1))
      }
    })

    return options
  }

  const getSelectedCategory = (): Category | undefined => {
    return categories.find(cat => cat.id === value)
  }

  const categoryTree = buildCategoryTree(categories)
  const selectedCategory = getSelectedCategory()

  return (
    <div className="space-y-2">
      {label && (
        <Label>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}

      <Select
        value={value || "none"}
        onValueChange={(newValue) => onChange(newValue === "none" ? undefined : newValue)}
        disabled={isLoading}
      >
        <SelectTrigger>
          <SelectValue placeholder={isLoading ? "Loading categories..." : placeholder}>
            {selectedCategory && (
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full border"
                  style={{ backgroundColor: selectedCategory.color }}
                />
                <span>{selectedCategory.name}</span>
                {selectedCategory.parent && (
                  <Badge variant="outline" className="text-xs">
                    in {selectedCategory.parent.name}
                  </Badge>
                )}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <span className="text-muted-foreground">No category</span>
          </SelectItem>
          {categoryTree.length > 0 ? (
            renderCategoryOptions(categoryTree)
          ) : (
            !isLoading && (
              <SelectItem value="no-categories" disabled>
                <span className="text-muted-foreground">No categories available</span>
              </SelectItem>
            )
          )}
        </SelectContent>
      </Select>

      {selectedCategory && selectedCategory.parent && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>In category:</span>
          <div className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: selectedCategory.parent.color }}
            />
            <span>{selectedCategory.parent.name}</span>
          </div>
        </div>
      )}
    </div>
  )
}