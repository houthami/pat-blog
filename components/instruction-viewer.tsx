"use client"

import React from 'react'
import { useVoiceReader } from "@/hooks/use-voice-reader"
import { useCookingTimer } from "@/hooks/use-cooking-timer"
import { useInstructionParser } from "@/hooks/use-instruction-parser"
import { CookingModeView } from "./recipe/cooking-mode-view"
import { StandardInstructionView } from "./recipe/standard-instruction-view"

interface InstructionViewerProps {
  instructions: string[]
  completedSteps: Set<number>
  onToggleStep: (index: number) => void
  cookingMode?: boolean
  onCookingModeToggle?: () => void
  currentStep?: number
  onStepChange?: (step: number) => void
  cookingTimer?: number | null
  isTimerRunning?: boolean
  onStartTimer?: (minutes: number) => void
  onStopTimer?: () => void
  onResetTimer?: () => void
}

export function InstructionViewer({
  instructions,
  completedSteps,
  onToggleStep,
  cookingMode = false,
  onCookingModeToggle,
  currentStep = 0,
  onStepChange,
  cookingTimer,
  isTimerRunning,
  onStartTimer,
  onStopTimer,
  onResetTimer
}: InstructionViewerProps) {
  // Custom hooks for functionality
  const voiceReader = useVoiceReader()
  const timer = useCookingTimer({
    onComplete: () => {
      // Timer completed - could trigger notification
      voiceReader.speak("Timer completed!")
    }
  })
  const {
    parsedInstructions,
    cookingSteps,
    getStepByNumber,
    getTotalSteps
  } = useInstructionParser(instructions)

  // Get current cooking step
  const currentCookingStep = getStepByNumber(currentStep)
  const totalSteps = getTotalSteps

  // Enhanced voice functions
  const readCurrentStep = () => {
    if (currentCookingStep) {
      voiceReader.speak(`Step ${currentCookingStep.stepNumber}. ${currentCookingStep.content}`)
    }
  }

  const readAllSteps = () => {
    const allStepsText = cookingSteps.map(step =>
      `Step ${step.stepNumber}. ${step.content}`
    ).join('. ')
    voiceReader.speak(`Here are all the cooking steps. ${allStepsText}`)
  }

  // Timer interface - use external timer props if provided, otherwise use internal timer
  const cookingTimerState = {
    timeLeft: cookingTimer !== undefined ? cookingTimer : timer.timeLeft,
    isRunning: isTimerRunning !== undefined ? isTimerRunning : timer.isRunning,
    formatTime: cookingTimer !== undefined
      ? (cookingTimer !== null ? `${Math.floor(cookingTimer / 60)}:${(cookingTimer % 60).toString().padStart(2, '0')}` : null)
      : timer.formatTime,
    isActive: cookingTimer !== undefined ? cookingTimer !== null : timer.isActive
  }

  const handleStartTimer = (minutes: number) => {
    if (onStartTimer) {
      onStartTimer(minutes)
    } else {
      timer.start(minutes)
    }
  }

  const handleStopTimer = () => {
    if (onStopTimer) {
      onStopTimer()
    } else {
      timer.pause()
    }
  }

  const handleResetTimer = () => {
    if (onResetTimer) {
      onResetTimer()
    } else {
      timer.reset()
    }
  }

  if (cookingMode) {
    return (
      <CookingModeView
        currentStep={currentCookingStep}
        currentStepIndex={currentStep}
        totalSteps={totalSteps}
        completedSteps={completedSteps}
        cookingTimer={cookingTimerState}
        voiceReader={voiceReader}
        onToggleStep={onToggleStep}
        onStepChange={onStepChange || (() => {})}
        onCookingModeToggle={onCookingModeToggle || (() => {})}
        onStartTimer={handleStartTimer}
        onStopTimer={handleStopTimer}
        onResetTimer={handleResetTimer}
        onReadCurrentStep={readCurrentStep}
        onStopSpeech={voiceReader.stop}
        cookingSteps={cookingSteps}
      />
    )
  }

  // Regular instruction view
  return (
    <StandardInstructionView
      parsedInstructions={parsedInstructions}
      cookingSteps={cookingSteps}
      completedSteps={completedSteps}
      onToggleStep={onToggleStep}
      onCookingModeToggle={onCookingModeToggle}
    />
  )
}