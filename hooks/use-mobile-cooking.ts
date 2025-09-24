"use client"

import { useState, useEffect, useCallback, useRef } from 'react'

interface MobileCookingOptions {
  enableWakeLock?: boolean
  enableSwipeGestures?: boolean
  enableFullscreen?: boolean
  enableHighContrast?: boolean
}

export function useMobileCooking({
  enableWakeLock = true,
  enableSwipeGestures = true,
  enableFullscreen = false,
  enableHighContrast = false
}: MobileCookingOptions = {}) {
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [highContrast, setHighContrast] = useState(enableHighContrast)
  const [swipeState, setSwipeState] = useState({
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0
  })

  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  // Wake Lock API to keep screen on
  const requestWakeLock = useCallback(async () => {
    if (!enableWakeLock || !('wakeLock' in navigator)) {
      console.warn('Wake Lock API not supported')
      return false
    }

    try {
      const wakeLockSentinel = await navigator.wakeLock.request('screen')
      setWakeLock(wakeLockSentinel)

      wakeLockSentinel.addEventListener('release', () => {
        console.log('Wake lock released')
        setWakeLock(null)
      })

      console.log('Wake lock acquired')
      return true
    } catch (error) {
      console.error('Failed to acquire wake lock:', error)
      return false
    }
  }, [enableWakeLock])

  const releaseWakeLock = useCallback(async () => {
    if (wakeLock) {
      await wakeLock.release()
      setWakeLock(null)
    }
  }, [wakeLock])

  // Fullscreen API
  const enterFullscreen = useCallback(async () => {
    if (!enableFullscreen || !document.documentElement.requestFullscreen) {
      console.warn('Fullscreen API not supported')
      return false
    }

    try {
      await document.documentElement.requestFullscreen()
      setIsFullscreen(true)
      return true
    } catch (error) {
      console.error('Failed to enter fullscreen:', error)
      return false
    }
  }, [enableFullscreen])

  const exitFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen()
        setIsFullscreen(false)
        return true
      } catch (error) {
        console.error('Failed to exit fullscreen:', error)
        return false
      }
    }
    return false
  }, [])

  // Swipe gesture detection
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enableSwipeGestures) return

    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
    setSwipeState(prev => ({
      ...prev,
      startX: touch.clientX,
      startY: touch.clientY
    }))
  }, [enableSwipeGestures])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!enableSwipeGestures || !touchStartRef.current) return

    const touch = e.changedTouches[0]
    const endX = touch.clientX
    const endY = touch.clientY

    setSwipeState(prev => ({
      ...prev,
      endX,
      endY
    }))

    touchStartRef.current = null
  }, [enableSwipeGestures])

  const getSwipeDirection = useCallback((): 'left' | 'right' | 'up' | 'down' | null => {
    const { startX, startY, endX, endY } = swipeState
    const deltaX = endX - startX
    const deltaY = endY - startY
    const minSwipeDistance = 50

    if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
      return null
    }

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'right' : 'left'
    } else {
      return deltaY > 0 ? 'down' : 'up'
    }
  }, [swipeState])

  // High contrast mode
  const toggleHighContrast = useCallback(() => {
    setHighContrast(prev => !prev)
  }, [])

  // Haptic feedback
  const hapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: 50,
        medium: 100,
        heavy: 200
      }
      navigator.vibrate(patterns[type])
    }
  }, [])

  // Battery status
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null)
  const [isCharging, setIsCharging] = useState<boolean | null>(null)

  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100))
        setIsCharging(battery.charging)

        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100))
        })

        battery.addEventListener('chargingchange', () => {
          setIsCharging(battery.charging)
        })
      })
    }
  }, [])

  // Device orientation
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')

  useEffect(() => {
    const handleOrientationChange = () => {
      if (screen.orientation) {
        setOrientation(screen.orientation.angle === 0 || screen.orientation.angle === 180 ? 'portrait' : 'landscape')
      } else {
        setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape')
      }
    }

    handleOrientationChange()
    window.addEventListener('resize', handleOrientationChange)
    if (screen.orientation) {
      screen.orientation.addEventListener('change', handleOrientationChange)
    }

    return () => {
      window.removeEventListener('resize', handleOrientationChange)
      if (screen.orientation) {
        screen.orientation.removeEventListener('change', handleOrientationChange)
      }
    }
  }, [])

  // Setup touch listeners
  useEffect(() => {
    if (enableSwipeGestures) {
      document.addEventListener('touchstart', handleTouchStart, { passive: true })
      document.addEventListener('touchend', handleTouchEnd, { passive: true })

      return () => {
        document.removeEventListener('touchstart', handleTouchStart)
        document.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [enableSwipeGestures, handleTouchStart, handleTouchEnd])

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      releaseWakeLock()
      if (document.fullscreenElement) {
        document.exitFullscreen()
      }
    }
  }, [releaseWakeLock])

  return {
    // Wake lock
    requestWakeLock,
    releaseWakeLock,
    hasWakeLock: !!wakeLock,

    // Fullscreen
    enterFullscreen,
    exitFullscreen,
    isFullscreen,

    // Gestures
    getSwipeDirection,
    swipeState,

    // Accessibility
    highContrast,
    toggleHighContrast,

    // Feedback
    hapticFeedback,

    // Device info
    batteryLevel,
    isCharging,
    orientation,

    // Helpers
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
    isAndroid: /Android/.test(navigator.userAgent)
  }
}