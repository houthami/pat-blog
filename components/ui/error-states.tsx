import React from "react"
import { AlertTriangle, RefreshCw, Home, ChefHat, Wifi, Server, Shield } from "lucide-react"
import { EnhancedButton } from "@/components/ui/enhanced-button"
import { EnhancedCard, EnhancedCardContent, EnhancedCardDescription, EnhancedCardHeader, EnhancedCardTitle } from "@/components/ui/enhanced-card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

// Base Error Component
interface ErrorStateProps {
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  variant?: "default" | "destructive" | "warning" | "info"
  icon?: React.ComponentType<{ className?: string }>
  className?: string
}

export function ErrorState({
  title = "Something went wrong",
  description = "We encountered an unexpected error. Please try again.",
  action,
  variant = "default",
  icon: Icon = AlertTriangle,
  className,
}: ErrorStateProps) {
  const variantClasses = {
    default: "text-foreground",
    destructive: "text-destructive",
    warning: "text-yellow-600",
    info: "text-blue-600",
  }

  return (
    <div className={cn("flex flex-col items-center justify-center min-h-[300px] text-center space-y-4", className)}>
      <Icon className={cn("w-16 h-16", variantClasses[variant])} />
      <div className="space-y-2 max-w-md">
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {action && (
        <EnhancedButton onClick={action.onClick} variant="outline">
          {action.label}
        </EnhancedButton>
      )}
    </div>
  )
}

// Network Error
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      icon={Wifi}
      title="Connection Error"
      description="Unable to connect to the server. Please check your internet connection and try again."
      action={onRetry ? { label: "Retry", onClick: onRetry } : undefined}
      variant="warning"
    />
  )
}

// Server Error
export function ServerError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      icon={Server}
      title="Server Error"
      description="Our servers are experiencing issues. Please try again in a few minutes."
      action={onRetry ? { label: "Retry", onClick: onRetry } : undefined}
      variant="destructive"
    />
  )
}

// Permission Error
export function PermissionError({ onGoHome }: { onGoHome?: () => void }) {
  return (
    <ErrorState
      icon={Shield}
      title="Access Denied"
      description="You don't have permission to access this resource. Please contact your administrator."
      action={onGoHome ? { label: "Go Home", onClick: onGoHome } : undefined}
      variant="warning"
    />
  )
}

// Not Found Error
export function NotFoundError({ onGoHome, resourceType = "page" }: { onGoHome?: () => void; resourceType?: string }) {
  return (
    <ErrorState
      icon={ChefHat}
      title={`${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} Not Found`}
      description={`The ${resourceType} you're looking for doesn't exist or has been removed.`}
      action={onGoHome ? { label: "Go Home", onClick: onGoHome } : undefined}
      variant="info"
    />
  )
}

// Form Error Component
interface FormErrorProps {
  errors: string[]
  className?: string
}

export function FormError({ errors, className }: FormErrorProps) {
  if (errors.length === 0) return null

  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        {errors.length === 1 ? (
          errors[0]
        ) : (
          <ul className="list-disc list-inside space-y-1">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        )}
      </AlertDescription>
    </Alert>
  )
}

// Inline Error Message
interface InlineErrorProps {
  message: string
  className?: string
}

export function InlineError({ message, className }: InlineErrorProps) {
  return (
    <div className={cn("flex items-center text-sm text-destructive", className)}>
      <AlertTriangle className="w-4 h-4 mr-1 flex-shrink-0" />
      <span>{message}</span>
    </div>
  )
}

// Error Boundary Fallback
interface ErrorBoundaryFallbackProps {
  error: Error
  resetError: () => void
}

export function ErrorBoundaryFallback({ error, resetError }: ErrorBoundaryFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <EnhancedCard className="max-w-lg w-full" variant="elevated">
        <EnhancedCardHeader className="text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <EnhancedCardTitle>Application Error</EnhancedCardTitle>
          <EnhancedCardDescription>
            Something unexpected happened. We've been notified and are working to fix it.
          </EnhancedCardDescription>
        </EnhancedCardHeader>
        <EnhancedCardContent className="space-y-4">
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Show error details
            </summary>
            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
              {error.message}
            </pre>
          </details>
          <div className="flex gap-2 justify-center">
            <EnhancedButton onClick={resetError} leftIcon={<RefreshCw className="w-4 h-4" />}>
              Try Again
            </EnhancedButton>
            <EnhancedButton
              variant="outline"
              onClick={() => window.location.href = "/"}
              leftIcon={<Home className="w-4 h-4" />}
            >
              Go Home
            </EnhancedButton>
          </div>
        </EnhancedCardContent>
      </EnhancedCard>
    </div>
  )
}

// Retry Component
interface RetryComponentProps {
  onRetry: () => void
  message?: string
  isRetrying?: boolean
}

export function RetryComponent({
  onRetry,
  message = "Something went wrong. Please try again.",
  isRetrying = false,
}: RetryComponentProps) {
  return (
    <div className="flex flex-col items-center space-y-4 p-8 text-center">
      <AlertTriangle className="w-12 h-12 text-muted-foreground" />
      <p className="text-muted-foreground">{message}</p>
      <EnhancedButton
        onClick={onRetry}
        loading={isRetrying}
        loadingText="Retrying..."
        leftIcon={<RefreshCw className="w-4 h-4" />}
      >
        Retry
      </EnhancedButton>
    </div>
  )
}

// Error Toast Helper (for use with toast library)
export const errorToastConfig = {
  error: {
    duration: 5000,
    style: {
      background: 'hsl(var(--destructive))',
      color: 'hsl(var(--destructive-foreground))',
    },
  },
  warning: {
    duration: 4000,
    style: {
      background: 'hsl(45 100% 51%)',
      color: 'hsl(0 0% 0%)',
    },
  },
}

// Error Message Formatter
export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'An unexpected error occurred'
}

// API Error Response Handler
export interface ApiError {
  message: string
  status?: number
  field?: string
}

export function handleApiError(error: any): ApiError {
  if (error?.response?.data) {
    return {
      message: error.response.data.message || 'API request failed',
      status: error.response.status,
      field: error.response.data.field,
    }
  }

  if (error?.message) {
    return { message: error.message }
  }

  return { message: 'Network request failed' }
}