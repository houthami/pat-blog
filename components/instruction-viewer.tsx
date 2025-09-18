"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  CheckCircle,
  Circle,
  ChefHat,
  Timer,
  Play,
  Pause,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  Eye,
  Clock,
  Volume2,
  VolumeX,
  SkipForward,
  Home,
  Maximize,
  Minimize
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { TextFormatter } from "@/components/text-formatter"

interface InstructionItem {
  type: 'title' | 'note' | 'step'
  content: string
  index: number
  stepNumber?: number
}

interface InstructionViewerProps {
  instructions: string[]
  completedSteps: Set<number>
  onToggleStep: (index: number) => void
  cookingMode?: boolean
  onCookingModeToggle?: () => void
  currentStep?: number
  onStepChange?: (step: number) => void
}

// Timer Hook for cooking mode
function useTimer(initialMinutes: number = 0, initialSeconds: number = 0) {
  const [minutes, setMinutes] = useState(initialMinutes)
  const [seconds, setSeconds] = useState(initialSeconds)
  const [isActive, setIsActive] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isActive && (minutes > 0 || seconds > 0)) {
      intervalRef.current = setInterval(() => {
        if (seconds > 0) {
          setSeconds(seconds - 1)
        } else if (minutes > 0) {
          setMinutes(minutes - 1)
          setSeconds(59)
        } else {
          setIsActive(false)
          setIsCompleted(true)
          // Play notification sound
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance('Timer finished!')
            speechSynthesis.speak(utterance)
          }
        }
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isActive, minutes, seconds])

  const start = () => setIsActive(true)
  const pause = () => setIsActive(false)
  const reset = () => {
    setIsActive(false)
    setMinutes(initialMinutes)
    setSeconds(initialSeconds)
    setIsCompleted(false)
  }
  const setTime = (min: number, sec: number) => {
    setMinutes(min)
    setSeconds(sec)
    setIsCompleted(false)
  }

  return { minutes, seconds, isActive, isCompleted, start, pause, reset, setTime }
}

export function InstructionViewer({
  instructions,
  completedSteps,
  onToggleStep,
  cookingMode = false,
  onCookingModeToggle,
  currentStep = 0,
  onStepChange
}: InstructionViewerProps) {
  // Enhanced state for cooking mode
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const timer = useTimer(0, 0)

  // Parse instructions into structured items
  const parsedInstructions: InstructionItem[] = instructions.map((instruction, index) => {
    const trimmed = instruction.trim()
    let type: 'title' | 'note' | 'step' = 'step'
    let content = trimmed

    if (trimmed.startsWith('#')) {
      type = 'title'
      content = trimmed.slice(1).trim()
    } else if (trimmed.startsWith('>')) {
      type = 'note'
      content = trimmed.slice(1).trim()
    }

    return { type, content, index }
  })

  // Add step numbers only to actual cooking steps
  let stepCounter = 1
  parsedInstructions.forEach(item => {
    if (item.type === 'step') {
      item.stepNumber = stepCounter++
    }
  })

  // Get only the actual cooking steps for cooking mode
  const cookingSteps = parsedInstructions.filter(item => item.type === 'step')
  const totalSteps = cookingSteps.length
  const completedCount = cookingSteps.filter(step => completedSteps.has(step.index)).length

  // Get current cooking step
  const currentCookingStep = cookingSteps[currentStep]

  // Extract timer information from step content
  const extractTimerFromStep = (content: string) => {
    const timeRegex = /(\d+)\s*(minute|min|second|sec)/gi
    const matches = content.match(timeRegex)
    if (matches) {
      const minutes = matches.find(m => m.includes('min'))?.match(/\d+/)?.[0] || '0'
      const seconds = matches.find(m => m.includes('sec'))?.match(/\d+/)?.[0] || '0'
      return { minutes: parseInt(minutes), seconds: parseInt(seconds) }
    }
    return null
  }

  // Voice reading function
  const speakStep = useCallback((content: string) => {
    if ('speechSynthesis' in window && voiceEnabled) {
      speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(content)
      utterance.rate = 0.8
      utterance.pitch = 1
      speechSynthesis.speak(utterance)
    }
  }, [voiceEnabled])

  // Auto-speak current step when it changes
  useEffect(() => {
    if (cookingMode && currentCookingStep && voiceEnabled) {
      speakStep(currentCookingStep.content)
    }
  }, [currentStep, cookingMode, voiceEnabled, currentCookingStep, speakStep])

  // Set timer based on current step
  useEffect(() => {
    if (currentCookingStep) {
      const stepTimer = extractTimerFromStep(currentCookingStep.content)
      if (stepTimer) {
        timer.setTime(stepTimer.minutes, stepTimer.seconds)
      }
    }
  }, [currentStep, currentCookingStep])

  // Ensure we have valid data for cooking mode
  if (cookingMode && (!instructions.length || !totalSteps)) {
    console.warn('⚠️ Cooking mode activated but no valid instructions found!')
  }

  if (cookingMode && onStepChange) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl shadow-2xl border border-orange-200/50",
          isFullscreen && "fixed inset-4 z-50 bg-white"
        )}
      >
        {/* Header with Enhanced Controls */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onCookingModeToggle}
                className="text-white hover:bg-white/20 h-10 px-4"
              >
                <Home className="w-4 h-4 mr-2" />
                Exit Kitchen Mode
              </Button>
              <div className="hidden sm:flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className="text-white hover:bg-white/20 h-10 px-3"
                >
                  {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="text-white hover:bg-white/20 h-10 px-3"
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-white/20 text-white border-white/30 text-sm px-3 py-1">
                Kitchen Mode
              </Badge>
              <div className="text-right">
                <div className="text-sm opacity-90">Progress</div>
                <div className="text-lg font-bold">
                  {currentStep + 1}/{totalSteps}
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <Progress
              value={((currentStep + 1) / totalSteps) * 100}
              className="h-2 bg-white/20"
            />
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Timer Section */}
          {timer.minutes > 0 || timer.seconds > 0 || timer.isActive ? (
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className={cn(
                "bg-white rounded-xl p-6 border-2 text-center",
                timer.isCompleted ? "border-green-500 bg-green-50" : "border-orange-300"
              )}
            >
              <div className="flex items-center justify-center gap-4 mb-4">
                <Clock className="w-6 h-6 text-orange-500" />
                <h3 className="text-xl font-bold text-gray-800">Timer</h3>
              </div>
              <div className="text-6xl font-mono font-bold text-gray-800 mb-4">
                {String(timer.minutes).padStart(2, '0')}:{String(timer.seconds).padStart(2, '0')}
              </div>
              <div className="flex justify-center gap-3">
                <Button
                  onClick={timer.isActive ? timer.pause : timer.start}
                  className="bg-orange-500 hover:bg-orange-600 text-white h-12 px-6"
                >
                  {timer.isActive ? (
                    <>
                      <Pause className="w-5 h-5 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Start
                    </>
                  )}
                </Button>
                <Button
                  onClick={timer.reset}
                  variant="outline"
                  className="h-12 px-6"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Reset
                </Button>
              </div>
            </motion.div>
          ) : null}

          {/* Current Step - Enhanced */}
          {currentCookingStep && (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl p-8 border border-orange-200 shadow-lg"
            >
              <div className="flex items-start gap-6">
                <div className="bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold shrink-0">
                  {currentCookingStep.stepNumber}
                </div>
                <div className="flex-1 space-y-4">
                  <div className="text-2xl leading-relaxed text-gray-800 font-medium">
                    <TextFormatter isInstruction={true}>{currentCookingStep.content}</TextFormatter>
                  </div>
                  {voiceEnabled && (
                    <Button
                      onClick={() => speakStep(currentCookingStep.content)}
                      variant="outline"
                      size="sm"
                      className="text-orange-600 border-orange-300 hover:bg-orange-50"
                    >
                      <Volume2 className="w-4 h-4 mr-2" />
                      Read Aloud
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Enhanced Controls - Mobile Friendly */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => onStepChange(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="h-14 text-lg font-medium"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Previous
            </Button>

            <Button
              onClick={() => currentCookingStep && onToggleStep(currentCookingStep.index)}
              className={cn(
                "h-14 text-lg font-medium",
                currentCookingStep && completedSteps.has(currentCookingStep.index)
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "bg-orange-500 hover:bg-orange-600 text-white"
              )}
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              {currentCookingStep && completedSteps.has(currentCookingStep.index) ? "Done!" : "Complete"}
            </Button>

            <Button
              onClick={() => onStepChange(Math.min(totalSteps - 1, currentStep + 1))}
              disabled={currentStep === totalSteps - 1}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white h-14 text-lg font-medium"
            >
              Next Step
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          {/* Step Overview - Improved */}
          <div className="bg-white rounded-xl p-4 border border-orange-200">
            <p className="text-sm font-semibold text-gray-700 mb-3">Recipe Steps:</p>
            <div className="flex flex-wrap gap-2">
              {cookingSteps.map((step, index) => (
                <Button
                  key={step.index}
                  variant={index === currentStep ? "default" : "outline"}
                  size="sm"
                  onClick={() => onStepChange(index)}
                  className={cn(
                    "w-10 h-10 p-0 rounded-full font-bold",
                    index === currentStep && "bg-orange-500 hover:bg-orange-600 text-white",
                    completedSteps.has(step.index) && index !== currentStep && "bg-green-500 hover:bg-green-600 text-white border-green-500"
                  )}
                >
                  {completedSteps.has(step.index) ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    step.stepNumber
                  )}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // Regular instruction view
  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChefHat className="w-6 h-6" />
            Instructions
            <Badge className="bg-white/20 text-white border-white/30">
              {totalSteps} Steps
            </Badge>
          </div>
          {onCookingModeToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCookingModeToggle}
              className="text-white hover:bg-white/20"
            >
              <Play className="w-4 h-4 mr-2" />
              Cooking Mode
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* Progress Summary */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-600">{completedCount} of {totalSteps} completed</span>
          </div>
          <Progress
            value={(completedCount / totalSteps) * 100}
            className="h-2"
          />
        </div>

        {/* Instructions List */}
        <div className="space-y-4">
          {parsedInstructions.map((item, index) => {
            if (item.type === 'title') {
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="font-bold text-xl text-gray-800 mt-8 mb-4 border-b-2 border-blue-200 pb-2"
                >
                  <TextFormatter>{item.content}</TextFormatter>
                </motion.div>
              )
            }

            if (item.type === 'note') {
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg my-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-amber-400 text-white rounded-full w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">
                      <Eye className="w-3 h-3" />
                    </div>
                    <div className="italic text-amber-800">
                      <TextFormatter>{item.content}</TextFormatter>
                    </div>
                  </div>
                </motion.div>
              )
            }

            // Step
            const isCompleted = completedSteps.has(item.index)
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={cn(
                  "flex gap-4 p-4 rounded-xl transition-all duration-300 border",
                  isCompleted
                    ? "bg-green-50 border-green-200"
                    : "bg-gray-50 hover:bg-blue-50 border-transparent hover:border-blue-200"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors cursor-pointer shrink-0",
                    isCompleted
                      ? "bg-green-500 text-white"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  )}
                  onClick={() => onToggleStep(item.index)}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    item.stepNumber
                  )}
                </div>
                <div className="flex-1">
                  <div className={cn(
                    "leading-relaxed transition-colors",
                    isCompleted
                      ? "text-green-800 line-through"
                      : "text-gray-700"
                  )}>
                    <TextFormatter isInstruction={true}>{item.content}</TextFormatter>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onToggleStep(item.index)}
                    className={cn(
                      "mt-2 h-8",
                      isCompleted
                        ? "text-green-600 hover:text-green-700"
                        : "text-blue-600 hover:text-blue-700"
                    )}
                  >
                    {isCompleted ? "Undo" : "Mark Done"}
                  </Button>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Enhanced Start Cooking Mode */}
        {!cookingMode && onCookingModeToggle && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-8 bg-gradient-to-br from-orange-100 via-amber-50 to-orange-50 rounded-2xl border-2 border-orange-200 shadow-lg"
          >
            <div className="text-center space-y-4">
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                <ChefHat className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Ready to Cook?</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Enter Kitchen Mode for hands-free cooking with timers, voice guidance, and large text perfect for the kitchen.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <Button
                  onClick={onCookingModeToggle}
                  size="lg"
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white h-14 px-8 text-lg font-semibold shadow-lg"
                >
                  <Play className="w-5 h-5 mr-3" />
                  Start Kitchen Mode
                </Button>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Timer className="w-4 h-4" />
                  <span>Includes timers & voice guidance</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}