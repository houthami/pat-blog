"use client"

import { useState, useCallback, useEffect, useRef } from 'react'

interface TimerOptions {
  onComplete?: () => void
  onTick?: (timeLeft: number) => void
}

export function useCookingTimer({ onComplete, onTick }: TimerOptions = {}) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [initialTime, setInitialTime] = useState<number | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const start = useCallback((minutes: number) => {
    const seconds = minutes * 60
    setTimeLeft(seconds)
    setInitialTime(seconds)
    setIsRunning(true)
  }, [])

  const pause = useCallback(() => {
    setIsRunning(false)
  }, [])

  const resume = useCallback(() => {
    if (timeLeft !== null && timeLeft > 0) {
      setIsRunning(true)
    }
  }, [timeLeft])

  const stop = useCallback(() => {
    setIsRunning(false)
    setTimeLeft(null)
    setInitialTime(null)
  }, [])

  const reset = useCallback(() => {
    if (initialTime !== null) {
      setTimeLeft(initialTime)
      setIsRunning(false)
    }
  }, [initialTime])

  const addTime = useCallback((minutes: number) => {
    if (timeLeft !== null) {
      const newTime = timeLeft + (minutes * 60)
      setTimeLeft(Math.max(0, newTime))
    }
  }, [timeLeft])

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft !== null && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null || prev <= 1) {
            setIsRunning(false)
            onComplete?.()
            return 0
          }
          const newTime = prev - 1
          onTick?.(newTime)
          return newTime
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeLeft, onComplete, onTick])

  // Format time display
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  const getProgress = useCallback(() => {
    if (initialTime === null || timeLeft === null) return 0
    return ((initialTime - timeLeft) / initialTime) * 100
  }, [initialTime, timeLeft])

  return {
    timeLeft,
    isRunning,
    start,
    pause,
    resume,
    stop,
    reset,
    addTime,
    formatTime: timeLeft !== null ? formatTime(timeLeft) : null,
    progress: getProgress(),
    isActive: timeLeft !== null
  }
}