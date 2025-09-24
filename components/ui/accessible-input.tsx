"use client"

import React, { forwardRef } from "react"
import { Input, InputProps } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface AccessibleInputProps extends InputProps {
  label?: string
  description?: string
  error?: string
  required?: boolean
  hideLabel?: boolean
}

export const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
  ({
    label,
    description,
    error,
    required,
    hideLabel = false,
    className,
    id,
    ...props
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
    const descriptionId = description ? `${inputId}-description` : undefined
    const errorId = error ? `${inputId}-error` : undefined

    return (
      <div className="space-y-2">
        {label && (
          <Label
            htmlFor={inputId}
            className={cn(
              "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
              hideLabel && "sr-only"
            )}
          >
            {label}
            {required && (
              <span className="text-destructive ml-1" aria-label="required">
                *
              </span>
            )}
          </Label>
        )}

        {description && (
          <p
            id={descriptionId}
            className="text-sm text-muted-foreground"
          >
            {description}
          </p>
        )}

        <Input
          ref={ref}
          id={inputId}
          aria-describedby={[descriptionId, errorId].filter(Boolean).join(' ') || undefined}
          aria-invalid={error ? 'true' : 'false'}
          aria-required={required}
          className={cn(
            "focus:ring-2 focus:ring-ring focus:ring-offset-2",
            error && "border-destructive focus:border-destructive",
            className
          )}
          {...props}
        />

        {error && (
          <p
            id={errorId}
            className="text-sm text-destructive"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)

AccessibleInput.displayName = "AccessibleInput"