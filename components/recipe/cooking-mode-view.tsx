"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AccessibleButton } from "@/components/ui/accessible-button"
import {
  ChefHat,
  Timer,
  Play,
  Pause,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Volume2,
  VolumeX
} from "lucide-react"
import { cn } from "@/lib/utils"
import { TextFormatter } from "@/components/text-formatter"
import { InstructionItem } from "@/hooks/use-instruction-parser"

interface CookingModeViewProps {
  currentStep: InstructionItem | undefined
  currentStepIndex: number
  totalSteps: number
  completedSteps: Set<number>
  cookingTimer: {
    timeLeft: number | null
    isRunning: boolean
    formatTime: string | null
    isActive: boolean
  }
  voiceReader: {
    isReading: boolean
    isSupported: boolean
  }
  onToggleStep: (index: number) => void
  onStepChange: (stepIndex: number) => void
  onCookingModeToggle: () => void
  onStartTimer: (minutes: number) => void
  onStopTimer: () => void
  onResetTimer: () => void
  onReadCurrentStep: () => void
  onStopSpeech: () => void
  cookingSteps: InstructionItem[]
}

export function CookingModeView({
  currentStep,
  currentStepIndex,
  totalSteps,
  completedSteps,
  cookingTimer,
  voiceReader,
  onToggleStep,
  onStepChange,
  onCookingModeToggle,
  onStartTimer,
  onStopTimer,
  onResetTimer,
  onReadCurrentStep,
  onStopSpeech,
  cookingSteps
}: CookingModeViewProps) {
  const [timerInput, setTimerInput] = React.useState(5)

  const startTimer = () => {
    if (timerInput > 0) {
      onStartTimer(timerInput)
    }
  }

  return (
    <Card className="border-orange-300 bg-orange-50">
      <CardHeader className="bg-orange-500 text-white">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChefHat className="w-6 h-6" />
            Cooking Mode
            <Badge className="bg-white/20 text-white">
              Step {currentStepIndex + 1} of {totalSteps}
            </Badge>
          </div>
          <AccessibleButton
            variant="ghost"
            size="sm"
            onClick={onCookingModeToggle}
            className="text-white hover:bg-white/20"
            ariaLabel="Exit cooking mode"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Exit
          </AccessibleButton>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* Progress */}
        <div className="mb-6">
          <Progress
            value={((currentStepIndex + 1) / totalSteps) * 100}
            className="h-3"
            aria-label={`Cooking progress: step ${currentStepIndex + 1} of ${totalSteps}`}
          />
        </div>

        {/* Current Step */}
        {currentStep && (
          <div className="bg-white rounded-lg p-6 mb-6 border border-orange-200">
            <div className="flex items-start gap-4">
              <div
                className="bg-orange-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold shrink-0"
                aria-label={`Step ${currentStep.stepNumber}`}
              >
                {currentStep.stepNumber}
              </div>
              <div className="flex-1">
                <div
                  className="text-xl leading-relaxed text-gray-900"
                  role="main"
                  aria-live="polite"
                >
                  <TextFormatter isInstruction={true}>
                    {currentStep.content}
                  </TextFormatter>
                </div>
                <div className="mt-4">
                  <AccessibleButton
                    variant="outline"
                    size="sm"
                    onClick={voiceReader.isReading ? onStopSpeech : onReadCurrentStep}
                    disabled={!voiceReader.isSupported}
                    className="flex items-center gap-2"
                    ariaLabel={
                      voiceReader.isReading
                        ? "Stop reading step aloud"
                        : "Read step aloud"
                    }
                  >
                    {voiceReader.isReading ? (
                      <>
                        <VolumeX className="w-4 h-4" />
                        Reading...
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4" />
                        Read Step
                      </>
                    )}
                  </AccessibleButton>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timer Section */}
        <div className="bg-white rounded-lg p-4 mb-6 border border-orange-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Timer className="w-5 h-5" />
              Cooking Timer
            </h3>
            {cookingTimer.isActive && cookingTimer.formatTime && (
              <div
                className={cn(
                  "text-2xl font-mono font-bold px-3 py-1 rounded",
                  cookingTimer.isRunning
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                )}
                role="timer"
                aria-live="polite"
                aria-label={`Timer: ${cookingTimer.formatTime}`}
              >
                {cookingTimer.formatTime}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!cookingTimer.isActive ? (
              <>
                <div className="flex items-center gap-2">
                  <label htmlFor="timer-input" className="text-sm font-medium">
                    Minutes:
                  </label>
                  <input
                    id="timer-input"
                    type="number"
                    min="1"
                    max="60"
                    value={timerInput}
                    onChange={(e) => setTimerInput(parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    aria-label="Timer duration in minutes"
                  />
                </div>
                <AccessibleButton
                  onClick={startTimer}
                  className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2"
                  ariaLabel={`Start ${timerInput} minute timer`}
                >
                  <Play className="w-4 h-4" />
                  Start Timer
                </AccessibleButton>
              </>
            ) : (
              <>
                <AccessibleButton
                  onClick={cookingTimer.isRunning ? onStopTimer : () => onStartTimer(0)}
                  variant="outline"
                  className={cn(
                    "flex items-center gap-2",
                    cookingTimer.isRunning
                      ? "text-red-600 hover:text-red-700"
                      : "text-green-600 hover:text-green-700"
                  )}
                  ariaLabel={cookingTimer.isRunning ? "Pause timer" : "Resume timer"}
                >
                  {cookingTimer.isRunning ? (
                    <>
                      <Pause className="w-4 h-4" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Resume
                    </>
                  )}
                </AccessibleButton>
                <AccessibleButton
                  onClick={onResetTimer}
                  variant="outline"
                  className="flex items-center gap-2"
                  ariaLabel="Reset timer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </AccessibleButton>
              </>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center justify-between gap-4" aria-label="Step navigation">
          <AccessibleButton
            variant="outline"
            onClick={() => onStepChange(Math.max(0, currentStepIndex - 1))}
            disabled={currentStepIndex === 0}
            className="flex items-center gap-2"
            ariaLabel="Go to previous step"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </AccessibleButton>

          <AccessibleButton
            onClick={() => currentStep && onToggleStep(currentStep.index)}
            className={cn(
              "flex items-center gap-2",
              currentStep && completedSteps.has(currentStep.index)
                ? "bg-green-500 hover:bg-green-600 text-white"
                : "bg-orange-500 hover:bg-orange-600 text-white"
            )}
            ariaLabel={
              currentStep && completedSteps.has(currentStep.index)
                ? "Mark step as not completed"
                : "Mark step as completed"
            }
          >
            <CheckCircle className="w-4 h-4" />
            {currentStep && completedSteps.has(currentStep.index) ? "Done" : "Complete"}
          </AccessibleButton>

          <AccessibleButton
            onClick={() => onStepChange(Math.min(totalSteps - 1, currentStepIndex + 1))}
            disabled={currentStepIndex === totalSteps - 1}
            className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
            ariaLabel="Go to next step"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </AccessibleButton>
        </nav>

        {/* Step Overview */}
        <div className="mt-6 pt-6 border-t border-orange-200">
          <p className="text-sm font-medium text-gray-700 mb-3">Steps:</p>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Recipe steps">
            {cookingSteps.map((step, index) => (
              <AccessibleButton
                key={step.index}
                variant={index === currentStepIndex ? "default" : "outline"}
                size="sm"
                onClick={() => onStepChange(index)}
                className={cn(
                  "w-8 h-8 p-0",
                  completedSteps.has(step.index) && "bg-green-500 hover:bg-green-600 text-white"
                )}
                role="tab"
                ariaLabel={`Go to step ${step.stepNumber}`}
                ariaPressed={index === currentStepIndex}
              >
                {completedSteps.has(step.index) ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  step.stepNumber
                )}
              </AccessibleButton>
            ))}
          </div>
        </div>
      </CardContent>

      {/* Floating Voice Button for Cooking Mode */}
      <div className="fixed bottom-6 right-6 z-50">
        <AccessibleButton
          onClick={voiceReader.isReading ? onStopSpeech : onReadCurrentStep}
          size="lg"
          className={cn(
            "w-14 h-14 rounded-full shadow-lg transition-all duration-300",
            voiceReader.isReading
              ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
              : "bg-orange-500 hover:bg-orange-600 text-white"
          )}
          ariaLabel={
            voiceReader.isReading
              ? "Stop reading recipe aloud"
              : "Read current step aloud"
          }
          disabled={!voiceReader.isSupported}
        >
          {voiceReader.isReading ? (
            <VolumeX className="w-6 h-6" />
          ) : (
            <Volume2 className="w-6 h-6" />
          )}
        </AccessibleButton>
      </div>
    </Card>
  )
}