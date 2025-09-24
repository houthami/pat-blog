"use client"

import React from 'react'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  ChefHat,
  Clock,
  Loader2,
  RefreshCw
} from "lucide-react"

interface LoadingStateProps {
  variant?: 'skeleton' | 'spinner' | 'pulse'
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

export function LoadingState({
  variant = 'skeleton',
  size = 'md',
  text,
  className
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  if (variant === 'spinner') {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <div className="text-center space-y-3">
          <Loader2 className={cn("animate-spin text-primary mx-auto", sizeClasses[size])} />
          {text && <p className="text-sm text-muted-foreground">{text}</p>}
        </div>
      </div>
    )
  }

  if (variant === 'pulse') {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <div className="text-center space-y-3">
          <div className={cn("bg-primary/20 rounded-full animate-pulse mx-auto", sizeClasses[size])} />
          {text && <p className="text-sm text-muted-foreground">{text}</p>}
        </div>
      </div>
    )
  }

  // Default skeleton variant
  return (
    <div className={cn("space-y-3", className)}>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}

// Recipe-specific loading states
export function RecipeCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="aspect-[4/3] bg-muted animate-pulse" />
      <CardHeader className="space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </CardHeader>
    </Card>
  )
}

export function RecipeDetailSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>

      {/* Image */}
      <div className="aspect-video bg-muted animate-pulse rounded-lg" />

      {/* Metadata */}
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 text-center">
              <Skeleton className="h-6 w-12 mx-auto mb-2" />
              <Skeleton className="h-4 w-16 mx-auto" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Ingredients */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export function PageLoading({
  message = "Loading...",
  description
}: {
  message?: string
  description?: string
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="relative">
          <ChefHat className="w-16 h-16 text-primary mx-auto" />
          <RefreshCw className="w-6 h-6 text-primary/60 animate-spin absolute -bottom-1 -right-1" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{message}</h2>
          {description && (
            <p className="text-gray-600 max-w-md">{description}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export function InlineLoading({
  size = 'sm',
  text,
  className
}: {
  size?: 'sm' | 'md'
  text?: string
  className?: string
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Loader2 className={cn("animate-spin", size === 'sm' ? 'h-4 w-4' : 'h-5 w-5')} />
      {text && (
        <span className={cn("text-muted-foreground", size === 'sm' ? 'text-sm' : 'text-base')}>
          {text}
        </span>
      )}
    </div>
  )
}

export function ButtonLoading({
  text = "Loading...",
  className
}: {
  text?: string
  className?: string
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{text}</span>
    </div>
  )
}

// Grid loading states
export function RecipeGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(count)].map((_, i) => (
        <RecipeCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {[...Array(columns)].map((_, i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </div>

      {/* Rows */}
      {[...Array(rows)].map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {[...Array(columns)].map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-8 w-full" />
          ))}
        </div>
      ))}
    </div>
  )
}