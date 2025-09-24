"use client"

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface VirtualListProps<T> {
  items: T[]
  itemHeight: number
  containerHeight: number
  overscan?: number
  className?: string
  renderItem: (item: T, index: number) => React.ReactNode
  getItemKey?: (item: T, index: number) => string | number
  onScrollEnd?: () => void
  scrollEndThreshold?: number
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5,
  className,
  renderItem,
  getItemKey,
  onScrollEnd,
  scrollEndThreshold = 100
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const visibleRange = useMemo(() => {
    const containerTop = scrollTop
    const containerBottom = scrollTop + containerHeight

    const startIndex = Math.max(0, Math.floor(containerTop / itemHeight) - overscan)
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil(containerBottom / itemHeight) + overscan
    )

    return { startIndex, endIndex }
  }, [scrollTop, containerHeight, itemHeight, overscan, items.length])

  const visibleItems = useMemo(() => {
    return items
      .slice(visibleRange.startIndex, visibleRange.endIndex + 1)
      .map((item, index) => ({
        item,
        index: visibleRange.startIndex + index
      }))
  }, [items, visibleRange])

  const totalHeight = items.length * itemHeight

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget
    setScrollTop(element.scrollTop)

    // Check if we're near the bottom
    if (onScrollEnd) {
      const { scrollTop, scrollHeight, clientHeight } = element
      if (scrollHeight - scrollTop - clientHeight < scrollEndThreshold) {
        onScrollEnd()
      }
    }
  }, [onScrollEnd, scrollEndThreshold])

  return (
    <div
      ref={containerRef}
      className={cn("overflow-auto", className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index }) => (
          <div
            key={getItemKey ? getItemKey(item, index) : index}
            style={{
              position: 'absolute',
              top: index * itemHeight,
              left: 0,
              right: 0,
              height: itemHeight
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  )
}

// Specialized virtual list for recipes
interface Recipe {
  id: string
  title: string
  description?: string
  imageUrl?: string
}

interface VirtualRecipeListProps {
  recipes: Recipe[]
  onRecipeClick?: (recipe: Recipe) => void
  onLoadMore?: () => void
  isLoading?: boolean
  className?: string
}

export function VirtualRecipeList({
  recipes,
  onRecipeClick,
  onLoadMore,
  isLoading = false,
  className
}: VirtualRecipeListProps) {
  const ITEM_HEIGHT = 120
  const CONTAINER_HEIGHT = 600

  const renderRecipeItem = useCallback((recipe: Recipe, index: number) => (
    <div
      className="flex items-center gap-4 p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
      onClick={() => onRecipeClick?.(recipe)}
    >
      <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0">
        {recipe.imageUrl ? (
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="w-full h-full object-cover rounded-lg"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gray-300 rounded-lg" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 truncate">{recipe.title}</h3>
        {recipe.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mt-1">
            {recipe.description}
          </p>
        )}
      </div>
    </div>
  ), [onRecipeClick])

  return (
    <div className={className}>
      <VirtualList
        items={recipes}
        itemHeight={ITEM_HEIGHT}
        containerHeight={CONTAINER_HEIGHT}
        renderItem={renderRecipeItem}
        getItemKey={(recipe) => recipe.id}
        onScrollEnd={onLoadMore}
        className="border border-gray-200 rounded-lg"
      />
      {isLoading && (
        <div className="text-center py-4">
          <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-gray-600 mt-2">Loading more recipes...</p>
        </div>
      )}
    </div>
  )
}

// Hook for managing virtual list state
export function useVirtualList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0)

  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight)
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight)
    )

    return { startIndex, endIndex }
  }, [scrollTop, itemHeight, containerHeight, items.length])

  const scrollToIndex = useCallback((index: number) => {
    const targetScrollTop = index * itemHeight
    setScrollTop(targetScrollTop)
  }, [itemHeight])

  const scrollToTop = useCallback(() => {
    setScrollTop(0)
  }, [])

  return {
    visibleRange,
    scrollTop,
    setScrollTop,
    scrollToIndex,
    scrollToTop,
    totalHeight: items.length * itemHeight
  }
}