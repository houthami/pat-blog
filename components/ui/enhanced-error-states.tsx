"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AccessibleButton } from "@/components/ui/accessible-button"
import { Badge } from "@/components/ui/badge"
import {
  AlertTriangle,
  RefreshCw,
  Wifi,
  WifiOff,
  ShieldAlert,
  Search,
  ChefHat,
  FileQuestion,
  ServerCrash
} from "lucide-react"
import { APIError } from "@/lib/api/error-handling"
import { cn } from "@/lib/utils"

interface ErrorStateProps {
  error: APIError | Error | string
  onRetry?: () => void
  className?: string
  variant?: 'card' | 'inline' | 'page'
  showDetails?: boolean
}

export function ErrorState({
  error,
  onRetry,
  className,
  variant = 'card',
  showDetails = false
}: ErrorStateProps) {
  const apiError = error instanceof APIError ? error : null
  const errorMessage = typeof error === 'string' ? error : error.message

  const getErrorIcon = () => {
    if (apiError?.isNetworkError()) {
      return <WifiOff className="w-12 h-12 text-red-500" />
    }
    if (apiError?.status === 401) {
      return <ShieldAlert className="w-12 h-12 text-orange-500" />
    }
    if (apiError?.status === 404) {
      return <FileQuestion className="w-12 h-12 text-blue-500" />
    }
    if (apiError?.isServerError()) {
      return <ServerCrash className="w-12 h-12 text-red-600" />
    }
    return <AlertTriangle className="w-12 h-12 text-red-500" />
  }

  const getErrorTitle = () => {
    if (apiError?.isNetworkError()) {
      return "Connection Problem"
    }
    if (apiError?.status === 401) {
      return "Authentication Required"
    }
    if (apiError?.status === 404) {
      return "Not Found"
    }
    if (apiError?.isServerError()) {
      return "Server Error"
    }
    return "Something Went Wrong"
  }

  const getErrorDescription = () => {
    if (apiError) {
      return apiError.getUserMessage()
    }
    return errorMessage
  }

  const getRetryability = () => {
    return apiError?.isRetryable() ?? true
  }

  if (variant === 'inline') {
    return (
      <div className={cn("flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg", className)}>
        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-red-800">{getErrorDescription()}</p>
        </div>
        {onRetry && getRetryability() && (
          <AccessibleButton
            size="sm"
            variant="outline"
            onClick={onRetry}
            className="text-red-600 border-red-300 hover:bg-red-50"
            ariaLabel="Retry failed operation"
          >
            <RefreshCw className="w-4 h-4" />
          </AccessibleButton>
        )}
      </div>
    )
  }

  if (variant === 'page') {
    return (
      <div className={cn("min-h-[60vh] flex items-center justify-center p-8", className)}>
        <div className="text-center space-y-6 max-w-md">
          {getErrorIcon()}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{getErrorTitle()}</h1>
            <p className="text-gray-600 mb-4">{getErrorDescription()}</p>
            {showDetails && apiError && (
              <details className="text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Technical Details
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono">
                  <p>Status: {apiError.status}</p>
                  <p>Code: {apiError.code}</p>
                  {apiError.details && (
                    <p>Details: {JSON.stringify(apiError.details, null, 2)}</p>
                  )}
                </div>
              </details>
            )}
          </div>
          {onRetry && getRetryability() && (
            <AccessibleButton
              onClick={onRetry}
              className="bg-primary hover:bg-primary/90"
              ariaLabel="Retry failed operation"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </AccessibleButton>
          )}
        </div>
      </div>
    )
  }

  // Card variant (default)
  return (
    <Card className={cn("border-red-200", className)}>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          {getErrorIcon()}
        </div>
        <CardTitle className="text-lg text-red-800">{getErrorTitle()}</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-gray-600">{getErrorDescription()}</p>

        {apiError && (
          <div className="flex justify-center">
            <Badge variant="outline" className="text-xs">
              Error {apiError.status} - {apiError.code}
            </Badge>
          </div>
        )}

        {showDetails && apiError && (
          <details className="text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Technical Details
            </summary>
            <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono">
              <p>Status: {apiError.status}</p>
              <p>Code: {apiError.code}</p>
              {apiError.details && (
                <p>Details: {JSON.stringify(apiError.details, null, 2)}</p>
              )}
            </div>
          </details>
        )}

        {onRetry && getRetryability() && (
          <AccessibleButton
            onClick={onRetry}
            className="w-full"
            ariaLabel="Retry failed operation"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </AccessibleButton>
        )}
      </CardContent>
    </Card>
  )
}

// Specialized error components
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      error={APIError.networkError()}
      onRetry={onRetry}
      variant="card"
    />
  )
}

export function NotFoundError({
  message = "The recipe you're looking for doesn't exist or has been removed.",
  onRetry
}: {
  message?: string
  onRetry?: () => void
}) {
  return (
    <Card className="text-center py-12">
      <CardContent>
        <ChefHat className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <CardTitle className="mb-2">Recipe Not Found</CardTitle>
        <p className="text-muted-foreground mb-4">{message}</p>
        {onRetry && (
          <AccessibleButton onClick={onRetry} variant="outline">
            <Search className="w-4 h-4 mr-2" />
            Search Recipes
          </AccessibleButton>
        )}
      </CardContent>
    </Card>
  )
}

export function UnauthorizedError({ onLogin }: { onLogin?: () => void }) {
  return (
    <ErrorState
      error={APIError.unauthorizedError("Please log in to access this content.")}
      onRetry={onLogin}
      variant="page"
    />
  )
}