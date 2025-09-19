"use client"

import React, { useState } from 'react'
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
  Eye
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


export function InstructionViewer({
  instructions,
  completedSteps,
  onToggleStep,
  cookingMode = false,
  onCookingModeToggle,
  currentStep = 0,
  onStepChange
}: InstructionViewerProps) {
  // Debug logging
  console.log('InstructionViewer props:', {
    instructions: instructions?.length || 0,
    cookingMode,
    currentStep,
    hasOnStepChange: !!onStepChange,
    hasOnCookingModeToggle: !!onCookingModeToggle
  })

  // Parse instructions into structured items
  const parsedInstructions: InstructionItem[] = instructions.map((instruction, index) => {
    const trimmed = instruction.trim()
    let type: 'title' | 'note' | 'step' = 'step'
    let content = trimmed

    if (trimmed.startsWith('#')) {
      type = 'title'
      content = trimmed.slice(1).trim()
    } else if (trimmed.startsWith('>')) {
      // Check if it's a numbered step (like "> 1 Do something") or just a note
      const afterArrow = trimmed.slice(1).trim()
      if (/^\d+\s/.test(afterArrow)) {
        // It's a numbered step like "> 1 Mix ingredients"
        type = 'step'
        content = afterArrow
      } else {
        // It's a regular note like "> Note: Make sure to..."
        type = 'note'
        content = afterArrow
      }
    }

    return { type, content, index }
  })

  // Add step numbers only to actual cooking steps that don't already have numbers
  let stepCounter = 1
  parsedInstructions.forEach(item => {
    if (item.type === 'step') {
      // Check if the content already starts with a number
      if (/^\d+\s/.test(item.content)) {
        // Extract the existing number
        const match = item.content.match(/^(\d+)\s(.*)/)
        if (match) {
          item.stepNumber = parseInt(match[1])
          item.content = match[2] // Remove the number from content
        }
      } else {
        // Add sequential number for unnumbered steps
        item.stepNumber = stepCounter++
      }
    }
  })

  // Get only the actual cooking steps for cooking mode
  const cookingSteps = parsedInstructions.filter(item => item.type === 'step')
  const totalSteps = cookingSteps.length
  const completedCount = cookingSteps.filter(step => completedSteps.has(step.index)).length

  // Get current cooking step
  const currentCookingStep = cookingSteps[currentStep]

  console.log('Parsed data:', {
    totalSteps,
    currentCookingStep: currentCookingStep?.content || 'none',
    cookingMode
  })

  if (cookingMode) {
    return (
      <Card className="border-orange-300 bg-orange-50">
        <CardHeader className="bg-orange-500 text-white">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ChefHat className="w-6 h-6" />
              Cooking Mode
              <Badge className="bg-white/20 text-white">
                Step {currentStep + 1} of {totalSteps}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                console.log('Exit cooking mode clicked')
                onCookingModeToggle && onCookingModeToggle()
              }}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Exit
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Progress */}
          <div className="mb-6">
            <Progress
              value={((currentStep + 1) / totalSteps) * 100}
              className="h-3"
            />
          </div>

          {/* Current Step */}
          {currentCookingStep && (
            <div className="bg-white rounded-lg p-6 mb-6 border border-orange-200">
              <div className="flex items-start gap-4">
                <div className="bg-orange-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold shrink-0">
                  {currentCookingStep.stepNumber}
                </div>
                <div className="flex-1">
                  <div className="text-xl leading-relaxed text-gray-900">
                    <TextFormatter isInstruction={true}>{currentCookingStep.content}</TextFormatter>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              onClick={() => {
                console.log('Previous clicked, current step:', currentStep)
                onStepChange && onStepChange(Math.max(0, currentStep - 1))
              }}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </Button>

            <Button
              onClick={() => {
                console.log('Complete clicked, current step:', currentCookingStep?.index)
                currentCookingStep && onToggleStep(currentCookingStep.index)
              }}
              className={cn(
                "flex items-center gap-2",
                currentCookingStep && completedSteps.has(currentCookingStep.index)
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "bg-orange-500 hover:bg-orange-600 text-white"
              )}
            >
              <CheckCircle className="w-4 h-4" />
              {currentCookingStep && completedSteps.has(currentCookingStep.index) ? "Done" : "Complete"}
            </Button>

            <Button
              onClick={() => {
                console.log('Next clicked, current step:', currentStep, 'total:', totalSteps)
                onStepChange && onStepChange(Math.min(totalSteps - 1, currentStep + 1))
              }}
              disabled={currentStep === totalSteps - 1}
              className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Step Overview */}
          <div className="mt-6 pt-6 border-t border-orange-200">
            <p className="text-sm font-medium text-gray-700 mb-3">Steps:</p>
            <div className="flex flex-wrap gap-2">
              {cookingSteps.map((step, index) => (
                <Button
                  key={step.index}
                  variant={index === currentStep ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    console.log('Step overview clicked, going to step:', index)
                    onStepChange && onStepChange(index)
                  }}
                  className={cn(
                    "w-8 h-8 p-0",
                    completedSteps.has(step.index) && "bg-green-500 hover:bg-green-600 text-white"
                  )}
                >
                  {completedSteps.has(step.index) ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    step.stepNumber
                  )}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
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
              onClick={() => {
                console.log('Start cooking mode clicked')
                onCookingModeToggle()
              }}
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
                  onClick={() => {
                    console.log('Start Kitchen Mode (big button) clicked')
                    onCookingModeToggle && onCookingModeToggle()
                  }}
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