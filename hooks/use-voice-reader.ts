"use client"

import { useState, useCallback, useRef } from 'react'

interface VoiceSettings {
  rate?: number
  pitch?: number
  volume?: number
  voice?: SpeechSynthesisVoice | null
}

export function useVoiceReader({
  rate = 0.9,
  pitch = 1,
  volume = 0.8,
  voice = null
}: VoiceSettings = {}) {
  const [isReading, setIsReading] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Check if speech synthesis is supported
  useState(() => {
    setIsSupported('speechSynthesis' in window)
  })

  const speak = useCallback((text: string) => {
    if (!isSupported) {
      console.warn('Speech synthesis not supported')
      return
    }

    // Stop any current speech
    speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = rate
    utterance.pitch = pitch
    utterance.volume = volume

    if (voice) {
      utterance.voice = voice
    }

    utterance.onstart = () => setIsReading(true)
    utterance.onend = () => setIsReading(false)
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event)
      setIsReading(false)
    }

    utteranceRef.current = utterance
    speechSynthesis.speak(utterance)
  }, [isSupported, rate, pitch, volume, voice])

  const stop = useCallback(() => {
    if (!isSupported) return

    speechSynthesis.cancel()
    setIsReading(false)
  }, [isSupported])

  const pause = useCallback(() => {
    if (!isSupported) return

    speechSynthesis.pause()
  }, [isSupported])

  const resume = useCallback(() => {
    if (!isSupported) return

    speechSynthesis.resume()
  }, [isSupported])

  const toggle = useCallback((text?: string) => {
    if (isReading) {
      stop()
    } else if (text) {
      speak(text)
    }
  }, [isReading, stop, speak])

  return {
    speak,
    stop,
    pause,
    resume,
    toggle,
    isReading,
    isSupported
  }
}