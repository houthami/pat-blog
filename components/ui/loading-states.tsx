import React from "react"
import { cn } from "@/lib/utils"
import { ChefHat, Loader2, Search } from "lucide-react"

// Loading Spinner Component
interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl"
  variant?: "default" | "primary" | "muted"
}

export function LoadingSpinner({
  size = "md",
  variant = "default",
  className,
  ...props
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  }

  const variantClasses = {
    default: "text-foreground",
    primary: "text-primary",
    muted: "text-muted-foreground",
  }

  return (
    <div className={cn("flex items-center justify-center", className)} {...props}>
      <Loader2
        className={cn(
          "animate-spin",
          sizeClasses[size],
          variantClasses[variant]
        )}
        aria-label="Loading"
      />
    </div>
  )
}

// Loading Skeleton Components
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "circular" | "text"
}

export function Skeleton({
  variant = "default",
  className,
  ...props
}: SkeletonProps) {
  const variantClasses = {
    default: "rounded-md",
    circular: "rounded-full",
    text: "rounded-sm h-4",
  }

  return (
    <div
      className={cn(
        "animate-pulse bg-muted",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
}

// Enhanced Recipe Card Skeleton with Modern Design
export function RecipeCardSkeleton() {
  return (
    <div className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl overflow-hidden animate-pulse">
      {/* Image Skeleton with Shimmer */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-100">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 animate-shimmer" />
        {/* Badges Skeleton */}
        <div className="absolute top-3 left-3 flex gap-2">
          <Skeleton className="w-16 h-6 rounded-full" />
          <Skeleton className="w-12 h-6 rounded-full" />
        </div>
        <div className="absolute top-3 right-3">
          <Skeleton className="w-12 h-6 rounded-full" />
        </div>
        {/* Quick Info Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="w-16 h-4 bg-white/20" />
            <Skeleton className="w-20 h-4 bg-white/20" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Title */}
        <div className="space-y-2">
          <Skeleton className="h-6 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* Social Proof */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-4" />
            <Skeleton className="w-10 h-4" />
          </div>
          <Skeleton className="w-16 h-4" />
        </div>
      </div>
    </div>
  )
}

// Modern List View Recipe Skeleton
export function RecipeListSkeleton() {
  return (
    <div className="bg-white/80 backdrop-blur-sm border-0 shadow-md rounded-xl p-6 animate-pulse">
      <div className="flex gap-6">
        {/* Image */}
        <div className="relative w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-orange-100 to-amber-100" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 animate-shimmer" />
          <div className="absolute top-2 right-2">
            <Skeleton className="w-8 h-4 bg-black/20" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="flex gap-2 ml-4">
              <Skeleton className="w-16 h-6 rounded-full" />
              <Skeleton className="w-20 h-6 rounded-full" />
            </div>
          </div>

          {/* Meta Info */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <Skeleton className="w-12 h-4" />
              <Skeleton className="w-16 h-4" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="w-8 h-4" />
              <Skeleton className="w-10 h-4" />
              <Skeleton className="w-12 h-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Enhanced Recipe Page Skeleton
export function RecipePageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-background to-amber-50/30">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-orange-100 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <Skeleton className="w-32 h-8" />
            <div className="flex items-center gap-3">
              <Skeleton className="w-24 h-8 rounded-full" />
              <Skeleton className="w-20 h-8" />
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <article className="max-w-6xl mx-auto animate-pulse">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Skeleton className="w-16 h-6 rounded-full" />
              <Skeleton className="w-20 h-6 rounded-full" />
              <Skeleton className="w-18 h-6 rounded-full" />
            </div>
            <Skeleton className="h-12 w-4/5 mx-auto mb-4" />
            <Skeleton className="h-6 w-3/4 mx-auto mb-6" />

            {/* Quick Stats */}
            <div className="flex items-center justify-center gap-8 mt-6 flex-wrap">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="w-5 h-5 rounded" />
                  <div>
                    <Skeleton className="w-12 h-5 mb-1" />
                    <Skeleton className="w-16 h-3" />
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <Skeleton className="w-32 h-12 rounded-lg" />
              <Skeleton className="w-28 h-12 rounded-lg" />
              <Skeleton className="w-28 h-12 rounded-lg" />
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative aspect-[16/10] mb-12 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-100">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 animate-shimmer" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-center justify-between">
                <Skeleton className="w-24 h-4 bg-white/30" />
                <Skeleton className="w-20 h-4 bg-white/30" />
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Ingredients */}
              <div className="border-0 shadow-lg bg-white/80 backdrop-blur-sm rounded-lg">
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4 rounded-t-lg">
                  <Skeleton className="w-32 h-6 bg-white/30" />
                </div>
                <div className="p-6 space-y-3">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="w-2 h-2 rounded-full" />
                      <Skeleton className="h-4 flex-1" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div className="border-0 shadow-lg bg-white/80 backdrop-blur-sm rounded-lg">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-t-lg">
                  <Skeleton className="w-28 h-6 bg-white/30" />
                </div>
                <div className="p-6 space-y-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex gap-4">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm rounded-lg p-6">
                  <Skeleton className="w-32 h-6 mb-4" />
                  <div className="space-y-3">
                    <Skeleton className="w-full h-10" />
                    <Skeleton className="w-full h-10" />
                    <Skeleton className="w-full h-10" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>
      </main>
    </div>
  )
}

// Dashboard Card Skeleton
export function DashboardCardSkeleton() {
  return (
    <div className="bg-card border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton variant="text" className="w-1/3" />
        <Skeleton variant="circular" className="w-8 h-8" />
      </div>
      <Skeleton variant="text" className="w-1/2 h-8 mb-2" />
      <Skeleton variant="text" className="w-2/3" />
    </div>
  )
}

// Table Row Skeleton
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} className="px-6 py-4">
          <Skeleton variant="text" className="w-full" />
        </td>
      ))}
    </tr>
  )
}

// Page Loading State
interface PageLoadingProps {
  title?: string
  description?: string
}

export function PageLoading({
  title = "Loading...",
  description = "Please wait while we load your content",
}: PageLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="relative">
        <ChefHat className="w-16 h-16 text-primary opacity-20" />
        <Loader2 className="w-8 h-8 text-primary animate-spin absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-lg font-medium text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-md">{description}</p>
      </div>
    </div>
  )
}

// Content Loading State with Shimmer Effect
export function ContentLoading({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-muted rounded w-3/4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded"></div>
          <div className="h-4 bg-muted rounded w-5/6"></div>
        </div>
        <div className="h-4 bg-muted rounded w-1/2"></div>
      </div>
    </div>
  )
}

// Button Loading State
interface ButtonLoadingProps {
  isLoading?: boolean
  children: React.ReactNode
  loadingText?: string
}

export function ButtonLoading({
  isLoading = false,
  children,
  loadingText = "Loading...",
}: ButtonLoadingProps) {
  if (isLoading) {
    return (
      <span className="flex items-center">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        {loadingText}
      </span>
    )
  }
  return <>{children}</>
}

// List Loading State
export function ListLoading({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center space-x-3 p-3">
          <Skeleton variant="circular" className="w-10 h-10" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="w-1/2" />
            <Skeleton variant="text" className="w-3/4" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Progressive Loading Component
interface ProgressiveLoadingProps {
  stages: string[]
  currentStage: number
}

export function ProgressiveLoading({
  stages,
  currentStage,
}: ProgressiveLoadingProps) {
  const progress = ((currentStage + 1) / stages.length) * 100

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>{stages[currentStage]}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// Modern Search Loading State
export function SearchLoadingState() {
  return (
    <div className="text-center py-12">
      <div className="relative inline-block">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-200 to-amber-200 rounded-full animate-pulse" />
        <div className="absolute inset-0 w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
      <h3 className="text-lg font-medium mt-4 text-gray-700">Searching recipes...</h3>
      <p className="text-sm text-gray-500 mt-2">Finding the perfect match for you</p>
    </div>
  )
}

// Hero Loading State
export function HeroLoadingState() {
  return (
    <div className="relative bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-500 text-white overflow-hidden">
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center animate-pulse">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 bg-white/20 rounded-2xl" />
            <div className="text-left">
              <div className="h-12 w-64 bg-white/20 rounded mb-2" />
              <div className="h-6 w-48 bg-orange-100/20 rounded" />
            </div>
          </div>
          <div className="h-6 w-96 bg-orange-100/20 rounded mx-auto mb-8" />
          <div className="flex items-center justify-center gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm">
                <div className="h-4 w-20 bg-white/30 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}