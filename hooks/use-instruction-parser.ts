"use client"

import { useMemo } from 'react'

export interface InstructionItem {
  type: 'title' | 'note' | 'step'
  content: string
  index: number
  stepNumber?: number
}

export function useInstructionParser(instructions: string[]) {
  const parsedInstructions = useMemo((): InstructionItem[] => {
    return instructions.map((instruction, index) => {
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
  }, [instructions])

  const numberedInstructions = useMemo(() => {
    // Add step numbers only to actual cooking steps that don't already have numbers
    let stepCounter = 1
    return parsedInstructions.map(item => {
      if (item.type === 'step') {
        // Check if the content already starts with a number
        if (/^\d+\s/.test(item.content)) {
          // Extract the existing number
          const match = item.content.match(/^(\d+)\s(.*)/)
          if (match) {
            return {
              ...item,
              stepNumber: parseInt(match[1]),
              content: match[2] // Remove the number from content
            }
          }
        } else {
          // Add sequential number for unnumbered steps
          return {
            ...item,
            stepNumber: stepCounter++
          }
        }
      }
      return item
    })
  }, [parsedInstructions])

  const cookingSteps = useMemo(() => {
    return numberedInstructions.filter(item => item.type === 'step')
  }, [numberedInstructions])

  const getStepByNumber = useMemo(() => {
    const stepMap = new Map<number, InstructionItem>()
    cookingSteps.forEach((step, index) => {
      stepMap.set(index, step)
    })
    return (stepIndex: number) => stepMap.get(stepIndex)
  }, [cookingSteps])

  const getTotalSteps = useMemo(() => cookingSteps.length, [cookingSteps])

  const getStepProgress = useMemo(() => {
    return (completedSteps: Set<number>) => {
      const completedCount = cookingSteps.filter(step =>
        completedSteps.has(step.index)
      ).length
      return {
        completed: completedCount,
        total: getTotalSteps,
        percentage: getTotalSteps > 0 ? (completedCount / getTotalSteps) * 100 : 0
      }
    }
  }, [cookingSteps, getTotalSteps])

  const getNextStep = useMemo(() => {
    return (currentStepIndex: number) => {
      const nextIndex = currentStepIndex + 1
      return nextIndex < getTotalSteps ? nextIndex : null
    }
  }, [getTotalSteps])

  const getPreviousStep = useMemo(() => {
    return (currentStepIndex: number) => {
      const prevIndex = currentStepIndex - 1
      return prevIndex >= 0 ? prevIndex : null
    }
  }, [])

  return {
    parsedInstructions: numberedInstructions,
    cookingSteps,
    getStepByNumber,
    getTotalSteps,
    getStepProgress,
    getNextStep,
    getPreviousStep
  }
}