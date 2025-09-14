"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calculator, Users, Clock, ChefHat } from "lucide-react"
import { toast } from "sonner"

interface Recipe {
  id: string
  title: string
  servings?: number
  ingredients: string[]
  instructions: string[]
  prepTime?: number
  cookTime?: number
}

interface ScaledIngredient {
  original: string
  scaled: string
  amount: number
  unit: string
  ingredient: string
  scaleFactor: number
}

interface RecipeScalingProps {
  recipe: Recipe
  onScaledRecipe?: (scaledRecipe: Recipe & { scaleFactor: number }) => void
}

export function RecipeScaling({ recipe, onScaledRecipe }: RecipeScalingProps) {
  const [targetServings, setTargetServings] = useState(recipe.servings || 4)
  const [scaledIngredients, setScaledIngredients] = useState<ScaledIngredient[]>([])
  const [scaleFactor, setScaleFactor] = useState(1)
  const [isScaling, setIsScaling] = useState(false)

  const originalServings = recipe.servings || 4

  useEffect(() => {
    calculateScaling()
  }, [targetServings, recipe])

  const calculateScaling = () => {
    const newScaleFactor = targetServings / originalServings
    setScaleFactor(newScaleFactor)

    const scaled = recipe.ingredients.map(ingredient => {
      const parsed = parseIngredient(ingredient)
      if (parsed.amount) {
        const scaledAmount = parsed.amount * newScaleFactor
        const scaledIngredient = formatScaledIngredient(scaledAmount, parsed.unit, parsed.ingredient)
        return {
          original: ingredient,
          scaled: scaledIngredient,
          amount: scaledAmount,
          unit: parsed.unit,
          ingredient: parsed.ingredient,
          scaleFactor: newScaleFactor
        }
      }
      return {
        original: ingredient,
        scaled: ingredient,
        amount: 0,
        unit: '',
        ingredient: parsed.ingredient,
        scaleFactor: newScaleFactor
      }
    })

    setScaledIngredients(scaled)
  }

  const applyScaling = () => {
    setIsScaling(true)

    const scaledRecipe: Recipe & { scaleFactor: number } = {
      ...recipe,
      servings: targetServings,
      ingredients: scaledIngredients.map(item => item.scaled),
      instructions: scaleInstructions(recipe.instructions, scaleFactor),
      prepTime: scaleCookingTime(recipe.prepTime, scaleFactor),
      cookTime: scaleCookingTime(recipe.cookTime, scaleFactor),
      scaleFactor
    }

    // Save scaling to backend for analytics
    saveScaling(recipe.id, originalServings, targetServings, scaleFactor)

    onScaledRecipe?.(scaledRecipe)
    toast.success(`Recipe scaled for ${targetServings} servings!`)
    setIsScaling(false)
  }

  const resetScaling = () => {
    setTargetServings(originalServings)
  }

  const saveScaling = async (recipeId: string, original: number, target: number, factor: number) => {
    try {
      await fetch('/api/recipes/scaling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeId,
          originalServings: original,
          targetServings: target,
          scaleFactor: factor,
          scaledIngredients: scaledIngredients.map(item => ({
            original: item.original,
            scaled: item.scaled,
            amount: item.amount,
            unit: item.unit
          }))
        })
      })
    } catch (error) {
      console.error('Failed to save scaling:', error)
    }
  }

  const getScaleFactorColor = () => {
    if (scaleFactor < 0.5) return "text-red-600"
    if (scaleFactor < 1) return "text-orange-600"
    if (scaleFactor > 2) return "text-purple-600"
    if (scaleFactor > 1) return "text-green-600"
    return "text-gray-600"
  }

  const getScaleDescription = () => {
    if (scaleFactor < 0.5) return "Very small batch"
    if (scaleFactor < 1) return "Smaller batch"
    if (scaleFactor === 1) return "Original recipe"
    if (scaleFactor <= 2) return "Larger batch"
    return "Very large batch"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calculator className="mr-2 h-5 w-5" />
          Recipe Scaling
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Serving Size Controls */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-muted-foreground">{originalServings}</div>
              <div className="text-sm text-muted-foreground">Original</div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTargetServings(Math.max(1, targetServings - 1))}
              >
                -
              </Button>
              <Input
                type="number"
                min="1"
                max="100"
                value={targetServings}
                onChange={(e) => setTargetServings(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTargetServings(targetServings + 1)}
              >
                +
              </Button>
            </div>

            <div className="text-center">
              <div className={`text-2xl font-bold ${getScaleFactorColor()}`}>
                {targetServings}
              </div>
              <div className="text-sm text-muted-foreground">Target</div>
            </div>
          </div>

          <div className="text-right">
            <Badge variant="outline" className={getScaleFactorColor()}>
              {scaleFactor.toFixed(2)}x
            </Badge>
            <div className="text-sm text-muted-foreground mt-1">
              {getScaleDescription()}
            </div>
          </div>
        </div>

        {/* Quick Serving Presets */}
        <div className="flex flex-wrap gap-2">
          {[1, 2, 4, 6, 8, 12, 16].map(servings => (
            <Button
              key={servings}
              variant={targetServings === servings ? "default" : "outline"}
              size="sm"
              onClick={() => setTargetServings(servings)}
            >
              <Users className="mr-1 h-3 w-3" />
              {servings}
            </Button>
          ))}
        </div>

        {/* Scaled Ingredients Preview */}
        {scaleFactor !== 1 && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium mb-3">Scaled Ingredients ({targetServings} servings)</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {scaledIngredients.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded border"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{item.scaled}</div>
                      {item.original !== item.scaled && (
                        <div className="text-sm text-muted-foreground line-through">
                          {item.original}
                        </div>
                      )}
                    </div>
                    {item.amount > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {formatScaleFactor(item.scaleFactor)}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Cooking Time Adjustments */}
        {scaleFactor !== 1 && (recipe.prepTime || recipe.cookTime) && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium mb-3">Adjusted Cooking Times</h4>
              <div className="grid grid-cols-2 gap-4">
                {recipe.prepTime && (
                  <div className="text-center p-3 rounded border">
                    <Clock className="h-4 w-4 mx-auto mb-1" />
                    <div className="text-sm text-muted-foreground">Prep Time</div>
                    <div className="font-medium">
                      {scaleCookingTime(recipe.prepTime, scaleFactor)} min
                    </div>
                    {scaleFactor !== 1 && (
                      <div className="text-xs text-muted-foreground">
                        was {recipe.prepTime} min
                      </div>
                    )}
                  </div>
                )}
                {recipe.cookTime && (
                  <div className="text-center p-3 rounded border">
                    <ChefHat className="h-4 w-4 mx-auto mb-1" />
                    <div className="text-sm text-muted-foreground">Cook Time</div>
                    <div className="font-medium">
                      {scaleCookingTime(recipe.cookTime, scaleFactor)} min
                    </div>
                    {scaleFactor !== 1 && (
                      <div className="text-xs text-muted-foreground">
                        was {recipe.cookTime} min
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Scaling Tips */}
        {scaleFactor !== 1 && (
          <>
            <Separator />
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Scaling Tips</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                {getScalingTips(scaleFactor).map((tip, index) => (
                  <li key={index}>• {tip}</li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {scaleFactor !== 1 && (
            <Button onClick={applyScaling} disabled={isScaling}>
              <Calculator className="mr-2 h-4 w-4" />
              {isScaling ? "Scaling..." : `Scale to ${targetServings} servings`}
            </Button>
          )}
          {scaleFactor !== 1 && (
            <Button variant="outline" onClick={resetScaling}>
              Reset to Original
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Helper functions
function parseIngredient(ingredient: string): {
  amount: number | null
  unit: string
  ingredient: string
} {
  // Parse different fraction formats
  const fractionRegex = /^(\d+\/\d+|\d+\s+\d+\/\d+|\d+\.?\d*)/
  const match = ingredient.match(fractionRegex)

  if (match) {
    const amountStr = match[1]
    let amount: number

    if (amountStr.includes('/')) {
      // Handle fractions like "1/2" or "1 1/2"
      if (amountStr.includes(' ')) {
        const [whole, fraction] = amountStr.split(' ')
        const [num, den] = fraction.split('/').map(Number)
        amount = Number(whole) + num / den
      } else {
        const [num, den] = amountStr.split('/').map(Number)
        amount = num / den
      }
    } else {
      amount = Number(amountStr)
    }

    const remainder = ingredient.replace(fractionRegex, '').trim()
    const words = remainder.split(' ')
    const unit = words[0] || ''
    const ingredientName = words.slice(1).join(' ') || remainder

    return {
      amount,
      unit,
      ingredient: ingredientName
    }
  }

  return {
    amount: null,
    unit: '',
    ingredient: ingredient
  }
}

function formatScaledIngredient(amount: number, unit: string, ingredient: string): string {
  const formattedAmount = formatAmount(amount)
  return `${formattedAmount}${unit ? ` ${unit}` : ''} ${ingredient}`.trim()
}

function formatAmount(amount: number): string {
  // Convert decimal to fraction for common cooking measurements
  const tolerance = 0.01
  const commonFractions = [
    { decimal: 0.125, fraction: "1/8" },
    { decimal: 0.25, fraction: "1/4" },
    { decimal: 0.33, fraction: "1/3" },
    { decimal: 0.5, fraction: "1/2" },
    { decimal: 0.67, fraction: "2/3" },
    { decimal: 0.75, fraction: "3/4" }
  ]

  const whole = Math.floor(amount)
  const decimal = amount - whole

  // Find matching fraction
  for (const { decimal: d, fraction } of commonFractions) {
    if (Math.abs(decimal - d) < tolerance) {
      return whole > 0 ? `${whole} ${fraction}` : fraction
    }
  }

  // Return decimal if no fraction match
  if (amount % 1 === 0) {
    return amount.toString()
  }

  return amount.toFixed(2).replace(/\.?0+$/, '')
}

function formatScaleFactor(factor: number): string {
  return factor === 1 ? "1x" : `${factor.toFixed(1)}x`
}

function scaleInstructions(instructions: string[], scaleFactor: number): string[] {
  // Scale time references in instructions
  return instructions.map(instruction => {
    return instruction.replace(/(\d+)\s*(minutes?|mins?|hours?|hrs?)/gi, (match, time, unit) => {
      const originalTime = parseInt(time)
      let scaledTime = Math.round(originalTime * getTimeScaleFactor(scaleFactor))

      // Don't scale very short times
      if (originalTime <= 2) {
        scaledTime = originalTime
      }

      return `${scaledTime} ${unit}`
    })
  })
}

function scaleCookingTime(time: number | undefined, scaleFactor: number): number {
  if (!time) return 0

  const timeScaleFactor = getTimeScaleFactor(scaleFactor)
  const scaledTime = Math.round(time * timeScaleFactor)

  // Don't scale very short times
  return time <= 5 ? time : scaledTime
}

function getTimeScaleFactor(scaleFactor: number): number {
  // Cooking time doesn't scale linearly
  if (scaleFactor <= 0.5) return 0.8
  if (scaleFactor <= 1) return 0.9 + (scaleFactor - 0.5) * 0.2
  if (scaleFactor <= 2) return 1 + (scaleFactor - 1) * 0.3
  return 1.3 + (scaleFactor - 2) * 0.1
}

function getScalingTips(scaleFactor: number): string[] {
  const tips = []

  if (scaleFactor < 0.5) {
    tips.push("Very small batches may cook faster - watch carefully")
    tips.push("Consider using smaller cookware for better heat distribution")
  } else if (scaleFactor < 1) {
    tips.push("Smaller batches may cook slightly faster - reduce cooking time by 10-20%")
    tips.push("Use appropriately sized cookware to avoid overcrowding or underfilling")
  } else if (scaleFactor > 2) {
    tips.push("Large batches take longer to cook through - increase cooking time by 20-30%")
    tips.push("You may need larger cookware or cook in multiple batches")
    tips.push("Stir more frequently to ensure even cooking")
  } else if (scaleFactor > 1) {
    tips.push("Larger batches may need slightly more cooking time")
    tips.push("Ensure your cookware is large enough to accommodate the scaled recipe")
  }

  // Universal tips
  tips.push("Taste and adjust seasonings after scaling")
  tips.push("Spices and seasonings may need fine-tuning when scaling")

  return tips
}