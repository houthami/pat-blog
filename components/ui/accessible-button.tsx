"use client"

import React, { forwardRef } from "react"
import { Button, ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AccessibleButtonProps extends ButtonProps {
  ariaLabel?: string
  ariaDescribedBy?: string
  ariaExpanded?: boolean
  ariaPressed?: boolean
  role?: string
  onKeyDown?: (e: React.KeyboardEvent) => void
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({
    children,
    onClick,
    onKeyDown,
    ariaLabel,
    ariaDescribedBy,
    ariaExpanded,
    ariaPressed,
    role = "button",
    className,
    disabled,
    ...props
  }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent) => {
      // Call custom keyDown handler first
      onKeyDown?.(e)

      // Default accessible behavior
      if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
        e.preventDefault()
        onClick?.(e as any)
      }
    }

    return (
      <Button
        ref={ref}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-expanded={ariaExpanded}
        aria-pressed={ariaPressed}
        role={role}
        tabIndex={disabled ? -1 : 0}
        className={cn(
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "transition-all duration-200",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
        disabled={disabled}
        {...props}
      >
        {children}
      </Button>
    )
  }
)

AccessibleButton.displayName = "AccessibleButton"