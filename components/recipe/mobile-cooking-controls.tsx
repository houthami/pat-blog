"use client"

import React, { useEffect } from 'react'
import { AccessibleButton } from "@/components/ui/accessible-button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Maximize,
  Minimize,
  Smartphone,
  Contrast,
  Vibrate,
  Battery,
  BatteryLow,
  RotateCcw,
  Zap,
  Settings
} from "lucide-react"
import { useMobileCooking } from "@/hooks/use-mobile-cooking"
import { cn } from "@/lib/utils"

interface MobileCookingControlsProps {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  className?: string
  showBatteryInfo?: boolean
}

export function MobileCookingControls({
  onSwipeLeft,
  onSwipeRight,
  className,
  showBatteryInfo = true
}: MobileCookingControlsProps) {
  const {
    requestWakeLock,
    releaseWakeLock,
    hasWakeLock,
    enterFullscreen,
    exitFullscreen,
    isFullscreen,
    getSwipeDirection,
    highContrast,
    toggleHighContrast,
    hapticFeedback,
    batteryLevel,
    isCharging,
    orientation,
    isMobile,
    isIOS
  } = useMobileCooking({
    enableWakeLock: true,
    enableSwipeGestures: true,
    enableFullscreen: true
  })

  // Handle swipe gestures
  useEffect(() => {
    const direction = getSwipeDirection()
    if (direction === 'left' && onSwipeLeft) {
      hapticFeedback('light')
      onSwipeLeft()
    } else if (direction === 'right' && onSwipeRight) {
      hapticFeedback('light')
      onSwipeRight()
    }
  }, [getSwipeDirection, onSwipeLeft, onSwipeRight, hapticFeedback])

  const toggleWakeLock = async () => {
    if (hasWakeLock) {
      await releaseWakeLock()
      hapticFeedback('medium')
    } else {
      const success = await requestWakeLock()
      if (success) {
        hapticFeedback('medium')
      }
    }
  }

  const toggleFullscreen = async () => {
    if (isFullscreen) {
      await exitFullscreen()
    } else {
      await enterFullscreen()
    }
    hapticFeedback('medium')
  }

  const getBatteryIcon = () => {
    if (batteryLevel === null) return <Battery className="w-4 h-4" />

    if (batteryLevel <= 20) {
      return <BatteryLow className="w-4 h-4 text-red-500" />
    }

    return <Battery className="w-4 h-4 text-green-500" />
  }

  if (!isMobile) {
    return null
  }

  return (
    <div className={cn(
      "fixed bottom-4 left-4 right-4 z-50",
      "bg-white/95 backdrop-blur-sm rounded-xl border shadow-lg",
      "p-4 space-y-4",
      highContrast && "bg-black text-white border-white",
      className
    )}>
      {/* Mobile Cooking Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-primary" />
          <span className="font-medium text-sm">Kitchen Mode</span>
          {orientation === 'landscape' && (
            <Badge variant="outline" className="text-xs">
              Landscape
            </Badge>
          )}
        </div>

        {showBatteryInfo && batteryLevel !== null && (
          <div className="flex items-center gap-2 text-sm">
            {getBatteryIcon()}
            <span className={cn(
              batteryLevel <= 20 ? "text-red-500" : "text-green-500"
            )}>
              {batteryLevel}%
            </span>
            {isCharging && <Zap className="w-3 h-3 text-yellow-500" />}
          </div>
        )}
      </div>

      {/* Controls Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Keep Screen On */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            <Label htmlFor="wake-lock" className="text-sm font-medium">
              Keep On
            </Label>
          </div>
          <Switch
            id="wake-lock"
            checked={hasWakeLock}
            onCheckedChange={toggleWakeLock}
            aria-label="Keep screen on during cooking"
          />
        </div>

        {/* Fullscreen */}
        <AccessibleButton
          onClick={toggleFullscreen}
          variant="outline"
          className={cn(
            "flex items-center justify-center gap-2 h-12",
            isFullscreen && "bg-primary text-primary-foreground"
          )}
          ariaLabel={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? (
            <>
              <Minimize className="w-4 h-4" />
              <span className="text-sm">Exit</span>
            </>
          ) : (
            <>
              <Maximize className="w-4 h-4" />
              <span className="text-sm">Full</span>
            </>
          )}
        </AccessibleButton>

        {/* High Contrast */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Contrast className="w-4 h-4" />
            <Label htmlFor="high-contrast" className="text-sm font-medium">
              Contrast
            </Label>
          </div>
          <Switch
            id="high-contrast"
            checked={highContrast}
            onCheckedChange={toggleHighContrast}
            aria-label="Toggle high contrast mode"
          />
        </div>

        {/* Haptic Feedback Test */}
        <AccessibleButton
          onClick={() => hapticFeedback('heavy')}
          variant="outline"
          className="flex items-center justify-center gap-2 h-12"
          ariaLabel="Test haptic feedback"
        >
          <Vibrate className="w-4 h-4" />
          <span className="text-sm">Vibrate</span>
        </AccessibleButton>
      </div>

      {/* Gesture Instructions */}
      {isMobile && (
        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            Swipe left/right to navigate steps
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span>← Previous</span>
            <span>•</span>
            <span>Next →</span>
          </div>
        </div>
      )}

      {/* iOS-specific instructions */}
      {isIOS && (
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>iOS Tip:</strong> Add to Home Screen for the best kitchen experience!
          </p>
        </div>
      )}

      {/* Low battery warning */}
      {batteryLevel !== null && batteryLevel <= 20 && !isCharging && (
        <div className="bg-red-50 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <BatteryLow className="w-4 h-4 text-red-500" />
            <p className="text-xs text-red-800">
              Low battery! Consider plugging in your device.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// Simplified mobile controls for cooking mode
export function MobileCookingFloatingControls({
  onPreviousStep,
  onNextStep,
  onToggleTimer,
  className
}: {
  onPreviousStep?: () => void
  onNextStep?: () => void
  onToggleTimer?: () => void
  className?: string
}) {
  const { hapticFeedback, isMobile } = useMobileCooking()

  if (!isMobile) {
    return null
  }

  const handlePrevious = () => {
    hapticFeedback('light')
    onPreviousStep?.()
  }

  const handleNext = () => {
    hapticFeedback('light')
    onNextStep?.()
  }

  const handleTimer = () => {
    hapticFeedback('medium')
    onToggleTimer?.()
  }

  return (
    <div className={cn(
      "fixed bottom-20 left-1/2 transform -translate-x-1/2 z-40",
      "flex items-center gap-3",
      className
    )}>
      {onPreviousStep && (
        <AccessibleButton
          onClick={handlePrevious}
          size="lg"
          variant="outline"
          className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm shadow-lg border-2"
          ariaLabel="Previous step"
        >
          ←
        </AccessibleButton>
      )}

      {onToggleTimer && (
        <AccessibleButton
          onClick={handleTimer}
          size="lg"
          className="w-14 h-14 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg"
          ariaLabel="Toggle timer"
        >
          <RotateCcw className="w-6 h-6" />
        </AccessibleButton>
      )}

      {onNextStep && (
        <AccessibleButton
          onClick={handleNext}
          size="lg"
          variant="outline"
          className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm shadow-lg border-2"
          ariaLabel="Next step"
        >
          →
        </AccessibleButton>
      )}
    </div>
  )
}