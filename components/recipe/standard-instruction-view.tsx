"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AccessibleButton } from "@/components/ui/accessible-button"
import {
  ChefHat,
  CheckCircle,
  Play,
  Eye,
  Timer
} from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { TextFormatter } from "@/components/text-formatter"
import { InstructionItem } from "@/hooks/use-instruction-parser"

interface StandardInstructionViewProps {
  parsedInstructions: InstructionItem[]
  cookingSteps: InstructionItem[]
  completedSteps: Set<number>
  onToggleStep: (index: number) => void
  onCookingModeToggle?: () => void
}

export function StandardInstructionView({
  parsedInstructions,
  cookingSteps,
  completedSteps,
  onToggleStep,
  onCookingModeToggle
}: StandardInstructionViewProps) {
  const totalSteps = cookingSteps.length
  const completedCount = cookingSteps.filter(step => completedSteps.has(step.index)).length

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
            <AccessibleButton
              variant="ghost"
              size="sm"
              onClick={onCookingModeToggle}
              className="text-white hover:bg-white/20"
              ariaLabel="Enter cooking mode for hands-free cooking"
            >
              <Play className="w-4 h-4 mr-2" />
              Cooking Mode
            </AccessibleButton>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* Progress Summary */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-600">
              {completedCount} of {totalSteps} completed
            </span>
          </div>
          <Progress
            value={(completedCount / totalSteps) * 100}
            className="h-2"
            aria-label={`Recipe progress: ${completedCount} of ${totalSteps} steps completed`}
          />
        </div>

        {/* Instructions List */}
        <div className="space-y-4" role="list" aria-label="Recipe instructions">
          {parsedInstructions.map((item, index) => {
            if (item.type === 'title') {
              return (
                <motion.div
                  key={`title-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="font-bold text-xl text-gray-800 mt-8 mb-4 border-b-2 border-blue-200 pb-2"
                  role="heading"
                  aria-level={3}
                >
                  <TextFormatter>{item.content}</TextFormatter>
                </motion.div>
              )
            }

            if (item.type === 'note') {
              return (
                <motion.div
                  key={`note-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg my-4"
                  role="note"
                  aria-label="Recipe note"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="bg-amber-400 text-white rounded-full w-6 h-6 flex items-center justify-center shrink-0 mt-0.5"
                      aria-hidden="true"
                    >
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
                key={`step-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={cn(
                  "flex gap-4 p-4 rounded-xl transition-all duration-300 border",
                  isCompleted
                    ? "bg-green-50 border-green-200"
                    : "bg-gray-50 hover:bg-blue-50 border-transparent hover:border-blue-200"
                )}
                role="listitem"
              >
                <AccessibleButton
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors shrink-0 p-0",
                    isCompleted
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  )}
                  onClick={() => onToggleStep(item.index)}
                  ariaLabel={
                    isCompleted
                      ? `Mark step ${item.stepNumber} as not completed`
                      : `Mark step ${item.stepNumber} as completed`
                  }
                  ariaPressed={isCompleted}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    item.stepNumber
                  )}
                </AccessibleButton>
                <div className="flex-1">
                  <div
                    className={cn(
                      "leading-relaxed transition-colors",
                      isCompleted
                        ? "text-green-800 line-through"
                        : "text-gray-700"
                    )}
                  >
                    <TextFormatter isInstruction={true}>
                      {item.content}
                    </TextFormatter>
                  </div>
                  <AccessibleButton
                    size="sm"
                    variant="ghost"
                    onClick={() => onToggleStep(item.index)}
                    className={cn(
                      "mt-2 h-8",
                      isCompleted
                        ? "text-green-600 hover:text-green-700"
                        : "text-blue-600 hover:text-blue-700"
                    )}
                    ariaLabel={
                      isCompleted
                        ? `Undo completion of step ${item.stepNumber}`
                        : `Mark step ${item.stepNumber} as done`
                    }
                  >
                    {isCompleted ? "Undo" : "Mark Done"}
                  </AccessibleButton>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Enhanced Start Cooking Mode */}
        {!onCookingModeToggle ? null : (
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
                <AccessibleButton
                  onClick={onCookingModeToggle}
                  size="lg"
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white h-14 px-8 text-lg font-semibold shadow-lg"
                  ariaLabel="Start kitchen mode for hands-free cooking"
                >
                  <Play className="w-5 h-5 mr-3" />
                  Start Kitchen Mode
                </AccessibleButton>
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