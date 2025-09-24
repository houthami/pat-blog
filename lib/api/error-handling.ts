"use client"

// API Error Types
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'APIError'
  }

  static fromResponse(response: Response, details?: any): APIError {
    const statusText = response.statusText || 'Unknown error'
    return new APIError(
      `API Error: ${statusText}`,
      response.status,
      response.status.toString(),
      details
    )
  }

  static networkError(message: string = 'Network error occurred'): APIError {
    return new APIError(message, 0, 'NETWORK_ERROR')
  }

  static validationError(message: string, details?: any): APIError {
    return new APIError(message, 400, 'VALIDATION_ERROR', details)
  }

  static unauthorizedError(message: string = 'Unauthorized'): APIError {
    return new APIError(message, 401, 'UNAUTHORIZED')
  }

  static notFoundError(message: string = 'Resource not found'): APIError {
    return new APIError(message, 404, 'NOT_FOUND')
  }

  static serverError(message: string = 'Internal server error'): APIError {
    return new APIError(message, 500, 'SERVER_ERROR')
  }

  isNetworkError(): boolean {
    return this.code === 'NETWORK_ERROR' || this.status === 0
  }

  isClientError(): boolean {
    return this.status >= 400 && this.status < 500
  }

  isServerError(): boolean {
    return this.status >= 500
  }

  isRetryable(): boolean {
    return this.isNetworkError() || this.isServerError() || this.status === 429
  }

  getUserMessage(): string {
    switch (this.code) {
      case 'NETWORK_ERROR':
        return 'Please check your internet connection and try again.'
      case 'UNAUTHORIZED':
        return 'Please log in to continue.'
      case 'NOT_FOUND':
        return 'The requested item could not be found.'
      case 'VALIDATION_ERROR':
        return this.message
      default:
        if (this.isServerError()) {
          return 'Something went wrong on our end. Please try again later.'
        }
        return this.message
    }
  }
}

// Result Type for Better Error Handling
export type Result<T, E = APIError> =
  | { success: true; data: T }
  | { success: false; error: E }

export const success = <T>(data: T): Result<T> => ({
  success: true,
  data
})

export const failure = <E = APIError>(error: E): Result<never, E> => ({
  success: false,
  error
})

// Higher-order function for API calls
export const withErrorHandler = <T extends any[], R>(
  fn: (...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<Result<R, APIError>> => {
    try {
      const result = await fn(...args)
      return success(result)
    } catch (error) {
      console.error('API Error:', error)

      if (error instanceof APIError) {
        return failure(error)
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        return failure(APIError.networkError())
      }

      return failure(APIError.serverError(
        error instanceof Error ? error.message : 'Unknown error'
      ))
    }
  }
}

// Retry logic for failed requests
export const withRetry = <T extends any[], R>(
  fn: (...args: T) => Promise<Result<R>>,
  maxRetries: number = 3,
  delayMs: number = 1000
) => {
  return async (...args: T): Promise<Result<R>> => {
    let lastError: APIError

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const result = await fn(...args)

      if (result.success) {
        return result
      }

      lastError = result.error

      if (!lastError.isRetryable() || attempt === maxRetries) {
        break
      }

      // Exponential backoff
      const delay = delayMs * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))
    }

    return failure(lastError!)
  }
}

// Global error handler for unhandled API errors
export const handleGlobalError = (error: APIError) => {
  // Could integrate with error reporting service
  console.error('Unhandled API Error:', {
    message: error.message,
    status: error.status,
    code: error.code,
    details: error.details
  })

  // Could show global toast notification
  // toast.error(error.getUserMessage())
}