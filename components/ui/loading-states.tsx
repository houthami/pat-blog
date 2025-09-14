import React from "react"
import { cn } from "@/lib/utils"
import { ChefHat, Loader2 } from "lucide-react"
import { designTokens } from "@/lib/design-tokens"

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

// Recipe Card Skeleton
export function RecipeCardSkeleton() {
  return (
    <div className="bg-card border rounded-lg overflow-hidden">
      <Skeleton className="h-48 w-full" />
      <div className="p-6">
        <Skeleton variant="text" className="w-3/4 mb-2" />
        <Skeleton variant="text" className="w-1/2 mb-4" />
        <div className="flex justify-between items-center">
          <Skeleton variant="text" className="w-1/4" />
          <Skeleton variant="text" className="w-1/4" />
        </div>
      </div>
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